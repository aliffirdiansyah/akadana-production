// Ubah undangan /edit/{slug}. Pemilik yang login langsung mendapat editor berisi undangannya.
// Selain itu editor dibuka lewat link edit (/edit/{slug}#kode=...), dibaca di browser oleh BukaEdit.
import type { Metadata } from "next";
import { getIsian, getTemplate } from "@/lib/undangan/data";
import { isiAwal } from "@/lib/undangan/susun";
import { getPengguna } from "@/lib/supabase/server";
import { hariIni } from "@/lib/waktu";
import { FormBuat } from "../../buat/[kode]/FormBuat";
import { BukaEdit } from "./BukaEdit";

export const metadata: Metadata = { title: "Ubah Undangan | Akadana", robots: { index: false, follow: false } };

export default async function HalamanEdit({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const pengguna = await getPengguna();
  // bukan pemilik, atau undangan lama tanpa isian: null, lalu dicoba lewat link edit di browser
  const milik = pengguna
    ? await getIsian(slug, pengguna, null)
      .then(async isian => ({ isian, template: await getTemplate(isian.TemplateKode) }))
      .catch(() => null)
    : null;
  if (!milik) return <BukaEdit slug={slug} sudahMasuk={pengguna != null} hariIni={hariIni()} />;

  const { isian, template } = milik;
  return (
    <FormBuat kartu={template.kartu} dokumenAwal={template.dokumen} awal={isiAwal(template.dokumen)} hariIni={hariIni()}
      ubah={{ slug: isian.Slug, data: isian.Data, foto: isian.Foto, kodeEdit: null }} />
  );
}
