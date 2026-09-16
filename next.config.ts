import type { NextConfig } from "next";

// ----------------------------------------------------
const nextConfig: NextConfig = {
  reactStrictMode: true,
  async rewrites() {
    const backendUrl = process.env.API_URL || "https://api.chezrheyy.xyz";
    return [
      {
        source: "/api/proxy/:path*",
        destination: `${backendUrl}/:path*`
      }
    ];
  }
};

export default nextConfig;
