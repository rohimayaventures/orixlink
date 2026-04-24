import type { NextConfig } from "next";
import { execSync } from "node:child_process";
import { withSentryConfig } from "@sentry/nextjs";

function getGitRelease(): string | undefined {
  if (process.env.SENTRY_RELEASE) return process.env.SENTRY_RELEASE;
  if (process.env.VERCEL_GIT_COMMIT_SHA) return process.env.VERCEL_GIT_COMMIT_SHA;
  if (process.env.GITHUB_SHA) return process.env.GITHUB_SHA;
  try {
    return execSync("git rev-parse HEAD", { encoding: "utf8" }).trim();
  } catch {
    return undefined;
  }
}

const release = getGitRelease();

const nextConfig: NextConfig = {
  env: {
    ...(process.env.SENTRY_DSN
      ? { NEXT_PUBLIC_SENTRY_DSN: process.env.SENTRY_DSN }
      : {}),
    ...(release ? { NEXT_PUBLIC_SENTRY_RELEASE: release } : {}),
  },
  async redirects() {
    return [
      {
        source: "/favicon.ico",
        destination: "/icons/favicon-32.png",
        permanent: false,
      },
    ];
  },
};

export default withSentryConfig(
  nextConfig,
  {
    org: process.env.SENTRY_ORG,
    project: process.env.SENTRY_PROJECT,
    silent: !process.env.CI,
    telemetry: false,
  }
);
