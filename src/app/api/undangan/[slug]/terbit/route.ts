// POST { KodeEdit? }: foto sudah diunggah, undangan diterbitkan. Isi tiap foto diperiksa lebih dulu.
// Boleh untuk pemilik (login) atau pemegang kode edit.
import type { NextRequest } from "next/server";
import { bacaJson, sukses, tryJson } from "@/lib/api";
import { terbitkan } from "@/lib/undangan/data";
import { getPengguna } from "@/lib/supabase/server";

export async function POST(req: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  return tryJson(req, async () => {
    const body = await bacaJson<{ KodeEdit?: string }>(req);
    await terbitkan((await params).slug, await getPengguna(), body?.KodeEdit);
    return sukses("Undangan terbit.");
  });
}
