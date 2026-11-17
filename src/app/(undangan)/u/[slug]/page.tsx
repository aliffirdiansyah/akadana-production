// Halaman undangan publik /u/{slug}, tanpa login. Hanya undangan berstatus Terbit. ?to=Nama menyapa tamu di sampul.
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { cache } from "react";
import { IsiUndangan } from "@/components/undangan/IsiUndangan";
import { cariSection } from "@/lib/undangan/dokumen";
import { getTerbit, getUcapan } from "@/lib/undangan/data";
import { ErrorTidakAda } from "@/lib/undangan/konstanta";
import { namaTamu } from "@/lib/undangan/tamu";

type Props = { params: Promise<{ slug: string }>; searchParams: Promise<{ to?: string | string[] }> };

const ambil = cache(async (slug: string) => {
  try {
    return await getTerbit(slug);
  } catch (e) {
    if (e instanceof ErrorTidakAda) notFound();
    throw e;
  }
});

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { dokumen } = await ambil((await params).slug);
  const deskripsi = dokumen.meta.deskripsi ?? undefined;
  return {
    title: dokumen.meta.judul,
    description: deskripsi,
    openGraph: { type: "website", title: dokumen.meta.judul, description: deskripsi },
  };
}

export default async function HalamanUndangan({ params, searchParams }: Props) {
  const undangan = await ambil((await params).slug);
  const ucapan = cariSection(undangan.dokumen, "ucapan") ? await getUcapan(undangan, 0) : { Daftar: [], AdaLagi: false };
  return (
    <>
      <link rel="stylesheet" href={`/undangan/css/${undangan.templateKode}.css`} precedence="undangan" />
      <IsiUndangan
        dokumen={undangan.dokumen}
        templateKode={undangan.templateKode}
        slug={undangan.slug}
        namaTamu={namaTamu((await searchParams).to)}
        ucapan={ucapan}
        pratinjau={null}
      />
    </>
  );
}
