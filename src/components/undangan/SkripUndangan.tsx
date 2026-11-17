"use client";
// Memuat skrip halaman undangan SETELAH hydration React. Bila dimuat sebagai <script defer> biasa, undangan.js mengubah
// kelas dan teks (sampul, animasi, hitung mundur) sebelum hydration selesai, React melihat HTML berbeda, lalu membuat
// ulang tree dan semua listener undangan.js hilang. Iframe pratinjau tidak memakai React, jadi memakai <script> langsung.
import { useEffect } from "react";

const SKRIP = [
  "https://cdn.jsdelivr.net/npm/sweetalert2@11.14.5/dist/sweetalert2.min.js",
  "/js/konfirmasi.js",
  "/js/undangan.js",
];

function muat(src: string) {
  return new Promise<void>(selesai => {
    const el = document.createElement("script");
    el.src = src;
    // SweetAlert gagal dimuat (CDN diblokir): konfirmasi.js jatuh ke dialog bawaan browser
    el.onload = el.onerror = () => selesai();
    document.body.append(el);
  });
}

export function SkripUndangan() {
  useEffect(() => {
    const w = window as typeof window & { __skripUndangan?: boolean };
    // StrictMode (dev) menjalankan effect dua kali; skrip hanya boleh dipasang sekali
    if (w.__skripUndangan) return;
    w.__skripUndangan = true;
    (async () => { for (const src of SKRIP) await muat(src); })();
  }, []);
  return null;
}
