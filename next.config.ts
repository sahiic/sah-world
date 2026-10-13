import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  poweredByHeader: false,
  async headers() {
    return [{
      source: "/:path*",
      headers: [
        { key: "X-Content-Type-Options", value: "nosniff" },
        { key: "X-Frame-Options", value: "SAMEORIGIN" },
        // Do not disclose private route/query information to external links.
        { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
        {
          key: "Permissions-Policy",
          value: "camera=(self), microphone=(self), geolocation=(self), fullscreen=(self), payment=(), usb=()",
        },
        {
          // Enforce only directives independent of script/style delivery in part 1.
          key: "Content-Security-Policy",
          value: "frame-ancestors 'self'; object-src 'none'; base-uri 'self'",
        },
        {
          // Inventory policy, NOT full XSS enforcement. Inline framework scripts
          // will report until static pages have a tested hash/nonce strategy.
          // No report endpoint: reports can contain private paths or auth queries.
          key: "Content-Security-Policy-Report-Only",
          value: [
            "default-src 'self'",
            "script-src 'self'",
            "style-src 'self' 'unsafe-inline' https://cdn.jsdelivr.net",
            "font-src 'self' https://cdn.jsdelivr.net",
            "img-src 'self' data: blob: https:",
            "media-src 'self' blob: https:",
            "connect-src 'self' https://*.supabase.co wss://*.supabase.co https://api.aladhan.com https://api.bigdatacloud.net https://api.quran.com",
            "worker-src 'self' blob:",
            "frame-src 'self'",
            "object-src 'none'",
            "base-uri 'self'",
          ].join("; "),
        },
      ],
    }];
  },
  // Keep E2E compilation isolated from the user's already-running dev server.
  distDir:
    process.env.SAH_SOCIAL_E2E === "1"
      ? ".next-social-e2e"
      : process.env.SAH_E2E === "1"
        ? ".next-e2e"
        : ".next",
  devIndicators: process.env.SAH_E2E === "1" ? false : undefined,
  allowedDevOrigins: ["10.58.0.180"],
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "**.supabase.co",
        pathname: "/storage/v1/object/public/**",
      },
      { protocol: "https", hostname: "api.dicebear.com", pathname: "/**" },
      {
        protocol: "https",
        hostname: "lh3.googleusercontent.com",
        pathname: "/**",
      },
    ],
  },
  // Turbopack (Next.js 16 default) — no webpack config needed.
  // Three.js / R3F work fine under Turbopack with no extra config.
  turbopack: {},
  transpilePackages: [
    "three",
    "@react-three/fiber",
    "@react-three/drei",
    "@react-three/postprocessing",
  ],
};

export default nextConfig;
