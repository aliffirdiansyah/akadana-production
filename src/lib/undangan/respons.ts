import "server-only";
// Respons simpan undangan (buat dan ubah) untuk editor: link undangan, link per tamu, link edit, dan signed upload URL foto.
import type { HasilSimpan } from "./data";

export function responsSimpan(asal: string, hasil: HasilSimpan) {
  const url = (to?: string) => `${asal}/u/${hasil.slug}` + (to ? `?to=${encodeURIComponent(to)}` : "");
  return {
    Slug: hasil.slug,
    Url: url(),
    KodeEdit: hasil.kodeEdit,
    // Kode edit di fragment (#), tidak pernah terkirim ke server lewat URL
    LinkEdit: hasil.kodeEdit ? `${asal}/edit/${hasil.slug}#kode=${hasil.kodeEdit}` : `${asal}/edit/${hasil.slug}`,
    Tamu: hasil.tamu.map(nama => ({ Nama: nama, Url: url(nama) })),
    Unggah: hasil.unggah.map(u => ({ Nama: u.nama, Path: u.path, Token: u.token })),
  };
}
