"use client";
// Tombol salin teks (link undangan) ke clipboard, dengan umpan balik singkat di tombol itu sendiri.
import { useState } from "react";

export function TombolSalin({ teks, label, className, children }: { teks: string; label: string; className?: string; children: React.ReactNode }) {
  const [status, setStatus] = useState<"" | "ok" | "gagal">("");

  async function salin() {
    // link relatif dilengkapi asal situs yang sedang dibuka
    const isi = teks.startsWith("/") ? location.origin + teks : teks;
    try {
      await navigator.clipboard.writeText(isi);
      setStatus("ok");
    } catch {
      setStatus("gagal");
    }
    setTimeout(() => setStatus(""), 1800);
  }

  return (
    <button type="button" className={className} onClick={salin} aria-label={label} title={label}>
      {status === "ok" ? "Tersalin" : status === "gagal" ? "Gagal menyalin" : children}
    </button>
  );
}
