// Section halaman undangan per tipe + varian (port Views/UndanganDigital/Undangan/Section/_{tipe}.{varian}.cshtml).
// Komponen murni tanpa hooks: dirender di server (/u/[slug]) dan di browser (pratinjau form pembuatan).
import { Fragment } from "react";
import type {
  IsiAcara, IsiAmplop, IsiGaleri, IsiHitungMundur, IsiMempelai, IsiPembuka, IsiPenutup, IsiRsvp, IsiSampul, IsiUcapan, SectionUndangan,
} from "@/lib/undangan/dokumen";
import type { DaftarUcapan } from "@/lib/undangan/tipe";

export interface KonteksHalaman {
  judul: string;
  // Dari ?to=, null bila tidak ada (sampul memakai tamuDefault)
  namaTamu: string | null;
  ucapan: DaftarUcapan;
}

// Teks berisi baris baru (\n) -> baris dipisah <br>
function TeksBaris({ teks }: { teks: string | null | undefined }) {
  const baris = (teks ?? "").split("\n").map(b => b.replace(/\r$/, ""));
  return <>{baris.map((b, i) => <Fragment key={i}>{i > 0 && <br />}{b}</Fragment>)}</>;
}

// Link "Simpan ke Kalender" (Google Calendar), waktu dalam UTC
export function urlKalender(judul: string, isi: IsiHitungMundur): string {
  const mulai = new Date(isi.mulai);
  const selesai = isi.selesai ? new Date(isi.selesai) : new Date(mulai.getTime() + 2 * 3600 * 1000);
  const f = (d: Date) => d.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");
  let url = "https://calendar.google.com/calendar/render?action=TEMPLATE"
    + "&text=" + encodeURIComponent(judul)
    + "&dates=" + f(mulai) + "/" + f(selesai);
  if (isi.lokasiKalender?.trim()) url += "&location=" + encodeURIComponent(isi.lokasiKalender);
  return url;
}

function Ornamen({ varian, kelas }: { varian: string; kelas?: string }) {
  // varian "hias" memakai #ikon-hias, varian adat memakai #ikon-gunungan
  return varian === "hias"
    ? <svg className={kelas ? `hias ${kelas}` : "hias"} aria-hidden="true"><use href="#ikon-hias" /></svg>
    : <svg className={kelas ? `gunungan ${kelas}` : "gunungan"} aria-hidden="true"><use href="#ikon-gunungan" /></svg>;
}

function Sampul({ isi, varian, k }: { isi: IsiSampul; varian: string; k: KonteksHalaman }) {
  return (
    <div className="sampul" id="sampul" data-tipe="sampul">
      <div className="sampul-isi">
        <div className="bingkai"></div>
        <Ornamen varian={varian} />
        <div className="label">{isi.label}</div>
        <h1 className="nama">{isi.nama1} <span className="dan">&amp;</span> {isi.nama2}</h1>
        <div className="kepada">
          <small>{isi.teksKepada}</small>
          <strong>{k.namaTamu ?? isi.tamuDefault}</strong>
          <small>di tempat</small>
        </div>
        <button className="tombol" id="tombolBuka" type="button">{isi.tombolBuka}</button>
      </div>
    </div>
  );
}

function Pembuka({ isi, varian }: { isi: IsiPembuka; varian: string }) {
  return (
    <section className="sec pembuka" data-tipe="pembuka">
      <div className="bingkai"></div>
      <Ornamen varian={varian} kelas="muncul" />
      <div className="label muncul">{isi.label}</div>
      <div className="pemisah"><svg aria-hidden="true"><use href="#ikon-belah" /></svg></div>
      <p className="basa muncul">{isi.teks}</p>
      {isi.terjemah?.trim() && <p className="terjemah muncul">{isi.terjemah}</p>}
    </section>
  );
}

function Mempelai({ isi }: { isi: IsiMempelai }) {
  return (
    <section className="sec mempelai" data-tipe="mempelai">
      {isi.orang.map((orang, i) => (
        <Fragment key={i}>
          {i > 0 && <div className="ampersand muncul" aria-hidden="true">&amp;</div>}
          <div className="muncul">
            <div className="foto-bulat">
              {orang.foto
                // eslint-disable-next-line @next/next/no-img-element
                ? <img src={orang.foto} alt={`Foto ${orang.namaPanggilan}`} loading="lazy" />
                // belum ada foto: inisial nama
                : <span aria-hidden="true">{orang.namaPanggilan.slice(0, 1)}</span>}
            </div>
            <div className="label">{orang.label}</div>
            <h2 className="nama">{orang.namaPanggilan}</h2>
            <p className="nama-lengkap">{orang.namaLengkap}</p>
            {orang.keterangan?.trim() && <p className="putra"><TeksBaris teks={orang.keterangan} /></p>}
          </div>
        </Fragment>
      ))}
    </section>
  );
}

