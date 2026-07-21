import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { createClient } from "@supabase/supabase-js";

const backupDir = process.env.BACKUP_DIR || "live-backup";
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey) {
  console.error(
    "Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY. Backup cannot run.",
  );
  process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

function countArray(value) {
  return Array.isArray(value) ? value.length : 0;
}

function requestNumber(request) {
  const match = String(request?.id || "").match(/^PR-(\d+)$/);
  return match ? Number(match[1]) : 0;
}

async function writeJson(fileName, value) {
  await writeFile(
    path.join(backupDir, fileName),
    `${JSON.stringify(value, null, 2)}\n`,
    "utf8",
  );
}

async function listStorageObjects(bucketName, prefix = "") {
  const collected = [];
  let offset = 0;
  const limit = 100;

  while (true) {
    const { data, error } = await supabase.storage
      .from(bucketName)
      .list(prefix, {
        limit,
        offset,
        sortBy: { column: "name", order: "asc" },
      });

    if (error) {
      return {
        bucket: bucketName,
        prefix,
        error: error.message,
        objects: collected,
      };
    }

    const rows = data || [];
    for (const item of rows) {
      const objectPath = prefix ? `${prefix}/${item.name}` : item.name;
      collected.push({
        path: objectPath,
        id: item.id,
        name: item.name,
        created_at: item.created_at,
        updated_at: item.updated_at,
        last_accessed_at: item.last_accessed_at,
        metadata: item.metadata,
      });

      if (item.id === null) {
        const nested = await listStorageObjects(bucketName, objectPath);
        collected.push(...(nested.objects || []));
      }
    }

    if (rows.length < limit) {
      break;
    }
    offset += limit;
  }

  return {
    bucket: bucketName,
    prefix,
    objects: collected,
  };
}

await mkdir(backupDir, { recursive: true });

const { data: appStateRow, error: appStateError } = await supabase
  .from("procurement_app_state")
  .select("id,state,updated_at,updated_by")
  .eq("id", "default")
  .single();

if (appStateError) {
  console.error(`Could not export procurement_app_state: ${appStateError.message}`);
  process.exit(1);
}

const state = appStateRow?.state || {};
const requests = Array.isArray(state.requests) ? state.requests : [];
const maxRequestId = requests.reduce(
  (max, request) => Math.max(max, requestNumber(request)),
  0,
);

const { data: buckets, error: bucketsError } = await supabase.storage.listBuckets();
const bucketNames = bucketsError ? [] : (buckets || []).map((bucket) => bucket.name);
const storageInventory = [];

for (const bucketName of bucketNames) {
  storageInventory.push(await listStorageObjects(bucketName));
}

const summary = {
  generatedAt: new Date().toISOString(),
  source: supabaseUrl,
  appStateRow: {
    id: appStateRow?.id,
    updated_at: appStateRow?.updated_at,
    updated_by: appStateRow?.updated_by,
  },
  counts: {
    requests: requests.length,
    notifications: countArray(state.notifications),
    auditLogs: countArray(state.auditLogs),
    invoices: countArray(state.invoices),
    attachments: countArray(state.attachments),
    users: countArray(state.users),
    projects: countArray(state.projects),
  },
  maxRequestId: maxRequestId > 0 ? `PR-${maxRequestId}` : null,
  storage: {
    bucketCount: bucketNames.length,
    objectCount: storageInventory.reduce(
      (total, bucket) => total + countArray(bucket.objects),
      0,
    ),
    bucketListError: bucketsError?.message || null,
  },
};

await writeJson("procurement_app_state-default.json", appStateRow);
await writeJson("storage-inventory.json", storageInventory);
await writeJson("backup-summary.json", summary);

console.log(
  `Backup exported: ${summary.counts.requests} requests, latest ${summary.maxRequestId || "none"}, ${summary.storage.objectCount} storage object(s) inventoried.`,
);
