// POST: buat undangan dari form pembuatan. Body JSON { Kode, Data (NewRow), Foto (SpecFoto) }.
// Foto tidak lewat endpoint ini (batas body function Vercel 4,5 MB): respons berisi signed upload URL per foto,
// browser mengunggah langsung ke Supabase Storage, lalu memanggil /api/undangan/{slug}/terbit.
import type { NextRequest } from "next/server";
import { bacaJson, sukses, tryJson } from "@/lib/api";
import { buatBaru } from "@/lib/undangan/data";
import { ErrorBisnis, PESAN } from "@/lib/undangan/konstanta";
import { responsSimpan } from "@/lib/undangan/respons";
import type { NewRow } from "@/lib/undangan/susun";
import type { SpecFoto } from "@/lib/undangan/tipe";
import { getPengguna } from "@/lib/supabase/server";

export async function POST(req: NextRequest) {
  return tryJson(req, async () => {
    const body = await bacaJson<{ Kode?: string; Data?: NewRow; Foto?: SpecFoto }>(req);
    if (!body?.Data || typeof body.Kode !== "string") throw new ErrorBisnis(PESAN.DATA_INVALID);
    const hasil = await buatBaru(body.Kode, await getPengguna(), body.Data, body.Foto ?? null);
    return sukses("Undangan berhasil dibuat.", responsSimpan(req.nextUrl.origin, hasil));
  });
}
