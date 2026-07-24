// One-time migration: move invoice files that were embedded as base64 data URLs
// inside the single procurement_app_state row into Supabase Storage, and strip
// the base64 from the state. This shrinks the row (which had grown to ~10 MB and
// was causing "canceling statement due to statement timeout"), WITHOUT losing any
// invoice — the files land in the `procurement-files` bucket at the exact path the
// app already reads (uploadedInvoiceStoragePath), so they stay downloadable in-app.
//
// SAFE BY DEFAULT: dry run unless APPLY=true. Always writes a full state backup
// first. Writes the shrunk state back only with an optimistic lock on updated_at,
// so it aborts (no changes) if anyone saved during the run.
//
// Env: NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, APPLY ("true" to write),
//      BACKUP_DIR (default "invoice-migration-backup").
//
// NOTE: run the statement_timeout raise first (see the app's DB notes) or the
// initial read of the oversized row can itself time out.

import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { createClient } from "@supabase/supabase-js";

const STATE_ROW_ID = "default";
const BUCKET = "procurement-files";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const APPLY = process.env.APPLY === "true";
const backupDir = process.env.BACKUP_DIR || "invoice-migration-backup";

if (!supabaseUrl || !serviceRoleKey) {
  console.error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY.");
  process.exit(1);
}

