import type { NextConfig } from "next";

const nextConfig: NextConfig = {
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

export default nextConfig;
