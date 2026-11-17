// Dasbor pengguna: undangan yang dibuat saat login. Hero gelap dengan ringkasan, lalu kartu bergambar sampul per undangan
// (palet template sama dengan katalog), hitung mundur ke acara utama, angka RSVP/ucapan, dan aksi buka, ubah, salin, bagikan.
import Link from "next/link";
import { NavGelap } from "@/components/NavGelap";
import { TombolSalin } from "@/components/TombolSalin";
import type { UndanganMilik } from "@/lib/undangan/data";

const ZONA = "Asia/Jakarta";
const tanggal = (iso: string) => new Intl.DateTimeFormat("id-ID", { timeZone: ZONA, day: "numeric", month: "long", year: "numeric" }).format(new Date(iso));
const tanggalSingkat = (iso: string) => new Intl.DateTimeFormat("id-ID", { timeZone: ZONA, weekday: "short", day: "numeric", month: "short", year: "numeric" }).format(new Date(iso));

// Selisih hari kalender (WIB) dari hari ini ke tanggal acara
function sisaHari(mulai: string, hari: string): number {
  const acara = new Intl.DateTimeFormat("en-CA", { timeZone: ZONA }).format(new Date(mulai));
  return Math.round((Date.parse(acara) - Date.parse(hari)) / 86400000);
}

function Hitung({ mulai, hari }: { mulai: string | null; hari: string }) {
  if (!mulai) return <span className="sy-hitung sy-hitung-redup">Tanggal menyusul</span>;
  const sisa = sisaHari(mulai, hari);
  if (sisa < 0) return <span className="sy-hitung sy-hitung-redup">Acara sudah lewat</span>;
  if (sisa === 0) return <span className="sy-hitung sy-hitung-hari">Hari ini</span>;
  return <span className="sy-hitung"><b>{sisa}</b> hari lagi</span>;
}

const Ikon = {
  kalender: <path d="M4 6h16v14H4zM4 10h16M8 3v4M16 3v4" />,
  lokasi: <><path d="M12 21s-7-6.2-7-11a7 7 0 0 1 14 0c0 4.8-7 11-7 11Z" /><circle cx="12" cy="10" r="2.5" /></>,
  rsvp: <><path d="M4 5h16v11H9l-5 4z" /><path d="m9 10 2 2 4-4" /></>,
  tamu: <><circle cx="9" cy="8" r="3" /><path d="M3 20c0-3.3 2.7-6 6-6s6 2.7 6 6M16 11a3 3 0 1 0 0-6M21 20c0-2.8-1.8-5-4.5-5.7" /></>,
  ucapan: <path d="M12 20s-7-4.4-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 10c0 5.6-7 10-7 10Z" />,
  buka: <path d="M14 4h6v6M20 4l-9 9M18 14v5a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1h5" />,
  ubah: <path d="M4 20h4L19 9l-4-4L4 16zM13 7l4 4" />,
  salin: <><rect x="8" y="8" width="12" height="12" rx="2" /><path d="M16 8V5a1 1 0 0 0-1-1H5a1 1 0 0 0-1 1v10a1 1 0 0 0 1 1h3" /></>,
  wa: <path d="M5 19l1.2-3.6A7.5 7.5 0 1 1 9 18.5zM9.5 9.5c.3 2 2 3.8 4 4.2l1-1 2 .8-.4 1.6c-3.6.2-7.6-3.6-7.4-7.3l1.6-.4.8 2z" />,
  plus: <path d="M12 5v14M5 12h14" />,
  daftar: <><circle cx="9" cy="8" r="3" /><path d="M3 20c0-3.3 2.7-6 6-6s6 2.7 6 6M17 8v6M14 11h6" /></>,
};

function Svg({ d, ukuran = 16 }: { d: React.ReactNode; ukuran?: number }) {
  return <svg viewBox="0 0 24 24" width={ukuran} height={ukuran} aria-hidden="true" focusable="false">{d}</svg>;
}

