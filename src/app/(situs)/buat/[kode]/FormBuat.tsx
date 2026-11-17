"use client";
// Markup form pembuatan (port Views/UndanganDigital/Undangan/Buat.cshtml). Markup ini statis: perilakunya dipasang
// sekali oleh pasangEditor (editor.ts), yang mengubah DOM langsung seperti Buat.js di versi .NET.
import Link from "next/link";
import { useEffect } from "react";
import type { DokumenUndangan } from "@/lib/undangan/dokumen";
import { JUMLAH_GALERI_MAKS, JUMLAH_TAMU_MAKS, ZONA_WAKTU } from "@/lib/undangan/konstanta";
import type { IsiAwal, TemplateKartu } from "@/lib/undangan/susun";
import { pasangEditor } from "./editor";

interface Props {
  kartu: TemplateKartu;
  dokumenAwal: DokumenUndangan;
  awal: IsiAwal;
  hariIni: string;
}

const MEMPELAI = [
  { kode: "Wanita", judul: "Mempelai wanita", anak: "Putri" },
  { kode: "Pria", judul: "Mempelai pria", anak: "Putra" },
];

function Opsional({ teks = "opsional" }: { teks?: string }) {
  return <span className="buat-opsional">({teks})</span>;
}

function Bagian({ id, judul, ket, buka, children }: { id: string; judul: string; ket: string; buka?: boolean; children: React.ReactNode }) {
  return (
    <details className="buat-bagian" name="bagian" open={buka}>
      <summary><span className="buat-bagian-teks"><span className="buat-bagian-judul" id={id}>{judul}</span><span className="buat-bagian-ket">{ket}</span></span></summary>
      <div className="buat-bagian-isi">{children}</div>
    </details>
  );
}

