// Beranda = katalog template (port Views/UndanganDigital/Undangan/Katalog.cshtml).
// Pengunjung: hero dengan ilustrasi form + ponsel dan tombol coba gratis, sorotan isi editor, lalu daftar template.
// Pengguna login: form data utama (FormSingkat) di tengah layar; isinya jadi draf editor, jadi tidak diketik ulang di /buat.
import Link from "next/link";
import { FormSingkat } from "@/components/FormSingkat";
import { NavGelap } from "@/components/NavGelap";
import { hariIni } from "@/lib/waktu";
import { DaftarTemplate } from "@/components/DaftarTemplate";
import { getTemplateList } from "@/lib/undangan/data";
import { getPengguna } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

const FITUR = [
  { judul: "Mempelai", teks: "Nama panggilan dan lengkap, anak ke-, nama orang tua, dan foto.", ikon: <><circle cx="8" cy="8" r="3" /><circle cx="16" cy="8" r="3" /><path d="M2 20c0-3.3 2.7-6 6-6 1.6 0 3 .6 4 1.6 1-1 2.4-1.6 4-1.6 3.3 0 6 2.7 6 6" /></> },
  { judul: "Susunan acara", teks: "Akad, resepsi, atau acara lain, lengkap dengan tanggal, jam, dan zona waktu.", ikon: <><rect x="3" y="5" width="18" height="16" rx="2" /><path d="M3 10h18M8 3v4M16 3v4M7 14h4M7 17h7" /></> },
  { judul: "Tempat & peta", teks: "Nama gedung, alamat, dan link Google Maps untuk petunjuk arah.", ikon: <><path d="M12 21s-7-6.2-7-11a7 7 0 0 1 14 0c0 4.8-7 11-7 11Z" /><circle cx="12" cy="10" r="2.5" /></> },
  { judul: "Galeri foto", teks: "Foto prewedding atau momen berdua, tampil rapi dalam grid.", ikon: <><rect x="3" y="4" width="18" height="16" rx="2" /><circle cx="9" cy="10" r="2" /><path d="m3 18 5-5 4 4 3-3 6 6" /></> },
  { judul: "Amplop digital", teks: "Rekening bank atau dompet digital untuk kado, tamu tinggal salin nomornya.", ikon: <><rect x="3" y="6" width="18" height="13" rx="2" /><path d="m3 8 9 6 9-6" /></> },
  { judul: "RSVP & ucapan", teks: "Tamu konfirmasi hadir dan menulis ucapan. Atur batas waktu dan jumlah tamu.", ikon: <><path d="M4 5h16v11H9l-5 4z" /><path d="m9 10 2 2 4-4" /></> },
  { judul: "Kata pembuka & penutup", teks: "Pakai kalimat bawaan template, atau tulis sendiri lengkap dengan terjemahan.", ikon: <path d="M5 5h14M5 9h14M5 13h9M5 17h6" /> },
  { judul: "Link per nama tamu", teks: "Satu nama per baris, tiap tamu dapat link dengan sapaan namanya sendiri.", ikon: <path d="M10 14a5 5 0 0 0 7 0l3-3a5 5 0 0 0-7-7l-1 1M14 10a5 5 0 0 0-7 0l-3 3a5 5 0 0 0 7 7l1-1" /> },
];

