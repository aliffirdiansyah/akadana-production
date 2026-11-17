// Form data utama (6 kolom): dipakai di beranda dan di /buat. Isinya menjadi draf awal editor,
// jadi pengguna tidak perlu mengetik ulang. Fungsi murni, aman untuk browser.
import { FORMAT_TELEPON } from "./dokumen";
import { EZonaWaktu } from "./konstanta";
import type { NewRow } from "./susun";

// Hanya angka, boleh diawali "+". Huruf, spasi, dan tanda lain dibuang.
export const saringTelepon = (v: string) => (v.trim().startsWith("+") ? "+" : "") + v.replace(/\D/g, "");

// Aturan sama dengan server (susun.ts): 08xx / 628xx / +628xx
export function teleponValid(v: string): boolean {
  let angka = saringTelepon(v).replace(/^\+/, "");
  if (angka.startsWith("0")) angka = "62" + angka.slice(1);
  return FORMAT_TELEPON.test(angka);
}

export const PESAN_TELEPON = "Nomor WhatsApp tidak valid. Gunakan angka saja, contoh: 081234567890.";

export interface IsianSingkat {
  pria: string;
  wanita: string;
  telepon: string;
  tanggal: string;
  jam: string;
  lokasi: string;
}

export const KOLOM_SINGKAT: [keyof IsianSingkat, string][] = [
  ["pria", "Nama mempelai pria"],
  ["wanita", "Nama mempelai wanita"],
  ["telepon", "Nomor WhatsApp"],
  ["tanggal", "Tanggal acara"],
  ["jam", "Jam acara"],
  ["lokasi", "Lokasi acara"],
];

// Pesan kesalahan pertama beserta kolomnya, atau null bila lengkap
export function periksaSingkat(isi: IsianSingkat): { kolom: keyof IsianSingkat; pesan: string } | null {
  for (const [kolom, label] of KOLOM_SINGKAT)
    if (!isi[kolom].trim()) return { kolom, pesan: `${label} harus diisi.` };
  if (!teleponValid(isi.telepon)) return { kolom: "telepon", pesan: PESAN_TELEPON };
  return null;
}

// Draf awal: akad (tanggal + jam) dan resepsi (tanggal), RSVP dan ucapan aktif. Teks pembuka/penutup null = bawaan template.
export function drafDariSingkat(isi: IsianSingkat): NewRow {
  return {
    Wanita: { NamaPanggilan: isi.wanita.trim() },
    Pria: { NamaPanggilan: isi.pria.trim() },
    ZonaWaktu: EZonaWaktu.WIB,
    Acara: [
      { Nama: "Akad Nikah", Tanggal: isi.tanggal, JamMulai: isi.jam, Utama: true },
      { Nama: "Resepsi", Tanggal: isi.tanggal, Utama: true },
    ],
    Lokasi: { Nama: isi.lokasi.trim() },
    Telepon: saringTelepon(isi.telepon),
    TampilRsvp: true,
    MaksTamu: 2,
    TampilUcapan: true,
    Rekening: [],
    Tamu: [],
  };
}