export function FormBuat({ kartu, dokumenAwal, awal, hariIni }: Props) {
  useEffect(() => pasangEditor({ kode: kartu.kode, dokumenAwal, hariIni }), [kartu.kode, dokumenAwal, hariIni]);

  return (
    <div className="wrap buat-undangan" id="buatUndangan">
      <header className="top">
        <div>
          <h1 className="brand">Buat undangan digital</h1>
          <p className="buat-template">Template: <strong>{kartu.nama}</strong> · <Link href="/#template">Ganti template</Link></p>
          <p className="tagline" id="buatTagline">Isi data utama dulu. Detail lain bisa dilengkapi sambil melihat undangannya.</p>
        </div>
      </header>

      <section className="card buat-bagian" id="buatSingkat" aria-labelledby="judulSingkat">
        <h2 id="judulSingkat">Data utama</h2>
        <form id="singkatForm" className="buat-singkat" noValidate>
          <div className="fields">
            <div className="field">
              <label className="lbl" htmlFor="singkatPria">Nama mempelai pria</label>
              <input type="text" id="singkatPria" maxLength={40} required autoComplete="off" placeholder="Nama panggilan" />
            </div>
            <div className="field">
              <label className="lbl" htmlFor="singkatWanita">Nama mempelai wanita</label>
              <input type="text" id="singkatWanita" maxLength={40} required autoComplete="off" placeholder="Nama panggilan" />
            </div>
            <div className="field full">
              <label className="lbl" htmlFor="singkatTelepon">Nomor WhatsApp</label>
              <input type="tel" id="singkatTelepon" maxLength={20} required autoComplete="tel" inputMode="tel" placeholder="Contoh: 081234567890" />
              <span className="footnote">Tampil di undangan sebagai tombol WhatsApp, terlihat oleh semua yang punya link.</span>
            </div>
            <div className="field">
              <label className="lbl" htmlFor="singkatTanggal">Tanggal acara</label>
              <input type="date" id="singkatTanggal" min={hariIni} required />
            </div>
            <div className="field">
              <label className="lbl" htmlFor="singkatJam">Jam acara</label>
              <input type="time" id="singkatJam" required />
            </div>
            <div className="field full">
              <label className="lbl" htmlFor="singkatLokasi">Lokasi acara</label>
              <input type="text" id="singkatLokasi" maxLength={150} required placeholder="Contoh: Pendapa Griya Laras" />
            </div>
          </div>
          <button className="btn" type="submit" id="singkatKirim">Lihat undangan</button>
          <div className="notice" id="singkatNotice" role="status" hidden></div>
        </form>
      </section>

      {/* Dua panel setinggi layar: pratinjau (kiri, lebar) dan editor (kanan). Kepala panel sama tinggi. */}
      <div className="buat-ruang" id="buatRuang" hidden>
        <div className="buat-panel buat-pratinjau-panel">
          <div className="buat-panel-kepala">
            <h2 className="buat-panel-judul">Pratinjau</h2>
            <span className="buat-panel-status" id="pratinjauStatus" role="status"></span>
            <button className="btn-ghost buat-kecil" type="button" id="tombolEditor" aria-controls="buatKartu" aria-expanded="true">Sembunyikan editor</button>
          </div>
          {/* Dua iframe bergantian: versi baru dimuat di belakang, ditukar setelah siap */}
          <div className="buat-pratinjau" id="pratinjau">
            <iframe title="Pratinjau undangan"></iframe>
            <iframe title="Pratinjau undangan" className="cadangan" aria-hidden="true" tabIndex={-1} inert></iframe>
          </div>
        </div>

        <div className="buat-panel buat-editor" id="buatKartu">
          <div className="buat-panel-kepala">
            <h2 className="buat-panel-judul">Editor</h2>
            <button className="btn-ghost buat-kecil" type="button" id="mulaiUlang">Mulai dari awal</button>
          </div>
          <form id="buatForm" noValidate>
            <div className="buat-editor-isi">
              {MEMPELAI.map(({ kode, judul, anak }) => (
                <Bagian key={kode} id={`judul${kode}`} judul={judul} ket="Nama, orang tua, dan foto" buka={kode === "Wanita"}>
                  <div className="fields">
                    <div className="field">
                      <label className="lbl" htmlFor={`panggilan${kode}`}>Nama panggilan</label>
                      <input type="text" id={`panggilan${kode}`} name={`Panggilan${kode}`} maxLength={40} required autoComplete="off" />
                    </div>
                    <div className="field">
                      <label className="lbl" htmlFor={`anak${kode}`}>{anak} ke- <Opsional /></label>
                      <input type="text" id={`anak${kode}`} name={`Anak${kode}`} maxLength={20} autoComplete="off" placeholder="Contoh: pertama" />
                    </div>
                    <div className="field full">
                      <label className="lbl" htmlFor={`lengkap${kode}`}>Nama lengkap dan gelar <Opsional /></label>
                      <input type="text" id={`lengkap${kode}`} name={`Lengkap${kode}`} maxLength={100} autoComplete="off" />
                    </div>
                    <div className="field full">
                      <label className="lbl" htmlFor={`ayah${kode}`}>Nama ayah <Opsional /></label>
                      <input type="text" id={`ayah${kode}`} name={`Ayah${kode}`} maxLength={80} autoComplete="off" placeholder="Contoh: Bapak Hadi Santosa" />
                    </div>
                    <div className="field full">
                      <label className="lbl" htmlFor={`ibu${kode}`}>Nama ibu <Opsional /></label>
                      <input type="text" id={`ibu${kode}`} name={`Ibu${kode}`} maxLength={80} autoComplete="off" placeholder="Contoh: Ibu Retno Wulandari" />
                    </div>
                    <div className="field full">
                      <label className="lbl" htmlFor={`foto${kode}`}>Foto <Opsional /></label>
                      <input type="file" id={`foto${kode}`} accept="image/jpeg,image/png,image/webp" data-foto-mempelai={kode} />
                      <div className="buat-foto-pilihan" id={`pratinjau${kode}`} hidden>
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img alt={`Pratinjau foto ${judul.toLowerCase()}`} />
                        <button className="btn-ghost" type="button">Hapus foto</button>
                      </div>
                    </div>
                  </div>
                </Bagian>
              ))}

              <Bagian id="judulAcara" judul="Susunan acara" ket="Akad, resepsi, tanggal, dan jam">
                <div className="field buat-zona">
                  <label className="lbl" htmlFor="zonaWaktu">Zona waktu</label>
                  <select id="zonaWaktu" name="ZonaWaktu">
                    {ZONA_WAKTU.map(z => <option key={z.nilai} value={z.nilai}>{z.nama}</option>)}
                  </select>
                </div>
                <div className="buat-daftar" id="daftarAcara"></div>
                <button className="btn-ghost" type="button" id="tambahAcara">Tambah acara</button>
                <p className="footnote">Hitung mundur memakai acara utama pertama yang bertanggal. Acara tanpa tanggal ditulis &quot;Tanggal menyusul&quot;.</p>
              </Bagian>

              <Bagian id="judulLokasi" judul="Tempat acara" ket="Nama tempat, alamat, dan peta">
                <div className="fields">
                  <div className="field full">
                    <label className="lbl" htmlFor="lokasiNama">Nama tempat</label>
                    <input type="text" id="lokasiNama" name="LokasiNama" maxLength={150} required placeholder="Contoh: Pendapa Griya Laras" />
                  </div>
                  <div className="field full">
                    <label className="lbl" htmlFor="lokasiAlamat">Alamat <Opsional /></label>
                    <input type="text" id="lokasiAlamat" name="LokasiAlamat" maxLength={250} />
                  </div>
                  <div className="field full">
                    <label className="lbl" htmlFor="lokasiPeta">Link peta <Opsional /></label>
                    <input type="url" id="lokasiPeta" name="LokasiPeta" maxLength={500} placeholder="https://maps.app.goo.gl/..." />
                    <span className="footnote">Bila kosong, tombol peta mencari nama dan alamat tempat di Google Maps.</span>
                  </div>
                </div>
              </Bagian>

              <Bagian id="judulKontak" judul="Kontak" ket="Nomor WhatsApp di undangan">
                <div className="field">
                  <label className="lbl" htmlFor="telepon">Nomor WhatsApp</label>
                  <input type="tel" id="telepon" name="Telepon" maxLength={20} required autoComplete="tel" inputMode="tel" placeholder="Contoh: 081234567890" />
                  <span className="footnote">Tampil di undangan sebagai tombol WhatsApp, terlihat oleh semua yang punya link.</span>
                </div>
              </Bagian>

              <Bagian id="judulGaleri" judul="Galeri foto" ket="Foto untuk galeri undangan">
                <div className="field">
                  <label className="lbl" htmlFor="fotoGaleri">Pilih foto <Opsional teks={`opsional, maksimal ${JUMLAH_GALERI_MAKS}`} /></label>
                  <input type="file" id="fotoGaleri" accept="image/jpeg,image/png,image/webp" multiple />
                  <span className="footnote">Foto diperkecil otomatis sebelum dikirim.</span>
                </div>
                <ul className="buat-galeri" id="daftarGaleri" hidden></ul>
              </Bagian>

              <Bagian id="judulAmplop" judul="Amplop digital" ket="Rekening untuk kado digital">
                <p className="footnote">Nomor rekening terlihat oleh semua yang punya link undangan. Bila kosong, bagian ini tidak tampil.</p>
                <div className="buat-daftar" id="daftarRekening"></div>
                <button className="btn-ghost" type="button" id="tambahRekening">Tambah rekening</button>
                <div className="field">
                  <label className="lbl" htmlFor="catatanAmplop">Catatan</label>
                  <textarea id="catatanAmplop" name="CatatanAmplop" rows={2} maxLength={300} defaultValue={awal.catatanAmplop ?? ""}></textarea>
                </div>
              </Bagian>

              <Bagian id="judulKonfirmasi" judul="Konfirmasi kehadiran dan ucapan" ket="RSVP dan ucapan dari tamu">
                <label className="buat-centang"><input type="checkbox" id="tampilRsvp" name="TampilRsvp" defaultChecked /> Tampilkan formulir konfirmasi kehadiran (RSVP)</label>
                <div className="fields" id="isianRsvp">
                  <div className="field">
                    <label className="lbl" htmlFor="batasRsvp">Batas konfirmasi <Opsional /></label>
                    <input type="date" id="batasRsvp" name="BatasRsvp" min={hariIni} />
                  </div>
                  <div className="field">
                    <label className="lbl" htmlFor="maksTamu">Maksimal tamu per konfirmasi</label>
                    <input type="number" id="maksTamu" name="MaksTamu" min={1} max={10} defaultValue={2} />
                  </div>
                  <div className="field full">
                    <label className="lbl" htmlFor="catatanRsvp">Catatan <Opsional /></label>
                    <input type="text" id="catatanRsvp" name="CatatanRsvp" maxLength={200} />
                  </div>
                </div>
                <label className="buat-centang"><input type="checkbox" id="tampilUcapan" name="TampilUcapan" defaultChecked /> Tampilkan ucapan dan doa dari tamu</label>
              </Bagian>

              <Bagian id="judulTeks" judul="Kata pembuka dan penutup" ket="Kalimat pembuka dan penutup">
                <div className="fields">
                  <div className="field full">
                    <label className="lbl" htmlFor="teksPembuka">Kata pembuka</label>
                    <textarea id="teksPembuka" name="TeksPembuka" rows={3} maxLength={500} defaultValue={awal.teksPembuka ?? ""}></textarea>
                  </div>
                  <div className="field full">
                    <label className="lbl" htmlFor="terjemahPembuka">Terjemahan kata pembuka <Opsional /></label>
                    <textarea id="terjemahPembuka" name="TerjemahPembuka" rows={3} maxLength={500} defaultValue={awal.terjemahPembuka ?? ""}></textarea>
                  </div>
                  <div className="field full">
                    <label className="lbl" htmlFor="teksPenutup">Kata penutup</label>
                    <textarea id="teksPenutup" name="TeksPenutup" rows={3} maxLength={500} defaultValue={awal.teksPenutup ?? ""}></textarea>
                  </div>
                  <div className="field full">
                    <label className="lbl" htmlFor="terjemahPenutup">Terjemahan kata penutup <Opsional /></label>
                    <textarea id="terjemahPenutup" name="TerjemahPenutup" rows={3} maxLength={500} defaultValue={awal.terjemahPenutup ?? ""}></textarea>
                  </div>
                </div>
              </Bagian>

              <Bagian id="judulTamu" judul="Tamu yang diundang" ket="Link undangan per nama tamu">
                <div className="field">
                  <label className="lbl" htmlFor="daftarTamu">Satu nama per baris <Opsional teks={`opsional, maksimal ${JUMLAH_TAMU_MAKS}`} /></label>
                  <textarea id="daftarTamu" name="Tamu" rows={6} placeholder={"Bapak Agus Setiawan\nKeluarga Ibu Dewi"}></textarea>
                  <span className="footnote"><span id="jumlahTamu">0</span> tamu. Setiap tamu mendapat link yang menyapa namanya. Daftar ini tidak tampil di undangan.</span>
                </div>
              </Bagian>
            </div>
            <div className="buat-editor-kaki">
              <div className="notice" id="buatNotice" role="status" hidden></div>
              <button className="btn" type="submit" id="buatKirim">Buat undangan</button>
              <p className="footnote">Undangan langsung terbit. Siapa pun yang punya link bisa membukanya, tetapi undangan tidak muncul di mesin pencari.</p>
            </div>
          </form>
        </div>
      </div>

      <section className="card buat-hasil" id="buatHasil" aria-labelledby="hasilJudul" tabIndex={-1} hidden>
        <h2 className="buat-hasil-judul" id="hasilJudul">Undanganmu sudah jadi</h2>
        <p><a id="hasilUrl" target="_blank" rel="noopener"></a></p>
        <div className="buat-aksi">
          <a className="btn" id="hasilBuka" target="_blank" rel="noopener">Buka undangan</a>
          <button className="btn-ghost" type="button" data-salin="hasilUrl">Salin link</button>
          <a className="btn-ghost" id="hasilWa" target="_blank" rel="noopener">Bagikan ke WhatsApp</a>
        </div>
        <p className="footnote">Untuk menyapa tamu dengan namanya, tambahkan <code>?to=Nama Tamu</code> di akhir link.</p>

        <div id="hasilTamu" className="buat-hasil-tamu" hidden>
          <h3>Link untuk tamu</h3>
          <p>Simpan daftar ini sebelum menutup halaman. Belum ada halaman untuk membukanya lagi.</p>
          <div className="buat-aksi"><button className="btn-ghost" type="button" id="salinSemuaTamu">Salin semua link</button></div>
          <ul className="buat-tamu" id="hasilTamuDaftar"></ul>
        </div>

        <h3>Kode edit</h3>
        <p>Simpan kode ini baik-baik. Kode ini dibutuhkan untuk mengubah undangan saat fitur edit tersedia, dan tidak bisa ditampilkan lagi.</p>
        <div className="buat-kode-baris">
          <code className="buat-kode" id="hasilKode"></code>
          <button className="btn-ghost" type="button" data-salin="hasilKode">Salin kode</button>
        </div>
      </section>
    </div>
  );
}
