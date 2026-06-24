import { existsSync, mkdirSync, renameSync, rmSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";

const root = dirname(dirname(fileURLToPath(import.meta.url)));
const apiDir = join(root, "src/app/api");
const disabledApiDir = join(root, ".pages-disabled-api");
let exitCode = 0;

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
    exitCode = result.status ?? 1;
  } else {
    writeFileSync(join(root, "out/.nojekyll"), "");
    const customDomain = process.env.GITHUB_PAGES_CUSTOM_DOMAIN?.trim();
    if (customDomain) {
      writeFileSync(join(root, "out/CNAME"), `${customDomain}\n`);
    }
  }
} finally {
  restoreApiRoutes();
}

if (exitCode !== 0) {
  process.exit(exitCode);
}
