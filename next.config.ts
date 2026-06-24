import type { NextConfig } from "next";

const isGithubPages = process.env.NEXT_PUBLIC_GITHUB_PAGES === "true";
const repositoryName = "procurement-workflow-os";
const hasCustomDomain = Boolean(
  process.env.GITHUB_PAGES_CUSTOM_DOMAIN || process.env.NEXT_PUBLIC_GITHUB_PAGES_CUSTOM_DOMAIN,
);
const configuredBasePath =
  isGithubPages && !hasCustomDomain
    ? `/${repositoryName}`
    : (process.env.NEXT_PUBLIC_SITE_BASE_PATH ?? "");
const basePath = configuredBasePath === "/" ? "" : configuredBasePath.replace(/\/$/, "");

const nextConfig: NextConfig = {
  output: isGithubPages ? "export" : undefined,
  basePath: isGithubPages && basePath ? basePath : undefined,
  assetPrefix: isGithubPages && basePath ? `${basePath}/` : undefined,
  trailingSlash: isGithubPages,
};

export default nextConfig;
