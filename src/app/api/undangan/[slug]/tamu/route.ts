// POST { KodeEdit?, Aksi, ... }: kelola daftar tamu undangan. Pemilik (login) atau pemegang kode edit.
// Aksi: "daftar" | "tambah" { Nama, Telepon } | "hapus" { Kode } | "kirim" { Kode } (tandai terkirim).
// POST semua (bukan GET) supaya kode edit tidak masuk URL atau log.
import type { NextRequest } from "next/server";
import { bacaJson, sukses, tryJson } from "@/lib/api";
import { daftarTamu, hapusTamu, tambahTamu, tandaiTerkirim } from "@/lib/undangan/data";
import { ErrorBisnis, PESAN } from "@/lib/undangan/konstanta";
import { getPengguna } from "@/lib/supabase/server";

interface Body {
  KodeEdit?: string;
  Aksi?: string;
  Nama?: string;
  Telepon?: string;
  Kode?: string;
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  return tryJson(req, async () => {
    const body = await bacaJson<Body>(req);
    const slug = (await params).slug;
    const pengguna = await getPengguna();
    switch (body?.Aksi) {
      case "daftar": return sukses("", await daftarTamu(slug, pengguna, body.KodeEdit));
      case "tambah": return sukses("Tamu ditambahkan.", await tambahTamu(slug, pengguna, body.KodeEdit, body));
      case "hapus":
        await hapusTamu(slug, pengguna, body.KodeEdit, body.Kode);
        return sukses("Tamu dihapus.");
      case "kirim": return sukses("", await tandaiTerkirim(slug, pengguna, body.KodeEdit, body.Kode));
      default: throw new ErrorBisnis(PESAN.DATA_INVALID);
    }
  });
}
