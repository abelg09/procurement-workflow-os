import type { NextConfig } from "next";

const isGithubPages = process.env.NEXT_PUBLIC_GITHUB_PAGES === "true";
const repositoryName = "procurement-workflow-os";

const nextConfig: NextConfig = {
  output: isGithubPages ? "export" : undefined,
  basePath: isGithubPages ? `/${repositoryName}` : undefined,
  assetPrefix: isGithubPages ? `/${repositoryName}/` : undefined,
  trailingSlash: isGithubPages,
};

export default nextConfig;
