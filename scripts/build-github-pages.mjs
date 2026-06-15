import { existsSync, mkdirSync, renameSync, rmSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";

const root = dirname(dirname(fileURLToPath(import.meta.url)));
const apiDir = join(root, "src/app/api");
const disabledApiDir = join(root, ".pages-disabled-api");

function restoreApiRoutes() {
  if (existsSync(disabledApiDir) && !existsSync(apiDir)) {
    renameSync(disabledApiDir, apiDir);
  }
}

try {
  rmSync(join(root, "out"), { recursive: true, force: true });
  rmSync(disabledApiDir, { recursive: true, force: true });

  if (existsSync(apiDir)) {
    renameSync(apiDir, disabledApiDir);
  }

  const result = spawnSync("next", ["build", "--webpack"], {
    cwd: root,
    env: {
      ...process.env,
      NEXT_PUBLIC_GITHUB_PAGES: "true",
    },
    stdio: "inherit",
    shell: process.platform === "win32",
  });

  if (result.status !== 0) {
    process.exit(result.status ?? 1);
  }

  writeFileSync(join(root, "out/.nojekyll"), "");
} finally {
  restoreApiRoutes();
}
