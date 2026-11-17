// Web App Manifest (/manifest.webmanifest). Ikon dibuat dari logo dengan npm run ikon.
import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    id: "/",
    name: "Inviora",
    short_name: "Inviora",
    description: "Buat undangan pernikahan digital, lihat pratinjaunya langsung, lalu bagikan lewat WhatsApp.",
    lang: "id",
    dir: "ltr",
    start_url: "/?sumber=pwa",
    scope: "/",
    display: "standalone",
    orientation: "portrait",
    background_color: "#f5f7f2",
    theme_color: "#1f6b55",
    categories: ["lifestyle", "productivity"],
    icons: [
      { src: "/ikon/ikon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/ikon/ikon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/ikon/ikon-maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
      { src: "/img/logo/inviora-ikon.svg", sizes: "any", type: "image/svg+xml", purpose: "any" },
    ],
    shortcuts: [
      { name: "Pilih template", url: "/#template", icons: [{ src: "/ikon/ikon-192.png", sizes: "192x192" }] },
      { name: "Undangan saya", url: "/saya", icons: [{ src: "/ikon/ikon-192.png", sizes: "192x192" }] },
    ],
  };
}
