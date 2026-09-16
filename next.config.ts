import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  productionBrowserSourceMaps: false,
  poweredByHeader: false,
  compress: true,
  async rewrites() {
    return [
      {
        source: "/api/proxy/:path*",
        destination: `${process.env.API_URL || "https://api.chezrheyy.xyz"}/api/generate-docs/:path*`,
      },
    ];
  },
};

export default nextConfig;
