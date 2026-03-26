import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  basePath: "/scannerpage",
  assetPrefix: "/scannerpage",
  output: "standalone",
  async headers() {
    return [
      {
        // Apply to all routes
        source: "/(.*)",
        headers: [
          {
            key: "X-Frame-Options",
            value: "DENY",
          },
          {
            key: "X-Content-Type-Options",
            value: "nosniff",
          },
          {
            key: "Referrer-Policy",
            value: "strict-origin-when-cross-origin",
          },
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=()",
          },
        ],
      },
      {
        // API routes - stricter CSP
        source: "/api/(.*)",
        headers: [
          {
            key: "Content-Security-Policy",
            value: "default-src 'self'; script-src 'none'; object-src 'none';",
          },
        ],
      },
    ];
  },
};

export default nextConfig;
