// GET: ucapan berikutnya (?mulai=n). POST: kirim ucapan. Hanya undangan Terbit yang membuka section ucapan.
import type { NextRequest } from "next/server";
import { bacaJson, sukses, tryJson } from "@/lib/api";
import { getTerbit, getUcapan, kirimUcapan } from "@/lib/undangan/data";

type Ctx = { params: Promise<{ slug: string }> };

export async function GET(req: NextRequest, { params }: Ctx) {
  return tryJson(req, async () => {
    const undangan = await getTerbit((await params).slug);
    return sukses("", await getUcapan(undangan, Number(req.nextUrl.searchParams.get("mulai") ?? 0)));
  });
}

export async function POST(req: NextRequest, { params }: Ctx) {
  return tryJson(req, async () =>
    sukses("Matur nuwun, ucapan Anda sudah terkirim.", await kirimUcapan((await params).slug, await bacaJson(req))));
}
