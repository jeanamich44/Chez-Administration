import type { NextConfig } from "next";
import { execSync } from "child_process";

/* ===================================================================== */

let gitCommit = process.env.VERCEL_GIT_COMMIT_SHA || "";
let gitCommitDate = "";

try {
  if (!gitCommit) {
    gitCommit = execSync("git rev-parse --short HEAD").toString().trim();
  } else {
    gitCommit = gitCommit.slice(0, 7);
  }
  gitCommitDate = execSync("git log -1 --format=%cI").toString().trim();
} catch {
  if (!gitCommit) gitCommit = "unknown";
  if (!gitCommitDate) gitCommitDate = new Date().toISOString();
}

const buildTime = new Date().toISOString();

/* ===================================================================== */

const nextConfig: NextConfig = {
  productionBrowserSourceMaps: false,
  poweredByHeader: false,
  compress: true,
  env: {
    NEXT_PUBLIC_VERCEL_GIT_COMMIT: gitCommit,
    NEXT_PUBLIC_VERCEL_GIT_DATE: gitCommitDate,
    NEXT_PUBLIC_BUILD_TIME: buildTime,
  },
  async rewrites() {
    return {
      beforeFiles: [],
      afterFiles: [],
      fallback: [],
    };
  },
};

export default nextConfig;
