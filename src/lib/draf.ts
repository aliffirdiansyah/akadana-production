"use client";
// Draf form pembuatan undangan, disimpan di localStorage browser ini (pengganti tabel t_undangan_draf versi .NET).
// Satu draf dipakai bersama semua template; foto tidak ikut disimpan. Bisa dibaca dan ditulis tanpa koneksi (PWA).
import type { NewRow } from "./undangan/susun";

const KUNCI = "akadana_draf";
// Draf yang tidak diubah selama ini diabaikan
const UMUR_HARI = 90;
const UKURAN_MAKS = 256 * 1024;

interface Simpanan {
  isi: NewRow;
  upd: string;
}

export function bacaDraf(): NewRow | null {
  try {
    const teks = localStorage.getItem(KUNCI);
    if (!teks) return null;
    const data = JSON.parse(teks) as Simpanan;
    if (!data?.isi || Date.now() - Date.parse(data.upd) > UMUR_HARI * 86400000) return null;
    return data.isi;
  } catch {
    return null;
  }
}

// false bila gagal disimpan (penyimpanan penuh, mode privat, atau isian terlalu panjang)
export function simpanDraf(isi: NewRow): boolean {
  try {
    const teks = JSON.stringify({ isi, upd: new Date().toISOString() } satisfies Simpanan);
    if (teks.length > UKURAN_MAKS) return false;
    localStorage.setItem(KUNCI, teks);
    window.dispatchEvent(new Event("draf-undangan"));
    return true;
  } catch {
    return false;
  }
}

export function hapusDraf() {
  try {
    localStorage.removeItem(KUNCI);
    window.dispatchEvent(new Event("draf-undangan"));
  } catch {
    // tidak ada yang perlu dihapus
  }
}

// Untuk useSyncExternalStore: berubah saat draf disimpan di tab ini atau tab lain
export function langgananDraf(cb: () => void) {
  const onStorage = (e: StorageEvent) => { if (e.key === KUNCI) cb(); };
  window.addEventListener("draf-undangan", cb);
  window.addEventListener("storage", onStorage);
  return () => {
    window.removeEventListener("draf-undangan", cb);
    window.removeEventListener("storage", onStorage);
  };
}

export function teksDraf(): string {
  try {
    return localStorage.getItem(KUNCI) ?? "";
  } catch {
    return "";
  }
}
