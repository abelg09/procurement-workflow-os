// Shrink the live state row by moving embedded invoice files (base64 "data:"
// URLs stored INSIDE the giant procurement_app_state row) out to the
// procurement-files Storage bucket, setting a short storage path on each
// invoice, and STRIPPING the base64 from the state. Embedded files are what
// bloated the row to ~10 MB, which makes the Supabase state read time out (500)
// and blocks every save for everyone.
//
// SAFE BY DEFAULT: dry run unless APPLY=true. Before any change it (1) writes a
// full JSON backup of the state, and (2) copies every file's bytes into the
// invoice_file_archive table AND uploads them to Storage — so each file exists
// in THREE places (backup file + archive table + Storage) before its base64 is
// removed from the state. The state is written back with an optimistic lock, so
// it aborts cleanly if anyone saved meanwhile.
//
// The download link keeps working because each invoice gets
// uploadedInvoiceStoragePath, which the app's viewer uses to sign a URL.
//
// Env: NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, APPLY ("true"),
//      BACKUP_DIR (default "invoice-migrate-backup").

import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { createClient } from "@supabase/supabase-js";

const STATE_ROW_ID = "default";
const BUCKET = "procurement-files";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const APPLY = process.env.APPLY === "true";
const backupDir = process.env.BACKUP_DIR || "invoice-migrate-backup";

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
  const buffer = isBase64
    ? Buffer.from(raw, "base64")
    : Buffer.from(decodeURIComponent(raw), "utf8");
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
  const cleaned = String(value || "")
    .replace(/[^a-zA-Z0-9._-]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 120);
  return cleaned || "invoice";
}

// Any invoice string field that holds a large "data:" URL is embedded file
// bytes — the bloat. Scan generically so we catch it regardless of which field
// name it landed in (uploadedInvoiceDataUrl, uploadedInvoiceFile, etc.).
function embeddedFields(invoice) {
  const fields = [];
  for (const [field, value] of Object.entries(invoice || {})) {
    if (typeof value === "string" && value.startsWith("data:") && value.length > 200) {
      fields.push({ field, value });
    }
  }
  // Largest first — the biggest one becomes the file we surface in Storage.
  return fields.sort((a, b) => b.value.length - a.value.length);
}

const stats = {
  requests: 0,
  invoicesScanned: 0,
  embeddedFiles: 0,
  embeddedBytes: 0,
  uploaded: 0,
  archived: 0,
  strippedInvoices: 0,
  failures: 0,
};

async function processInvoice(invoice, requestId, seqRef) {
  if (!invoice || typeof invoice !== "object") return;
  stats.invoicesScanned += 1;
  const fields = embeddedFields(invoice);
  if (fields.length === 0) return;

  let primaryHandled = false;
  let strippedAny = false;

  for (const { field, value } of fields) {
    stats.embeddedFiles += 1;
    const parsed = parseDataUrl(value);
    if (!parsed) {
      stats.failures += 1;
      console.error(`  ! ${requestId}: could not decode embedded "${field}"`);
      continue;
    }
    stats.embeddedBytes += parsed.buffer.length;
    const seq = (seqRef.n += 1);
    const existingName =
      typeof invoice.uploadedInvoiceFile === "string" &&
      !invoice.uploadedInvoiceFile.startsWith("data:")
        ? invoice.uploadedInvoiceFile
        : null;
    const fileName = safeName(existingName || `invoice-${seq}.${extForMime(parsed.mime)}`);
    console.log(
      `  ${requestId} / ${fileName} (${(parsed.buffer.length / 1024).toFixed(0)} KB) [${field}]`,
    );

    if (!APPLY) {
      strippedAny = true;
      continue;
    }

    // 1) Safety copy of the raw bytes into the archive table.
    const { error: archErr } = await supabase.from("invoice_file_archive").insert({
      request_id: requestId,
      file_name: fileName,
      file_type: parsed.mime,
      data_url: value,
    });
    if (archErr) {
      stats.failures += 1;
      console.error(`  ! ${requestId}: archive insert failed — ${archErr.message}`);
      continue;
    }
    stats.archived += 1;

    // 2) Upload to Storage so the download keeps working.
    const storagePath = `invoices/${requestId}/migrated/${seq}-${fileName}`;
    const { error: upErr } = await supabase.storage.from(BUCKET).upload(storagePath, parsed.buffer, {
      contentType: parsed.mime,
      cacheControl: "3600",
      upsert: true,
    });
    if (upErr) {
      stats.failures += 1;
      console.error(`  ! ${requestId}: storage upload failed — ${upErr.message}`);
      continue;
    }
    stats.uploaded += 1;

    // 3) Point the invoice at the primary (largest) file, then strip the base64.
    if (!primaryHandled) {
      invoice.uploadedInvoiceStorageBucket = BUCKET;
      invoice.uploadedInvoiceStoragePath = storagePath;
      invoice.uploadedInvoiceFileType = invoice.uploadedInvoiceFileType || parsed.mime;
      invoice.uploadedInvoiceFileSize = invoice.uploadedInvoiceFileSize || parsed.buffer.length;
      invoice.uploadedInvoiceFile = fileName;
      primaryHandled = true;
    }
    if (field !== "uploadedInvoiceFile") {
      delete invoice[field];
    } else {
      invoice.uploadedInvoiceFile = fileName;
    }
    strippedAny = true;
  }

  if (strippedAny) stats.strippedInvoices += 1;
}

