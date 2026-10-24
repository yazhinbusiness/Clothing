import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Customizer pictures never change under the same file name, so let the
  // browser / CDN keep them instead of re-checking on every click.
  async headers() {
    return [
      {
        source: "/assets/:path*",
        headers: [
          { key: "Cache-Control", value: "public, max-age=86400, stale-while-revalidate=604800" },
        ],
      },
    ];
  },
};

export default nextConfig;
