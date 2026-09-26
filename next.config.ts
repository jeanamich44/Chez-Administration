import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  productionBrowserSourceMaps: false,
  poweredByHeader: false,
  compress: true,
  async rewrites() {
    return {
      beforeFiles: [
        {
          source: "/espace-sec-x9k2m7",
          destination: "/admin/index.html",
        },
        {
          source: "/admin",
          destination: "/admin/index.html",
        },
        {
          source: "/",
          destination: "/admin/index.html",
        },
      ],
      afterFiles: [],
      fallback: [],
    };
  },
};

export default nextConfig;