async function main() {
  console.log(`Mode: ${APPLY ? "APPLY (upload + archive + strip + write)" : "DRY RUN (no changes)"}`);

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
  const beforeBytes = JSON.stringify(state).length;

  await mkdir(backupDir, { recursive: true });
  await writeFile(
    path.join(backupDir, "procurement_app_state.pre-migrate.json"),
    `${JSON.stringify(state, null, 2)}\n`,
    "utf8",
  );
  console.log(`Backup written to ${backupDir}/ (state is ${(beforeBytes / 1024 / 1024).toFixed(2)} MB)`);

  const seqRef = { n: 0 };
  for (const request of state.requests || []) {
    stats.requests += 1;
    const requestId = request?.id || "unknown";
    if (request?.invoice) await processInvoice(request.invoice, requestId, seqRef);
    for (const inv of Array.isArray(request?.invoices) ? request.invoices : []) {
      await processInvoice(inv, requestId, seqRef);
    }
  }

  const afterBytes = JSON.stringify(state).length;
  console.log("");
  console.log(`Requests scanned:              ${stats.requests}`);
  console.log(`Invoices scanned:              ${stats.invoicesScanned}`);
  console.log(`Embedded files found:          ${stats.embeddedFiles}`);
  console.log(`Embedded bytes:                ${(stats.embeddedBytes / 1024 / 1024).toFixed(2)} MB`);
  console.log(`Uploaded to Storage:           ${stats.uploaded}`);
  console.log(`Archived (safety copy):        ${stats.archived}`);
  console.log(`Invoices stripped:             ${stats.strippedInvoices}`);
  console.log(`Failures:                      ${stats.failures}`);
  console.log(
    `State size:  before ${(beforeBytes / 1024 / 1024).toFixed(2)} MB  ->  after ${(afterBytes / 1024).toFixed(0)} kB`,
  );

  if (!APPLY) {
    console.log("\nDRY RUN complete — nothing changed. Re-run with APPLY=true to apply.");
    return;
  }
  if (stats.failures > 0) {
    console.error(
      "\nAborting state write because some files failed. The state row was NOT modified. Uploaded/archived copies are harmless; re-run to finish.",
    );
    process.exit(1);
  }
  if (stats.strippedInvoices === 0) {
    console.log("\nNothing to strip — no embedded invoices found. Row unchanged.");
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
      "\nThe workspace changed during migration (someone saved). Files were uploaded + archived (safe), but the row was NOT modified. Re-run when the app is quiet.",
    );
    process.exit(1);
  }

  console.log(
    `\n✅ Done. Stripped ${stats.strippedInvoices} invoices; state shrunk ${(beforeBytes / 1024 / 1024).toFixed(2)} MB -> ${(afterBytes / 1024).toFixed(0)} kB. Files preserved in Storage + archive.`,
  );
}

main().catch((err) => {
  console.error("Migration error:", err);
  process.exit(1);
});
