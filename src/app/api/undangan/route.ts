// POST: buat undangan dari form pembuatan. Body JSON { Kode, Data (NewRow), Foto { Wanita, Pria, JumlahGaleri } }.
// Foto tidak lewat endpoint ini (batas body function Vercel 4,5 MB): respons berisi signed upload URL per foto,
// browser mengunggah langsung ke Supabase Storage, lalu memanggil /api/undangan/{slug}/terbit.
import type { NextRequest } from "next/server";
import { bacaJson, sukses, tryJson } from "@/lib/api";
import { buatBaru } from "@/lib/undangan/data";
import { ErrorBisnis, PESAN } from "@/lib/undangan/konstanta";
import type { NewRow } from "@/lib/undangan/susun";
import { getPengguna } from "@/lib/supabase/server";

interface Body {
  Kode?: string;
  Data?: NewRow;
  Foto?: { Wanita?: boolean; Pria?: boolean; JumlahGaleri?: number };
}

export async function POST(req: NextRequest) {
  return tryJson(req, async () => {
    const body = await bacaJson<Body>(req);
    if (!body?.Data || typeof body.Kode !== "string") throw new ErrorBisnis(PESAN.DATA_INVALID);
    const hasil = await buatBaru(body.Kode, await getPengguna(), body.Data, {
      wanita: body.Foto?.Wanita === true,
      pria: body.Foto?.Pria === true,
      jumlahGaleri: Number(body.Foto?.JumlahGaleri ?? 0),
    });
    const asal = req.nextUrl.origin;
    const url = (to?: string) => `${asal}/u/${hasil.slug}` + (to ? `?to=${encodeURIComponent(to)}` : "");
    return sukses("Undangan berhasil dibuat.", {
      Slug: hasil.slug,
      Url: url(),
      KodeEdit: hasil.kodeEdit,
      Tamu: hasil.tamu.map(nama => ({ Nama: nama, Url: url(nama) })),
      Unggah: hasil.unggah.map(u => ({ Nama: u.nama, Path: u.path, Token: u.token })),
    });
  });
}