function Kartu({ u, hari, asal }: { u: UndanganMilik; hari: string; asal: string }) {
  // deskripsi dokumen: "Sabtu, 12 Juni 2027 · Pendapa ..." -> lokasi = bagian setelah tanda titik tengah
  const lokasi = u.deskripsi?.includes(" · ") ? u.deskripsi.split(" · ").slice(1).join(" · ") : u.deskripsi;
  const pasangan = `${u.nama1} & ${u.nama2}`;
  const link = `${asal}/u/${u.slug}`;
  return (
    <li>
      <article className="tpl-kartu sy-kartu" data-kode={u.templateKode} aria-labelledby={`judul-${u.slug}`}>
        <div className="tpl-pratinjau sy-sampul">
          <span className="tpl-bingkai">
            <span className="tpl-label">{u.label}</span>
            <span className="tpl-nama">{u.nama1} <span className="sy-dan">&amp;</span> {u.nama2}</span>
            <span className="tpl-belah"></span>
          </span>
          <span className={u.terbit ? "sy-status sy-status-terbit" : "sy-status sy-status-draf"}>{u.terbit ? "Terbit" : "Foto belum terunggah"}</span>
          <Hitung mulai={u.mulai} hari={hari} />
        </div>

        <div className="sy-isi">
          <h2 className="sy-judul" id={`judul-${u.slug}`}>{u.judul}</h2>
          <ul className="sy-meta">
            <li><Svg d={Ikon.kalender} />{u.mulai ? tanggalSingkat(u.mulai) : "Tanggal menyusul"}</li>
            {lokasi && <li><Svg d={Ikon.lokasi} />{lokasi}</li>}
          </ul>

          <dl className="sy-angka">
            <div><dt><Svg d={Ikon.rsvp} ukuran={14} />Konfirmasi</dt><dd>{u.jumlahRsvp}</dd></div>
            <div><dt><Svg d={Ikon.tamu} ukuran={14} />Tamu hadir</dt><dd>{u.jumlahHadir}</dd></div>
            <div><dt><Svg d={Ikon.ucapan} ukuran={14} />Ucapan</dt><dd>{u.jumlahUcapan}</dd></div>
          </dl>

          <div className="sy-aksi">
            {u.terbit && <a className="sy-btn sy-btn-utama" href={link} target="_blank" rel="noopener"><Svg d={Ikon.buka} />Buka</a>}
            {u.bisaDiubah && <Link className="sy-btn" href={`/edit/${u.slug}`}><Svg d={Ikon.ubah} />Ubah</Link>}
            <Link className="sy-btn" href={`/tamu/${u.slug}`}><Svg d={Ikon.daftar} />Tamu</Link>
            {u.terbit && <TombolSalin className="sy-btn sy-btn-ikon" teks={link} label={`Salin link undangan ${pasangan}`}><Svg d={Ikon.salin} /></TombolSalin>}
            {u.terbit && (
              <a className="sy-btn sy-btn-ikon" target="_blank" rel="noopener" aria-label={`Bagikan undangan ${pasangan} ke WhatsApp`} title="Bagikan ke WhatsApp"
                href={`https://wa.me/?text=${encodeURIComponent(`Undangan pernikahan ${pasangan}: ${link}`)}`}>
                <Svg d={Ikon.wa} />
              </a>
            )}
          </div>
          <p className="sy-kaki">{u.templateNama} · dibuat {tanggal(u.insDate)}</p>
        </div>
      </article>
    </li>
  );
}

export function TampilanSaya({ nama, daftar, hari, asal }: { nama: string; daftar: UndanganMilik[]; hari: string; asal: string }) {
  const total = daftar.reduce((t, u) => ({ rsvp: t.rsvp + u.jumlahRsvp, hadir: t.hadir + u.jumlahHadir, ucapan: t.ucapan + u.jumlahUcapan }), { rsvp: 0, hadir: 0, ucapan: 0 });
  const namaDepan = nama.split(" ")[0];
  return (
    <>
      <NavGelap />
      <header className="sy-hero">
        <div className="wrap sy-hero-isi">
          <div>
            <p className="sy-eyebrow"><span aria-hidden="true">✦</span> Undangan saya</p>
            <h1 className="sy-sapa">Halo, {namaDepan}</h1>
            <p className="sy-lead">{daftar.length > 0
              ? "Pantau konfirmasi dan ucapan tamu, lalu ubah undangan kapan saja."
              : "Undangan yang Anda buat saat masuk akan tampil di sini."}</p>
          </div>
          <Link className="btn sy-baru" href="/"><Svg d={Ikon.plus} />Buat undangan baru</Link>
          {daftar.length > 0 && (
            <dl className="sy-ringkas">
              <div><dt>Undangan</dt><dd>{daftar.length}</dd></div>
              <div><dt>Konfirmasi</dt><dd>{total.rsvp}</dd></div>
              <div><dt>Tamu hadir</dt><dd>{total.hadir}</dd></div>
              <div><dt>Ucapan</dt><dd>{total.ucapan}</dd></div>
            </dl>
          )}
        </div>
      </header>

      <main className="wrap sy-badan">
        {daftar.length === 0 ? (
          <div className="sy-kosong">
            <svg className="sy-kosong-gambar" viewBox="6 4 50 46" aria-hidden="true" focusable="false">
              <path d="M22 6.5 27.5 12 22 17.5 16.5 12Z" fill="currentColor" />
              <circle cx="22" cy="30" r="13" fill="none" stroke="currentColor" strokeWidth="3" />
              <circle cx="38" cy="30" r="13" fill="none" stroke="currentColor" strokeWidth="3" />
            </svg>
            <h2>Belum ada undangan</h2>
            <p>Isi nama mempelai, tanggal, jam, dan lokasi. Pratinjaunya langsung jadi.</p>
            <div className="sy-kosong-aksi">
              <Link className="btn" href="/">Buat undangan</Link>
              <Link className="btn-ghost" href="/template">Lihat template</Link>
            </div>
          </div>
        ) : (
          <ul className="sy-daftar">
            {daftar.map(u => <Kartu key={u.slug} u={u} hari={hari} asal={asal} />)}
          </ul>
        )}
      </main>
    </>
  );
}