function HitungMundur({ isi, varian, k }: { isi: IsiHitungMundur; varian: string; k: KonteksHalaman }) {
  // varian standar (adat Jawa) menulis "Dinten", varian ringkas "Hari"
  const hari = varian === "standar" ? "Dinten" : "Hari";
  return (
    <section className="sec gelap" data-tipe="hitung-mundur">
      <div className="label">{isi.label}</div>
      <h2 className="judul">{isi.judul}</h2>
      <div className="mundur" data-mundur={isi.mulai}>
        <div><b data-u="hari">0</b><span>{hari}</span></div>
        <div><b data-u="jam">0</b><span>Jam</span></div>
        <div><b data-u="menit">0</b><span>Menit</span></div>
        <div><b data-u="detik">0</b><span>Detik</span></div>
      </div>
      <a className="tombol garis" href={urlKalender(k.judul, isi)} target="_blank" rel="noopener">Simpan ke Kalender</a>
    </section>
  );
}

function Acara({ isi }: { isi: IsiAcara }) {
  return (
    <section className="sec acara" data-tipe="acara">
      <div className="label">{isi.label}</div>
      <h2 className="judul">{isi.judul}</h2>
      <ol className="lini">
        {isi.daftar.map((item, i) => (
          <li key={i} className={item.utama ? "muncul utama" : "muncul"}>
            <h3>{item.nama}</h3>
            <div className="waktu">{item.waktu}</div>
            {item.tempat?.trim() && <p>{item.tempat}</p>}
          </li>
        ))}
      </ol>
      {isi.lokasi && (
        <div className="lokasi muncul">
          {isi.lokasi.label?.trim() && <div className="label">{isi.lokasi.label}</div>}
          <h3>{isi.lokasi.nama}</h3>
          {isi.lokasi.alamat?.trim() && <p>{isi.lokasi.alamat}</p>}
          {isi.lokasi.urlPeta?.trim() && <a className="tombol" href={isi.lokasi.urlPeta} target="_blank" rel="noopener">Buka Peta</a>}
        </div>
      )}
    </section>
  );
}

function Galeri({ isi }: { isi: IsiGaleri }) {
  return (
    <section className="sec galeri" data-tipe="galeri">
      <div className="label">{isi.label}</div>
      <h2 className="judul">{isi.judul}</h2>
      <div className="galeri-grid muncul">
        {isi.foto.length === 0
          // belum ada foto: bidang warna sebagai pengganti
          ? Array.from({ length: 7 }, (_, i) => <div key={i} aria-hidden="true"></div>)
          // eslint-disable-next-line @next/next/no-img-element
          : isi.foto.map((foto, i) => <img key={i} src={foto} alt="Foto galeri" loading="lazy" />)}
      </div>
    </section>
  );
}

function Rsvp({ isi, k }: { isi: IsiRsvp; k: KonteksHalaman }) {
  return (
    <section className="sec gelap" data-tipe="rsvp">
      <div className="bingkai"></div>
      <div className="label">{isi.label}</div>
      <h2 className="judul">{isi.judul}</h2>
      {isi.catatan?.trim() && <p className="terjemah">{isi.catatan}</p>}
      <form className="form-tamu" id="formRsvp" noValidate>
        <div>
          <label htmlFor="rsvpNama">Nama</label>
          <input id="rsvpNama" name="Nama" required maxLength={80} autoComplete="name" defaultValue={k.namaTamu ?? ""} />
        </div>
        <div>
          <span className="label-form" id="rsvpHadirLabel">Kehadiran</span>
          <div className="pilih-hadir" role="radiogroup" aria-labelledby="rsvpHadirLabel">
            <input type="radio" id="rsvpHadirYa" name="Hadir" value="true" defaultChecked /><label htmlFor="rsvpHadirYa">Hadir</label>
            <input type="radio" id="rsvpHadirTidak" name="Hadir" value="false" /><label htmlFor="rsvpHadirTidak">Berhalangan</label>
          </div>
        </div>
        <div>
          <label htmlFor="rsvpJumlah">Jumlah tamu</label>
          <select id="rsvpJumlah" name="Jumlah" defaultValue={String(Math.min(2, isi.maksTamu))}>
            {Array.from({ length: isi.maksTamu }, (_, i) => <option key={i} value={i + 1}>{i + 1}</option>)}
          </select>
        </div>
        <button className="tombol emas" type="submit">Kirim Konfirmasi</button>
        <div className="pesan" role="status" aria-live="polite"></div>
      </form>
    </section>
  );
}

