// Root layout halaman undangan: berdiri sendiri, tanpa navbar dan tanpa CSS situs. CSS template dipasang per halaman.
import type { Metadata, Viewport } from "next";
import { SkripUndangan } from "@/components/undangan/SkripUndangan";

export const metadata: Metadata = {
  // undangan pribadi: jangan masuk mesin pencari
  robots: { index: false, follow: false },
  manifest: "/manifest.webmanifest",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function LayoutUndangan({ children }: { children: React.ReactNode }) {
  return (
    <html lang="id">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/sweetalert2@11.14.5/dist/sweetalert2.min.css" />
      </head>
      <body>
        {children}
        {/* Konfirmasi kirim RSVP dan ucapan (SweetAlert2), lalu perilaku halaman undangan, dimuat setelah hydration */}
        <SkripUndangan />
        <script src="/js/daftar-sw.js" defer></script>
      </body>
    </html>
  );
}
