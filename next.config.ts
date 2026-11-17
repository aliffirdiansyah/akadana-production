import type { NextConfig } from "next";

const supabaseUrl = (process.env.NEXT_PUBLIC_SUPABASE_URL ?? "").replace(/\/$/, "");

// Cache Components tidak dipakai: hampir semua halaman membaca session (cookie) dan data terbaru dari Supabase.
const nextConfig: NextConfig = {
  // Foto undangan: alamat stabil di domain sendiri (/foto/{slug}/{kunci}.jpg), isi dari bucket publik Supabase Storage
  async rewrites() {
    return supabaseUrl
      ? [{ source: "/foto/:path*", destination: `${supabaseUrl}/storage/v1/object/public/undangan-foto/:path*` }]
      : [];
  },
  async headers() {
    return [
      {
        // Service worker selalu diambil versi terbaru
        source: "/sw.js",
        headers: [
          { key: "Content-Type", value: "application/javascript; charset=utf-8" },
          { key: "Cache-Control", value: "no-cache, no-store, must-revalidate" },
        ],
      },
      {
        source: "/:path*",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "X-Frame-Options", value: "SAMEORIGIN" },
        ],
      },
    ];
  },
};

export default nextConfig;
