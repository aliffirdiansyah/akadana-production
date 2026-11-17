// Form pembuatan undangan /buat/{kode}. Template non-gratis wajib login.
import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { getTemplate } from "@/lib/undangan/data";
import { ErrorTidakAda } from "@/lib/undangan/konstanta";
import { isiAwal } from "@/lib/undangan/susun";
import { getPengguna } from "@/lib/supabase/server";
import { hariIni } from "@/lib/waktu";
import { FormBuat } from "./FormBuat";

export const metadata: Metadata = {
  title: "Buat Undangan Digital | Akadana",
  description: "Buat undangan pernikahan digital: isi data mempelai, susunan acara, galeri foto, rekening, dan daftar tamu, lalu bagikan lewat WhatsApp.",
};

export default async function HalamanBuat({ params }: { params: Promise<{ kode: string }> }) {
  const { kode } = await params;
  let template;
  try {
    template = await getTemplate(kode);
  } catch (e) {
    if (e instanceof ErrorTidakAda) notFound();
    throw e;
  }
  if (!template.kartu.gratis && !(await getPengguna())) redirect(`/masuk?returnUrl=${encodeURIComponent(`/buat/${kode}`)}`);

  return <FormBuat kartu={template.kartu} dokumenAwal={template.dokumen} awal={isiAwal(template.dokumen)} hariIni={hariIni()} />;
}
