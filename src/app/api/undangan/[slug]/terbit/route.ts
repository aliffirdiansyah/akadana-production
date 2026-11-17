// POST { KodeEdit }: semua foto sudah diunggah, undangan diterbitkan. Isi tiap foto diperiksa lebih dulu.
import type { NextRequest } from "next/server";
import { bacaJson, sukses, tryJson } from "@/lib/api";
import { terbitkan } from "@/lib/undangan/data";

export async function POST(req: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  return tryJson(req, async () => {
    const body = await bacaJson<{ KodeEdit?: string }>(req);
    await terbitkan((await params).slug, body?.KodeEdit);
    return sukses("Undangan terbit.");
  });
}
