"use client";
// Konfirmasi dan pesan hasil dengan SweetAlert2 (port Konfirmasi.js versi .NET) untuk halaman React.
// Halaman undangan publik memakai public/js/konfirmasi.js dengan API yang sama; perubahan perilaku dibuat di keduanya.
// Setiap aksi yang menyimpan, mengubah, atau menghapus data bertanya dulu lewat tanya().
import Swal, { type SweetAlertOptions } from "sweetalert2";

const warna = (nama: string, cadangan: string) =>
  getComputedStyle(document.documentElement).getPropertyValue(nama).trim() || cadangan;

function dasar(): SweetAlertOptions {
  const kurangiGerak = matchMedia("(prefers-reduced-motion: reduce)").matches;
  return {
    buttonsStyling: true,
    confirmButtonColor: warna("--accent", "#1f5b4a"),
    cancelButtonColor: warna("--muted", "#5b6a62"),
    customClass: { popup: "inviora-swal" },
    // tanpa animasi bila pengguna meminta gerak dikurangi
    showClass: kurangiGerak ? { popup: "" } : undefined,
    hideClass: kurangiGerak ? { popup: "" } : undefined,
  };
}

interface OpsiTanya {
  judul?: string;
  teks?: string;
  tombol?: string;
  batal?: string;
  bahaya?: boolean;
}

export async function tanya({ judul = "Simpan perubahan?", teks = "", tombol = "Ya, simpan", batal = "Batal", bahaya = false }: OpsiTanya = {}) {
  const hasil = await Swal.fire({
    ...dasar(),
    icon: bahaya ? "warning" : "question",
    title: judul,
    text: teks || undefined,
    showCancelButton: true,
    confirmButtonText: tombol,
    cancelButtonText: batal,
    confirmButtonColor: bahaya ? warna("--danger", "#b23b2e") : warna("--accent", "#1f5b4a"),
    reverseButtons: true,
    focusCancel: bahaya,
  });
  return hasil.isConfirmed;
}

export function sukses(teks: string, judul = "Berhasil") {
  return Swal.fire({ ...dasar(), icon: "success", title: judul, text: teks || undefined, timer: 2200, timerProgressBar: true, showConfirmButton: false });
}

export function gagal(teks: string, judul = "Gagal") {
  return Swal.fire({ ...dasar(), icon: "error", title: judul, text: teks, confirmButtonText: "Tutup" });
}

export const Konfirmasi = { tanya, sukses, gagal };
