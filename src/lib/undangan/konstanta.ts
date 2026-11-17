// Konstanta dan enum domain undangan. Dipakai server dan browser.

export enum EStatusUndangan {
  Draf = 1,
  Terbit = 2,
  Arsip = 3,
}

// Nilai = selisih jam dari UTC
export enum EZonaWaktu {
  WIB = 7,
  WITA = 8,
  WIT = 9,
}

export const ZONA_WAKTU: { nilai: EZonaWaktu; nama: string }[] = [
  { nilai: EZonaWaktu.WIB, nama: "WIB" },
  { nilai: EZonaWaktu.WITA, nama: "WITA" },
  { nilai: EZonaWaktu.WIT, nama: "WIT" },
];

export const UKURAN_FOTO_MAKS = 2 * 1024 * 1024;
export const JUMLAH_GALERI_MAKS = 12;
export const JUMLAH_ACARA_MAKS = 10;
export const JUMLAH_REKENING_MAKS = 5;
export const JUMLAH_TAMU_MAKS = 500;
export const JUMLAH_UCAPAN = 20;
export const MAKS_PESAN_UCAPAN = 500;

// Bucket Supabase Storage. Foto tampil di dokumen sebagai /foto/{slug}/{kunci}.jpg (rewrite di next.config.ts).
export const BUCKET_FOTO = "undangan-foto";
export const PATH_FOTO = "/foto/";
// Pratinjau di form pembuatan: penanda yang diganti browser dengan URL blob foto pilihan
export const PATH_FOTO_PRATINJAU = "/foto/pratinjau-";

export const PESAN = {
  DATA_INVALID: "Data tidak valid",
  TEMPLATE_TERKUNCI: "Template ini wajib login. Masuk di tab baru agar isian tidak hilang, lalu kirim ulang.",
  SECTION_TIDAK_ADA: (nama: string) => `${nama} tidak dibuka untuk undangan ini`,
  TIDAK_DITEMUKAN: (nama: string) => `Data ${nama} tidak ditemukan`,
  WAJIB: (nama: string) => `${nama} harus diisi`,
};

// Error bisnis: pesan boleh langsung ditampilkan ke pengguna
export class ErrorBisnis extends Error {}
export class ErrorTidakAda extends Error {}
