// POST { KodeEdit? }: isian form undangan + template-nya, untuk editor mode ubah (/edit/{slug}) yang dibuka lewat link edit.
// POST (bukan GET) supaya kode edit tidak masuk URL atau log. Pemilik yang login tidak perlu kode.
import type { NextRequest } from "next/server";
import { bacaJson, sukses, tryJson } from "@/lib/api";
import { getIsian, getTemplate } from "@/lib/undangan/data";
import { isiAwal } from "@/lib/undangan/susun";
import { getPengguna } from "@/lib/supabase/server";

export async function POST(req: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  return tryJson(req, async () => {
    const body = await bacaJson<{ KodeEdit?: string }>(req);
    const isian = await getIsian((await params).slug, await getPengguna(), body?.KodeEdit);
    const template = await getTemplate(isian.TemplateKode);
    return sukses("", { Isian: isian, Kartu: template.kartu, DokumenAwal: template.dokumen, Awal: isiAwal(template.dokumen) });
  });
}
