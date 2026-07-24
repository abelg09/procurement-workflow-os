// Restore invoice download links: take the invoice files that were moved out of
// the giant state row into the `invoice_file_archive` table, upload each into the
// `procurement-files` Storage bucket, and set `uploadedInvoiceStoragePath` on the
// matching invoice in the state so the app's viewer can generate a signed
// download URL again. This does NOT put file bytes back into the state row — only
// a short storage path per invoice (a few KB total), so the row stays tiny.
//
// SAFE BY DEFAULT: dry run unless APPLY=true. Backs up the full state first.
// Additive only (sets a storage path on invoices that lost it); writes the state
// back with an optimistic lock so it aborts cleanly if anyone saved meanwhile.
//
// Env: NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, APPLY ("true"),
//      BACKUP_DIR (default "invoice-restore-backup").

import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { createClient } from "@supabase/supabase-js";

const STATE_ROW_ID = "default";
const BUCKET = "procurement-files";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const APPLY = process.env.APPLY === "true";
const backupDir = process.env.BACKUP_DIR || "invoice-restore-backup";

if (!supabaseUrl || !serviceRoleKey) {
  console.error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY.");
  process.exit(1);
}

const supabase = createClient(supabaseUrl.replace(/\/$/, ""), serviceRoleKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

function parseDataUrl(dataUrl) {
  const match = /^data:([^;,]*)(;base64)?,([\s\S]*)$/.exec(dataUrl || "");
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
  console.log(`Mode: ${APPLY ? "APPLY (upload + write state)" : "DRY RUN (no changes)"}`);

  const { data: row, error } = await supabase
    .from("procurement_app_state")
    .select("state,updated_at")
    .eq("id", STATE_ROW_ID)
    .maybeSingle();
  if (error || !row?.state) {
    console.error("Failed to read state:", error?.message ?? "no row");
    process.exit(1);
  }
  const state = row.state;
  const originalUpdatedAt = row.updated_at;

  await mkdir(backupDir, { recursive: true });
  await writeFile(
    path.join(backupDir, "procurement_app_state.pre-restore.json"),
    `${JSON.stringify(state, null, 2)}\n`,
    "utf8",
  );
  console.log(`Backup written to ${backupDir}/`);

  const { data: archive, error: archErr } = await supabase
    .from("invoice_file_archive")
    .select("id,request_id,file_name,file_type,data_url")
    .order("id", { ascending: true });
  if (archErr) {
    console.error("Failed to read invoice_file_archive:", archErr.message);
    process.exit(1);
  }
  console.log(`Archived files available: ${(archive || []).length}`);

  // Queue archive rows per request so duplicate filenames within a request map in order.
  const archiveByRequest = new Map();
  for (const a of archive || []) {
    if (!archiveByRequest.has(a.request_id)) archiveByRequest.set(a.request_id, []);
    archiveByRequest.get(a.request_id).push({ ...a, used: false });
  }

  let matched = 0;
  let uploaded = 0;
  let failures = 0;
  let noArchive = 0;

  const restoreInvoice = async (invoice, requestId) => {
    if (!invoice || typeof invoice !== "object") return;
    if (invoice.uploadedInvoiceStoragePath) return; // already in Storage
    if (!invoice.uploadedInvoiceFile) return; // no file attached

    const queue = archiveByRequest.get(requestId) || [];
    let entry =
      queue.find((a) => !a.used && a.file_name === invoice.uploadedInvoiceFile) ||
      queue.find((a) => !a.used);
    if (!entry) {
      noArchive += 1;
      console.warn(`  ! ${requestId} / ${invoice.uploadedInvoiceFile}: no archived file found — skipped.`);
      return;
    }
    entry.used = true;

    const parsed = parseDataUrl(entry.data_url);
    if (!parsed) {
      failures += 1;
      console.error(`  ! ${requestId} / ${invoice.uploadedInvoiceFile}: could not decode archived file.`);
      return;
    }

    const fileName = safeName(invoice.uploadedInvoiceFile || entry.file_name || `invoice.${extForMime(parsed.mime)}`);
    const storagePath = `invoices/${requestId}/restored/${entry.id}-${fileName}`;
    console.log(
      `  ${requestId} / ${invoice.uploadedInvoiceFile} (${(parsed.buffer.length / 1024).toFixed(0)} KB) -> ${storagePath}`,
    );
    matched += 1;

    if (APPLY) {
      const { error: upErr } = await supabase.storage.from(BUCKET).upload(storagePath, parsed.buffer, {
        contentType: parsed.mime || entry.file_type || undefined,
        cacheControl: "3600",
        upsert: true,
      });
      if (upErr) {
        failures += 1;
        console.error(`  ! ${requestId}: upload failed — ${upErr.message}`);
        return;
      }
      uploaded += 1;
      invoice.uploadedInvoiceStorageBucket = BUCKET;
      invoice.uploadedInvoiceStoragePath = storagePath;
      invoice.uploadedInvoiceFileType = invoice.uploadedInvoiceFileType || parsed.mime || entry.file_type;
      invoice.uploadedInvoiceFileSize = invoice.uploadedInvoiceFileSize || parsed.buffer.length;
    }
  };

  for (const request of state.requests || []) {
    const requestId = request?.id || "unknown";
    if (request?.invoice) await restoreInvoice(request.invoice, requestId);
    for (const inv of Array.isArray(request?.invoices) ? request.invoices : []) {
      await restoreInvoice(inv, requestId);
    }
  }

  console.log("");
  console.log(`Invoices matched to an archived file: ${matched}`);
  console.log(`Files uploaded to Storage:            ${uploaded}`);
  console.log(`Invoices with no archived file:       ${noArchive}`);
  console.log(`Failures:                             ${failures}`);

  if (!APPLY) {
    console.log("\nDRY RUN complete — nothing changed. Re-run with APPLY=true to apply.");
    return;
  }
  if (failures > 0) {
    console.error("\nAborting state write because some files failed. Uploaded files are harmless; re-run to finish.");
    process.exit(1);
  }
  if (matched === 0) {
    console.log("\nNothing to restore — no invoices needed a link. Row unchanged.");
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
      "\nThe workspace changed during the restore (someone saved). Files were uploaded, but the row was NOT modified. Re-run when the app is quiet.",
    );
    process.exit(1);
  }

  console.log(`\n✅ Done. ${uploaded} invoice download links restored (files in Storage bucket "${BUCKET}").`);
}

main().catch((err) => {
  console.error("Restore error:", err);
  process.exit(1);
});
