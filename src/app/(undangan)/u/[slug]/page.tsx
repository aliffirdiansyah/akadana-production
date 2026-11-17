// Halaman undangan publik /u/{slug}, tanpa login. Hanya undangan berstatus Terbit.
// ?t={kode}: undangan pribadi dari daftar tamu (sapaan nama + kartu masuk ber-QR unik). ?to=Nama: sapaan saja (link lama).
import type { Metadata } from "next";
import { headers } from "next/headers";
import { notFound } from "next/navigation";
import QRCode from "qrcode";
import { cache } from "react";
import { IsiUndangan } from "@/components/undangan/IsiUndangan";
import { cariSection } from "@/lib/undangan/dokumen";
import { getTamuUndangan, getTerbit, getUcapan } from "@/lib/undangan/data";
import { ErrorTidakAda } from "@/lib/undangan/konstanta";
import { namaTamu } from "@/lib/undangan/tamu";

type Props = { params: Promise<{ slug: string }>; searchParams: Promise<{ to?: string | string[]; t?: string | string[] }> };

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
  const q = await searchParams;
  const ucapan = cariSection(undangan.dokumen, "ucapan") ? await getUcapan(undangan, 0) : { Daftar: [], AdaLagi: false };

  // Undangan pribadi: QR berisi link pribadi tamu ini (kelak dipindai di buku tamu digital)
  const tamu = await getTamuUndangan(undangan, Array.isArray(q.t) ? q.t[0] : q.t);
  let kartuTamu = null;
  if (tamu) {
    const h = await headers();
    const asal = `${h.get("x-forwarded-proto") ?? "https"}://${h.get("x-forwarded-host") ?? h.get("host")}`;
    const qrSvg = await QRCode.toString(`${asal}/u/${undangan.slug}?t=${tamu.kode}`, {
      type: "svg", margin: 1, errorCorrectionLevel: "M", color: { dark: "#1c1410", light: "#ffffff" },
    });
    kartuTamu = { nama: tamu.nama, qrSvg };
  }

  return (
    <>
      <link rel="stylesheet" href={`/undangan/css/${undangan.templateKode}.css`} precedence="undangan" />
      <IsiUndangan
        dokumen={undangan.dokumen}
        templateKode={undangan.templateKode}
        slug={undangan.slug}
        namaTamu={tamu?.nama ?? namaTamu(q.to)}
        ucapan={ucapan}
        pratinjau={null}
        kartuTamu={kartuTamu}
      />
    </>
  );
}
