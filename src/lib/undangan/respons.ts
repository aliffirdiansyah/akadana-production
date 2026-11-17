import "server-only";
// Respons simpan undangan (buat dan ubah) untuk editor: link undangan, link edit, link kelola tamu, dan signed upload URL foto.
import type { HasilSimpan } from "./data";

export function responsSimpan(asal: string, hasil: HasilSimpan) {
  // Kode edit di fragment (#), tidak pernah terkirim ke server lewat URL
  const fragmen = hasil.kodeEdit ? `#kode=${hasil.kodeEdit}` : "";
  return {
    Slug: hasil.slug,
    Url: `${asal}/u/${hasil.slug}`,
    KodeEdit: hasil.kodeEdit,
    LinkEdit: `${asal}/edit/${hasil.slug}${fragmen}`,
    LinkTamu: `${asal}/tamu/${hasil.slug}${fragmen}`,
    Unggah: hasil.unggah.map(u => ({ Nama: u.nama, Path: u.path, Token: u.token })),
  };
}
