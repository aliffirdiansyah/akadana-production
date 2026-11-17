// Beranda = katalog template (port Views/UndanganDigital/Undangan/Katalog.cshtml).
// Form data utama tampil langsung (FormSingkat): isinya jadi draf editor, jadi tidak diketik ulang di /buat.
// Pengunjung yang belum masuk melihat hero + form, sorotan isi editor, lalu daftar template.
import Link from "next/link";
import { FormSingkat } from "@/components/FormSingkat";
import { NavGelap } from "@/components/NavGelap";
import { hariIni } from "@/lib/waktu";
import { NamaContoh, TautanContoh } from "@/components/TautanContoh";
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
                  <a className="pk-btn-garis" href="#template">Lihat semua template</a>
                </div>
                <p className="pk-kecil">Tanpa akun. Isianmu tersimpan otomatis di perangkat ini dan undangan bisa diubah lagi setelah jadi. Template lainnya terbuka setelah masuk.</p>
              </div>

              {/* Form data utama asli: isinya langsung jadi draf editor, jadi tidak perlu diketik ulang */}
              <div className="beranda-form-wadah">
                <FormSingkat kodeTemplate={tujuan} hariIni={hariIni()} />
              </div>
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

      {sudahLogin && (
        <section className="wrap" aria-labelledby="judulBeranda">
          <header className="top">
            <div>
              <h1 className="brand" id="judulBeranda">Undangan digital</h1>
              <p className="tagline">Isi data utama untuk membuat undangan baru, atau ubah undangan yang sudah ada di <Link href="/saya">Undangan saya</Link>.</p>
            </div>
          </header>
          <div className="beranda-form-login">
            <FormSingkat kodeTemplate={tujuan} hariIni={hariIni()} />
          </div>
        </section>
      )}

      <div className={sudahLogin ? "wrap" : "wrap ud-template"} id="template">
        {sudahLogin ? (
          <header className="top">
            <div>
              <h2 className="brand">Pilih template</h2>
              <p className="tagline">Lihat pratinjau tiap template. Isian yang sudah diisi ikut terbawa saat ganti template.</p>
            </div>
          </header>
        ) : (
          <header className="ud-template-kepala">
            <div>
              <h2 className="pk-h2">Pilih template</h2>
              <p>Buka pratinjau dengan isi contoh, lalu pakai yang paling cocok. Draf yang sudah kamu isi ikut terbawa saat ganti template.</p>
            </div>
          </header>
        )}

        {daftar.length === 0 ? (
          <p className="notice">Belum ada template yang tersedia.</p>
        ) : (
          <ul className="tpl-daftar tpl-katalog">
            {daftar.map(t => {
              const terkunci = !t.gratis && !sudahLogin;
              const tujuan = `/buat/${t.kode}`;
              const contoh = `/contoh/${t.kode}`;
              return (
                <li key={t.kode}>
                  <div className="tpl-kartu" data-kode={t.kode}>
                    {/* gambar mini membuka pratinjau yang sama dengan tombol "Pratinjau", jadi disembunyikan dari pembaca layar */}
                    <TautanContoh className="tpl-pratinjau" href={contoh} tabIndex={-1} aria-hidden="true">
                      <span className="tpl-bingkai">
                        <span className="tpl-label">{t.contohLabel}</span>
                        <span className="tpl-nama"><NamaContoh asli={t.contohNama} /></span>
                        <span className="tpl-belah"></span>
                      </span>
                    </TautanContoh>
                    <span className="tpl-info">
                      <span className="tpl-judul">{t.nama}</span>
                      {t.gratis ? (
                        <span className="tpl-status tpl-gratis">Gratis</span>
                      ) : terkunci ? (
                        <span className="tpl-status tpl-kunci">
                          <svg viewBox="0 0 16 16" width="13" height="13" aria-hidden="true" focusable="false"><path fill="currentColor" d="M8 1a3.5 3.5 0 0 0-3.5 3.5V7H4a1 1 0 0 0-1 1v6a1 1 0 0 0 1 1h8a1 1 0 0 0 1-1V8a1 1 0 0 0-1-1h-.5V4.5A3.5 3.5 0 0 0 8 1Zm2 6H6V4.5a2 2 0 1 1 4 0V7Z" /></svg>
                          Wajib masuk
                        </span>
                      ) : (
                        <span className="tpl-status tpl-terbuka">Terbuka</span>
                      )}
                      <span className="tpl-tombol">
                        <TautanContoh className="tpl-btn tpl-btn-garis" href={contoh} aria-label={`Pratinjau ${t.nama} (tab baru)`}>Pratinjau</TautanContoh>
                        <Link className="tpl-btn tpl-btn-utama" href={terkunci ? `/masuk?returnUrl=${encodeURIComponent(tujuan)}` : tujuan}
                          aria-label={`${t.gratis ? "Coba gratis" : terkunci ? "Masuk untuk memakai" : "Pakai"} ${t.nama}`}>
                          {t.gratis ? "Coba gratis" : terkunci ? "Masuk" : "Pakai"}
                        </Link>
                      </span>
                    </span>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </>
  );
}
