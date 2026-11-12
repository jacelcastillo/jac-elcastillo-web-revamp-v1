import type { NextConfig } from "next";
import { LEGACY_PATHS } from "./lib/redirects.ts";

const csp = [
  "default-src 'self'",
  `script-src 'self' 'unsafe-inline'${process.env.NODE_ENV === "development" ? " 'unsafe-eval'" : ""}`,
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: https://jacelcastillo.com.co",
  "media-src 'self' https://jacelcastillo.com.co",
  "frame-src https://maps.google.com https://www.google.com",
  "font-src 'self'",
  "connect-src 'self'",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "frame-ancestors 'none'",
].join("; ");

const nextConfig: NextConfig = {
  trailingSlash: true,
  poweredByHeader: false,
  experimental: { cpus: 2, staticGenerationMaxConcurrency: 2 },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "jacelcastillo.com.co",
        pathname: "/wp-content/uploads/**",
      },
    ],
  },
  async redirects() {
    return Object.entries(LEGACY_PATHS).map(([source, destination]) => ({
      source,
      destination,
      permanent: true,
    }));
  },
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "Content-Security-Policy", value: csp },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
        ],
      },
    ];
  },
};

export default nextConfig;
