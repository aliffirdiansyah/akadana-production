// Isi <body> halaman undangan (port Views/UndanganDigital/Undangan/Index.cshtml). Tanpa navbar dan tanpa CSS situs.
// Dipakai /u/[slug], /contoh/[kode], dan pratinjau form pembuatan (dirender di browser).
// Perilaku (sampul, hitung mundur, RSVP, ucapan) ada di public/js/undangan.js.
import type { DokumenUndangan } from "@/lib/undangan/dokumen";
import type { DaftarUcapan } from "@/lib/undangan/tipe";
import { Section } from "./Section";
import { SimbolTemplate } from "./SimbolTemplate";

export type ModePratinjau = "template" | "form" | null;

export interface BarPratinjau {
  nama: string;
  // Teks tombol utama dan tujuannya (form pembuatan, atau /masuk untuk template terkunci)
  teksPakai: string;
  hrefPakai: string;
}

export interface PropsIsiUndangan {
  dokumen: DokumenUndangan;
  templateKode: string;
  slug: string;
  namaTamu: string | null;
  ucapan: DaftarUcapan;
  // "template" (/contoh/{kode}) atau "form" (pratinjau di form pembuatan): formulir tamu tidak mengirim apa pun
  pratinjau: ModePratinjau;
  bar?: BarPratinjau | null;
}

export function IsiUndangan({ dokumen, templateKode, slug, namaTamu, ucapan, pratinjau, bar }: PropsIsiUndangan) {
  const tampil = dokumen.section.filter(x => x.tampil);
  const sampul = tampil.find(x => x.tipe === "sampul");
  const k = { judul: dokumen.meta.judul, namaTamu, ucapan };

  return (
    <>
      <SimbolTemplate kode={templateKode} />

      {sampul && <Section section={sampul} k={k} />}

      {bar && (
        <div className="pratinjau-bar" role="region" aria-label="Pratinjau template">
          <div className="pratinjau-teks">
            <strong>Pratinjau: {bar.nama}</strong>
            <span>Isi contoh. Formulir tamu tidak mengirim apa pun.</span>
          </div>
          <div className="pratinjau-aksi">
            {/* <a> biasa: komponen ini juga dirender di luar router Next (iframe pratinjau), dan berpindah ke layout lain */}
            {/* eslint-disable-next-line @next/next/no-html-link-for-pages */}
            <a className="pratinjau-kembali" href="/#template">Kembali</a>
            <a className="pratinjau-pakai" href={bar.hrefPakai}>{bar.teksPakai}</a>
          </div>
        </div>
      )}

      <main className="undangan" id="undangan" data-url={`/api/u/${slug}`} data-pratinjau={pratinjau ?? undefined}>
        {tampil.filter(x => x !== sampul).map(section => <Section key={section.id} section={section} k={k} />)}
        <footer className="kaki">Dibuat dengan Inviora</footer>
      </main>
    </>
  );
}
