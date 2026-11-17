"use client";
// Tombol tema terang/gelap di navbar. Pilihan disimpan di localStorage ("akadana_tema") dan dipasang sebagai
// <html data-theme="light|dark">; token warna di site.css membaca atribut itu. Tanpa pilihan, tema mengikuti sistem.
// lib/tema.ts SKRIP_TEMA dijalankan di <head> sebelum halaman tampil, supaya tidak berkedip saat dimuat.
import { useSyncExternalStore } from "react";
import { KUNCI_TEMA as KUNCI } from "@/lib/tema";

type Tema = "light" | "dark";

function temaSekarang(): Tema {
  const dipilih = document.documentElement.dataset.theme;
  if (dipilih === "light" || dipilih === "dark") return dipilih;
  return matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

function langganan(cb: () => void) {
  const media = matchMedia("(prefers-color-scheme: dark)");
  const amati = new MutationObserver(cb);
  amati.observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });
  media.addEventListener("change", cb);
  return () => { amati.disconnect(); media.removeEventListener("change", cb); };
}

export function ToggleTema() {
  // server tidak tahu tema perangkat: render awal "light", lalu menyesuaikan setelah hydration
  const tema = useSyncExternalStore(langganan, temaSekarang, () => "light" as Tema);
  const berikut: Tema = tema === "dark" ? "light" : "dark";
  const label = berikut === "dark" ? "Ganti ke tema gelap" : "Ganti ke tema terang";

  function ganti() {
    document.documentElement.dataset.theme = berikut;
    try { localStorage.setItem(KUNCI, berikut); } catch { /* mode privat: berlaku sampai halaman ditutup */ }
  }

  return (
    <button type="button" className="tema-tombol" onClick={ganti} aria-label={label} title={label}>
      {tema === "dark" ? (
        // matahari: kembali ke terang
        <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true" focusable="false">
          <circle cx="12" cy="12" r="4.2" />
          <path d="M12 2.5v2.2M12 19.3v2.2M2.5 12h2.2M19.3 12h2.2M5.3 5.3l1.6 1.6M17.1 17.1l1.6 1.6M5.3 18.7l1.6-1.6M17.1 6.9l1.6-1.6" />
        </svg>
      ) : (
        // bulan sabit: ke gelap
        <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true" focusable="false">
          <path d="M20 14.5A8 8 0 0 1 9.5 4a8 8 0 1 0 10.5 10.5Z" />
        </svg>
      )}
    </button>
  );
}
