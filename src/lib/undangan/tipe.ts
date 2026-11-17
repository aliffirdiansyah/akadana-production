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

export const STATUS_SUKSES = 1;
export const STATUS_GAGAL = 0;

export interface ResponseBase<T = unknown> {
  Status: number;
  Message: string;
  Data?: T;
}
