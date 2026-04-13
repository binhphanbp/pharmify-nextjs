import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // ─── Tối ưu cho Production ────────────────────────
  // Bật powered by header off (bảo mật)
  poweredByHeader: false,

  // ─── Image Optimization ──────────────────────────
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "jfygysihtplarmfeatdc.supabase.co",
        pathname: "/storage/v1/object/public/**",
      },
    ],
  },

  // ─── Headers bảo mật ─────────────────────────────
  async headers() {
    return [
      {
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
        ],
      },
    ];
  },
};

export default nextConfig;
