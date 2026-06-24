import type { NextConfig } from "next";

const isGithubPages = process.env.NEXT_PUBLIC_GITHUB_PAGES === "true";
const repositoryName = "procurement-workflow-os";
const configuredBasePath =
  process.env.NEXT_PUBLIC_SITE_BASE_PATH ?? (isGithubPages ? `/${repositoryName}` : "");
const basePath = configuredBasePath === "/" ? "" : configuredBasePath.replace(/\/$/, "");

const nextConfig: NextConfig = {
  output: isGithubPages ? "export" : undefined,
  basePath: isGithubPages && basePath ? basePath : undefined,
  assetPrefix: isGithubPages && basePath ? `${basePath}/` : undefined,
  trailingSlash: isGithubPages,
};

export default nextConfig;
