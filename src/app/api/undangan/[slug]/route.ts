// PUT: ubah undangan. Body JSON { KodeEdit?, Data (NewRow), Foto (SpecFoto) }. Boleh untuk pemilik (login) atau pemegang kode edit.
// Foto baru diunggah browser lewat signed URL di respons, lalu /api/undangan/{slug}/terbit memeriksanya.
import type { NextRequest } from "next/server";
import { bacaJson, sukses, tryJson } from "@/lib/api";
import { ubah } from "@/lib/undangan/data";
import { ErrorBisnis, PESAN } from "@/lib/undangan/konstanta";
import { responsSimpan } from "@/lib/undangan/respons";
import type { NewRow } from "@/lib/undangan/susun";
import type { SpecFoto } from "@/lib/undangan/tipe";
import { getPengguna } from "@/lib/supabase/server";

export async function PUT(req: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  return tryJson(req, async () => {
    const body = await bacaJson<{ KodeEdit?: string; Data?: NewRow; Foto?: SpecFoto }>(req);
    if (!body?.Data) throw new ErrorBisnis(PESAN.DATA_INVALID);
    const hasil = await ubah((await params).slug, await getPengguna(), body.KodeEdit, body.Data, body.Foto ?? null);
    return sukses("Perubahan tersimpan.", responsSimpan(req.nextUrl.origin, hasil));
  });
}
