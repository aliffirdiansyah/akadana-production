import type { NewRow } from "./susun";

// Tipe yang dipakai bersama server dan browser (respons API dan halaman undangan).
// Nama field PascalCase mengikuti ResponseBase versi .NET, karena public/js/undangan.js membacanya.

export interface UcapanItem {
  Nama: string;
  Pesan: string;
  Waktu: string;
}

export interface DaftarUcapan {
  Daftar: UcapanItem[];
  AdaLagi: boolean;
}

// Foto yang tersimpan bersama isian undangan (path /foto/{slug}/{kunci}.jpg)
export interface FotoIsian {
  Wanita: string | null;
  Pria: string | null;
  Galeri: string[];
}

// Permintaan foto dari editor saat membuat/mengubah: "baru" = diunggah setelah ini, "tetap" / { Tetap: path } = foto lama dipertahankan
export interface SpecFoto {
  Wanita: "baru" | "tetap" | null;
  Pria: "baru" | "tetap" | null;
  Galeri: ("baru" | { Tetap: string })[];
}

// Isian undangan untuk editor mode ubah
export interface IsianUndangan {
  Slug: string;
  TemplateKode: string;
  Data: NewRow;
  Foto: FotoIsian;
}

export const STATUS_SUKSES = 1;
export const STATUS_GAGAL = 0;

export interface ResponseBase<T = unknown> {
  Status: number;
  Message: string;
  Data?: T;
}