const supabase = createClient(supabaseUrl.replace(/\/$/, ""), serviceRoleKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const byteLen = (value) => Buffer.byteLength(typeof value === "string" ? value : JSON.stringify(value ?? ""), "utf8");
const mb = (bytes) => `${(bytes / 1024 / 1024).toFixed(2)} MB`;

function parseDataUrl(dataUrl) {
  const match = /^data:([^;,]*)(;base64)?,([\s\S]*)$/.exec(dataUrl);
  if (!match) return null;
  const mime = match[1] || "application/octet-stream";
  const isBase64 = Boolean(match[2]);
  const raw = match[3] || "";
  const buffer = isBase64 ? Buffer.from(raw, "base64") : Buffer.from(decodeURIComponent(raw), "utf8");
  return { mime, buffer };
}

function extForMime(mime) {
  return (
    {
      "application/pdf": "pdf",
      "image/png": "png",
      "image/jpeg": "jpg",
      "image/jpg": "jpg",
      "image/webp": "webp",
      "image/gif": "gif",
    }[mime] || "bin"
  );
}

function safeName(value) {
  const cleaned = String(value || "").replace(/[^a-zA-Z0-9._-]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 120);
  return cleaned || "invoice";
}

async function main() {
  console.log(`Mode: ${APPLY ? "APPLY (will upload files + write state)" : "DRY RUN (no changes)"}`);

  const { data: row, error } = await supabase
    .from("procurement_app_state")
    .select("state,updated_at")
    .eq("id", STATE_ROW_ID)
    .maybeSingle();

  if (error) {
    console.error("Failed to read state:", error.message);
    console.error("If this is a statement timeout, raise the DB statement_timeout first, then re-run.");
    process.exit(1);
  }
  if (!row || !row.state) {
    console.error("No procurement_app_state row found.");
    process.exit(1);
  }

  const state = row.state;
  const originalUpdatedAt = row.updated_at;
  const beforeBytes = byteLen(state);
  console.log(`Current row size: ${mb(beforeBytes)} | requests: ${(state.requests || []).length}`);

  // Always keep a full backup of the pre-migration state.
  await mkdir(backupDir, { recursive: true });
  const backupFile = path.join(backupDir, "procurement_app_state.pre-migration.json");
  await writeFile(backupFile, `${JSON.stringify(state, null, 2)}\n`, "utf8");
  console.log(`Backup written: ${backupFile}`);

  let handled = 0;
  let removedBytes = 0;
  let failures = 0;

  const migrateInvoice = async (invoice, requestId, key) => {
    if (!invoice || typeof invoice !== "object") return;
    const dataUrl = invoice.uploadedInvoiceDataUrl;
    if (typeof dataUrl !== "string" || dataUrl.length === 0) return;

    removedBytes += byteLen(dataUrl);

    // Already in Storage as well — the embedded copy is redundant; just drop it.
    if (invoice.uploadedInvoiceStoragePath) {
      console.log(`  ${requestId}: dataUrl is redundant (already in Storage) — will drop.`);
      if (APPLY) delete invoice.uploadedInvoiceDataUrl;
      handled += 1;
      return;
    }

    const parsed = parseDataUrl(dataUrl);
    if (!parsed) {
      console.warn(`  ! ${requestId}: could not parse data URL — leaving it untouched.`);
      removedBytes -= byteLen(dataUrl);
      failures += 1;
      return;
    }

    const baseName = safeName(invoice.uploadedInvoiceFile || `invoice.${extForMime(parsed.mime)}`);
    const fileName = baseName.includes(".") ? baseName : `${baseName}.${extForMime(parsed.mime)}`;
    const storagePath = `invoices/${requestId}/migrated/${key}-${fileName}`;
    console.log(`  ${requestId}: ${(parsed.buffer.length / 1024).toFixed(0)} KB (${parsed.mime}) -> ${storagePath}`);

    if (APPLY) {
      const { error: upErr } = await supabase.storage.from(BUCKET).upload(storagePath, parsed.buffer, {
        contentType: parsed.mime,
        cacheControl: "3600",
        upsert: true,
      });
      if (upErr) {
        console.error(`  ! ${requestId}: upload failed — ${upErr.message}`);
        removedBytes -= byteLen(dataUrl);
        failures += 1;
        return;
      }
      invoice.uploadedInvoiceStorageBucket = BUCKET;
      invoice.uploadedInvoiceStoragePath = storagePath;
      invoice.uploadedInvoiceFileType = invoice.uploadedInvoiceFileType || parsed.mime;
      invoice.uploadedInvoiceFileSize = invoice.uploadedInvoiceFileSize || parsed.buffer.length;
      delete invoice.uploadedInvoiceDataUrl;
    }
    handled += 1;
  };

  for (const request of state.requests || []) {
    const requestId = request?.id || "unknown";
    if (request?.invoice) await migrateInvoice(request.invoice, requestId, "single");
    const invoices = Array.isArray(request?.invoices) ? request.invoices : [];
    for (let i = 0; i < invoices.length; i += 1) {
      await migrateInvoice(invoices[i], requestId, invoices[i]?.id || `idx${i}`);
    }
  }

  const afterBytes = byteLen(state);
  console.log("");
  console.log(`Embedded invoice files handled: ${handled}`);
  console.log(`Embedded bytes removed:         ${mb(removedBytes)}`);
  console.log(`Parse/upload failures:          ${failures}`);
  console.log(`Projected row size after:       ${mb(afterBytes)} (was ${mb(beforeBytes)})`);

  if (!APPLY) {
    console.log("\nDRY RUN complete — nothing changed. Re-run with APPLY=true to apply.");
    return;
  }
  if (failures > 0) {
    console.error("\nAborting state write because some files failed. Nothing was written to the row.");
    process.exit(1);
  }
  if (handled === 0) {
    console.log("\nNothing to migrate — no embedded invoice files found. Row unchanged.");
    return;
  }

  const { data: updated, error: writeErr } = await supabase
    .from("procurement_app_state")
    .update({ state, updated_at: new Date().toISOString() })
    .eq("id", STATE_ROW_ID)
    .eq("updated_at", originalUpdatedAt)
    .select("updated_at");

  if (writeErr) {
    console.error("State write failed:", writeErr.message);
    process.exit(1);
  }
  if (!Array.isArray(updated) || updated.length === 0) {
    console.error(
      "\nThe workspace changed during the migration (someone saved). Files were uploaded to Storage, but the row was NOT modified. Re-run when the app is quiet.",
    );
    process.exit(1);
  }

  console.log(`\n✅ Done. Row shrunk from ${mb(beforeBytes)} to ${mb(afterBytes)}. Files preserved in Storage bucket "${BUCKET}".`);
}

main().catch((err) => {
  console.error("Migration error:", err);
  process.exit(1);
});
