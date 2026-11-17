// POST: konfirmasi kehadiran tamu
import type { NextRequest } from "next/server";
import { bacaJson, sukses, tryJson } from "@/lib/api";
import { kirimRsvp } from "@/lib/undangan/data";

export async function POST(req: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  return tryJson(req, async () => {
    await kirimRsvp((await params).slug, await bacaJson(req));
    return sukses("Matur nuwun, konfirmasi Anda sudah kami terima.");
  });
}