function Ucapan({ isi, k }: { isi: IsiUcapan; k: KonteksHalaman }) {
  return (
    <section className="sec ucapan" data-tipe="ucapan">
      <div className="label">{isi.label}</div>
      <h2 className="judul">{isi.judul}</h2>
      <form className="form-tamu" id="formUcapan" noValidate>
        <div>
          <label htmlFor="ucapanNama">Nama</label>
          <input id="ucapanNama" name="Nama" required maxLength={80} autoComplete="name" defaultValue={k.namaTamu ?? ""} />
        </div>
        <div>
          <label htmlFor="ucapanPesan">Ucapan</label>
          <textarea id="ucapanPesan" name="Pesan" required maxLength={500}></textarea>
        </div>
        <button className="tombol" type="submit">Kirim Ucapan</button>
        <div className="pesan" role="status" aria-live="polite"></div>
      </form>
      <ul className="daftar-ucapan" id="daftarUcapan">
        {k.ucapan.Daftar.map((u, i) => <li key={i}><b>{u.Nama}</b><small>{u.Waktu}</small><p>{u.Pesan}</p></li>)}
      </ul>
      {k.ucapan.AdaLagi && <button className="tombol garis muat-lagi" id="muatUcapan" type="button">Muat ucapan lain</button>}
    </section>
  );
}

function Amplop({ isi }: { isi: IsiAmplop }) {
  return (
    <section className="sec krem amplop" data-tipe="amplop">
      <div className="label">{isi.label}</div>
      <h2 className="judul">{isi.judul}</h2>
      {isi.catatan?.trim() && <p className="terjemah">{isi.catatan}</p>}
      {isi.rekening.map((rek, i) => (
        <div key={i} className="kartu-rek muncul">
          <div className="bank">{rek.bank}</div>
          <div className="norek">{rek.nomor}</div>
          <div>a.n. {rek.atasNama}</div>
          <button className="tombol emas" type="button" data-salin={rek.nomor}>Salin Nomor</button>
        </div>
      ))}
    </section>
  );
}

function Penutup({ isi, varian }: { isi: IsiPenutup; varian: string }) {
  return (
    <section className="sec penutup gelap" data-tipe="penutup">
      <div className="bingkai"></div>
      <Ornamen varian={varian} />
      <p className="basa">{isi.teks}</p>
      {isi.terjemah?.trim() && <p className="terjemah">{isi.terjemah}</p>}
      <div className="pemisah"><svg aria-hidden="true"><use href="#ikon-belah" /></svg></div>
      <div className="label">{isi.label}</div>
      <p className="nama">{isi.nama}</p>
      {isi.keluarga?.trim() && <p className="terjemah keluarga"><TeksBaris teks={isi.keluarga} /></p>}
      {isi.telepon && <a className="tombol garis kontak" href={`https://wa.me/${isi.telepon}`} target="_blank" rel="noopener">Hubungi via WhatsApp</a>}
    </section>
  );
}

export function Section({ section, k }: { section: SectionUndangan; k: KonteksHalaman }) {
  switch (section.tipe) {
    case "sampul": return <Sampul isi={section.isi} varian={section.varian} k={k} />;
    case "pembuka": return <Pembuka isi={section.isi} varian={section.varian} />;
    case "mempelai": return <Mempelai isi={section.isi} />;
    case "hitung-mundur": return <HitungMundur isi={section.isi} varian={section.varian} k={k} />;
    case "acara": return <Acara isi={section.isi} />;
    case "galeri": return <Galeri isi={section.isi} />;
    case "rsvp": return <Rsvp isi={section.isi} k={k} />;
    case "ucapan": return <Ucapan isi={section.isi} k={k} />;
    case "amplop": return <Amplop isi={section.isi} />;
    case "penutup": return <Penutup isi={section.isi} varian={section.varian} />;
  }
}
