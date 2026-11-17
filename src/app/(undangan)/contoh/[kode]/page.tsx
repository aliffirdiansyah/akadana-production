// Pratinjau template dengan isi contoh. Terbuka untuk semua, termasuk template yang wajib login. Formulir tamu tidak mengirim apa pun.
// ?w=&p=&wl=&pl=: nama mempelai dari draf browser (dibawa katalog), menggantikan nama contoh.
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { cache } from "react";
import { IsiUndangan } from "@/components/undangan/IsiUndangan";
import { getTemplate } from "@/lib/undangan/data";
import { ErrorTidakAda } from "@/lib/undangan/konstanta";
import { gantiNamaContoh } from "@/lib/undangan/susun";
import { namaDariQuery, namaTamu } from "@/lib/undangan/tamu";
import { getPengguna } from "@/lib/supabase/server";

type Query = Record<string, string | string[] | undefined>;
type Props = { params: Promise<{ kode: string }>; searchParams: Promise<Query> };

const ambil = cache(async (kode: string) => {
  try {
    return await getTemplate(kode);
  } catch (e) {
    if (e instanceof ErrorTidakAda) notFound();
    throw e;
  }
});

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { kartu } = await ambil((await params).kode);
  return { title: `Pratinjau ${kartu.nama} | Inviora` };
}

export default async function ContohTemplate({ params, searchParams }: Props) {
  const { kartu, dokumen } = await ambil((await params).kode);
  const q = await searchParams;
  const login = !kartu.gratis && (await getPengguna()) != null;
  const terkunci = !kartu.gratis && !login;
  const tujuan = `/buat/${kartu.kode}`;

  return (
    <>
      {/* CSS template ada di public/undangan/css (juga dimuat iframe pratinjau), dipilih per halaman */}
      <link rel="stylesheet" href={`/undangan/css/${kartu.kode}.css`} precedence="undangan" />
      {/* eslint-disable-next-line @next/next/no-css-tags */}
      <link rel="stylesheet" href="/undangan/css/pratinjau.css" precedence="pratinjau" />
      <IsiUndangan
        dokumen={gantiNamaContoh(dokumen, namaDariQuery(q))}
        templateKode={kartu.kode}
        slug=""
        namaTamu={namaTamu(q.to)}
        ucapan={{ Daftar: [], AdaLagi: false }}
        pratinjau="template"
        bar={{
          nama: kartu.nama,
          teksPakai: kartu.gratis ? "Coba gratis" : terkunci ? "Masuk untuk memakai" : "Pakai template ini",
          hrefPakai: terkunci ? `/masuk?returnUrl=${encodeURIComponent(tujuan)}` : tujuan,
        }}
      />
    </>
  );
}
