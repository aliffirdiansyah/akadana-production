// Root layout situs: katalog template, form pembuatan, akun, dan dasbor. Halaman undangan memakai layout (undangan).
import type { Metadata, Viewport } from "next";
import "sweetalert2/dist/sweetalert2.min.css";
import "@/styles/site.css";
import "@/styles/situs.css";
import "@/styles/aplikasi.css";
import { Navbar } from "@/components/Navbar";
import { SKRIP_TEMA } from "@/lib/tema";

export const metadata: Metadata = {
  title: "Akadana | Undangan Pernikahan Digital",
  description: "Buat undangan pernikahan digital: isi data mempelai, susunan acara, galeri foto, rekening, dan daftar tamu, lalu bagikan lewat WhatsApp.",
  applicationName: "Akadana",
  manifest: "/manifest.webmanifest",
  icons: { icon: "/img/logo/akadana-ikon.svg", apple: "/ikon/apple-touch-icon.png" },
  appleWebApp: { capable: true, title: "Akadana", statusBarStyle: "default" },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f5f7f2" },
    { media: "(prefers-color-scheme: dark)", color: "#111714" },
  ],
};

export default function LayoutSitus({ children }: { children: React.ReactNode }) {
  return (
    // suppressHydrationWarning: data-theme dipasang skrip <head> sebelum React berjalan
    <html lang="id" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: SKRIP_TEMA }} />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        {/* eslint-disable-next-line @next/next/no-page-custom-font */}
        <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@600&family=Gloock&family=Plus+Jakarta+Sans:wght@400;500;600;700&display=swap" />
      </head>
      <body>
        <Navbar />
        {children}
        <script src="/js/daftar-sw.js" defer></script>
      </body>
    </html>
  );
}