export default async function Katalog() {
  const [daftar, pengguna] = await Promise.all([getTemplateList(), getPengguna()]);
  const sudahLogin = pengguna != null;
  const gratis = daftar.find(t => t.gratis);
  // Form data utama membuka editor template ini; template bisa diganti dari editor tanpa kehilangan isian
  const tujuan = (gratis ?? daftar[0])?.kode ?? "jawa-01";

  return (
    <>
      {!sudahLogin && (
        <div className="pl-kenal ud-kenal">
          <NavGelap />
          <header className="pk-hero">
            <div className="wrap pk-hero-grid">
              <div className="pk-hero-teks">
                <p className="pk-eyebrow"><span aria-hidden="true">✦</span> Undangan digital{gratis ? " · 1 template gratis" : ""}</p>
                <h1 className="pk-judul">Isi enam kolom, undanganmu langsung jadi.</h1>
                <p className="pk-lead">Tulis nama mempelai, tanggal, jam, dan lokasi. Pratinjaunya berubah selagi kamu mengetik, lalu bagikan link-nya ke tamu lewat WhatsApp.</p>
                <div className="pk-aksi">
                  {gratis && <Link className="btn pk-btn" href={`/buat/${gratis.kode}`}>Coba gratis tanpa akun</Link>}
                  <a className="pk-btn-garis" href="#template">Lihat semua template</a>
                </div>
                <p className="pk-kecil">Isianmu tersimpan otomatis sebagai draf di perangkat ini. Template lainnya terbuka setelah masuk.</p>
              </div>

              {/* Pratinjau dekoratif: form "Data utama" dan hasilnya di ponsel. Data rekaan. */}
              <figure className="pk-pratinjau ud-pratinjau" aria-label="Contoh form undangan dan hasilnya">
                <div className="ud-form" aria-hidden="true">
                  <div className="ud-form-kepala">
                    <span className="pk-label">Data utama</span>
                    <span className="ud-simpan"><span className="ud-simpan-titik"></span>Draf tersimpan</span>
                  </div>
                  <div className="ud-kolom-grid">
                    <div className="ud-kolom"><span>Mempelai pria</span><b>Alif Pratama</b></div>
                    <div className="ud-kolom ud-kolom-aktif"><span>Mempelai wanita</span><b>Putri Maharani<i className="ud-kursor"></i></b></div>
                    <div className="ud-kolom"><span>Tanggal acara</span><b>12 Juni 2027</b></div>
                    <div className="ud-kolom"><span>Jam acara</span><b>08.00 WIB</b></div>
                    <div className="ud-kolom ud-kolom-penuh"><span>Lokasi acara</span><b>Pendopo Sekar Kedhaton, Yogyakarta</b></div>
                    <div className="ud-kolom ud-kolom-penuh"><span>Nomor WhatsApp</span><b>0812 3456 7890</b></div>
                  </div>
                </div>

                <div className="ud-hp" aria-hidden="true">
                  <div className="ud-hp-layar">
                    <span className="ud-hp-kecil">The wedding of</span>
                    <span className="ud-hp-nama">Alif <i>&amp;</i> Putri</span>
                    <span className="ud-hp-belah"></span>
                    <span className="ud-hp-tanggal">12 · 06 · 2027</span>
                    <span className="ud-hp-hitung"><span><b>128</b>hari</span><span><b>06</b>jam</span><span><b>41</b>menit</span></span>
                    <span className="ud-hp-tombol">Buka undangan</span>
                  </div>
                </div>

                <div className="pk-tempel ud-tempel-1" aria-hidden="true">
                  <span className="ud-tempel-ikon">
                    <svg viewBox="0 0 24 24"><path d="M10 14a5 5 0 0 0 7 0l3-3a5 5 0 0 0-7-7l-1 1M14 10a5 5 0 0 0-7 0l-3 3a5 5 0 0 0 7 7l1-1" /></svg>
                  </span>
                  <span><b>/u/alif-putri</b><br />Untuk: Keluarga Pak Budi</span>
                </div>
                <div className="pk-tempel ud-tempel-2" aria-hidden="true">
                  <span className="pk-centang">✓</span>
                  <span><b>3 tamu</b> konfirmasi hadir</span>
                </div>
                <figcaption className="sr-only">Contoh: form data utama di sebelah kiri, hasil undangan di ponsel di sebelah kanan.</figcaption>
              </figure>
            </div>
          </header>

          <main>
            <section className="wrap pk-bagian" aria-labelledby="udIsi">
              <p className="pk-eyebrow pk-eyebrow-gelap">Isi editor</p>
              <h2 className="pk-h2" id="udIsi">Lengkapi sesukamu, semuanya opsional setelah data utama</h2>
              <ul className="pk-fitur ud-fitur">
                {FITUR.map(f => (
                  <li key={f.judul}>
                    <span className="pk-ikon" aria-hidden="true"><svg viewBox="0 0 24 24">{f.ikon}</svg></span>
                    <h3>{f.judul}</h3>
                    <p>{f.teks}</p>
                  </li>
                ))}
              </ul>
            </section>
          </main>
        </div>
      )}

      {sudahLogin ? (
        // Pengguna login: fokus mengisi, form di tengah layar. Template dipilih dari editor (/template).
        <section className="wrap beranda-fokus" aria-labelledby="judulBeranda">
          <header className="beranda-fokus-kepala">
            <h1 className="brand" id="judulBeranda">Undangan digital</h1>
            <p className="tagline">Isi data utama untuk membuat undangan baru, atau ubah undangan yang sudah ada di <Link href="/saya">Undangan saya</Link>.</p>
          </header>
          <FormSingkat kodeTemplate={tujuan} hariIni={hariIni()} />
        </section>
      ) : (
        <div className="wrap ud-template" id="template">
          <header className="ud-template-kepala">
            <div>
              <h2 className="pk-h2">Pilih template</h2>
              <p>Buka pratinjau dengan isi contoh, lalu pakai yang paling cocok. Draf yang sudah kamu isi ikut terbawa saat ganti template.</p>
            </div>
          </header>
          <DaftarTemplate daftar={daftar} sudahLogin={false} />
        </div>
      )}
    </>
  );
}
