"use client";
// Kelola tamu: tambah (nama + nomor WA), kirim undangan pribadi lewat WhatsApp, salin link, hapus.
// Akses: pemilik yang login, atau kode edit dari #kode=... / sessionStorage (sama dengan editor mode ubah).
// Link tiap tamu /u/{slug}?t={kode}: undangan menyapa namanya dan menampilkan QR unik untuk buku tamu.
import Link from "next/link";
import { useEffect, useState } from "react";
import { gagal, sukses, tanya } from "@/lib/konfirmasi";
import { saringTelepon } from "@/lib/undangan/singkat";
import { STATUS_SUKSES, type ResponseBase } from "@/lib/undangan/tipe";

interface Tamu {
  Kode: string;
  Nama: string;
  Telepon: string | null;
  DikirimPada: string | null;
  HadirPada: string | null;
}

const kunciSesi = (slug: string) => `akadana_kode_edit_${slug}`;

function ambilKode(teks: string): string | null {
  const m = /(?:^|[#&?])kode=([A-Za-z0-9_-]{20,})/.exec(teks) ?? /^([A-Za-z0-9_-]{20,})$/.exec(teks.trim());
  return m ? m[1] : null;
}

// 6281234567890 -> 0812-3456-7890
function tampilNomor(t: string): string {
  const lokal = "0" + t.slice(2);
  return lokal.replace(/^(\d{4})(\d{4})(\d+)$/, "$1-$2-$3");
}

const waktu = (iso: string) => new Intl.DateTimeFormat("id-ID", { timeZone: "Asia/Jakarta", day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" }).format(new Date(iso));

const Ikon = {
  wa: <path d="M5 19l1.2-3.6A7.5 7.5 0 1 1 9 18.5zM9.5 9.5c.3 2 2 3.8 4 4.2l1-1 2 .8-.4 1.6c-3.6.2-7.6-3.6-7.4-7.3l1.6-.4.8 2z" />,
  salin: <><rect x="8" y="8" width="12" height="12" rx="2" /><path d="M16 8V5a1 1 0 0 0-1-1H5a1 1 0 0 0-1 1v10a1 1 0 0 0 1 1h3" /></>,
  hapus: <path d="M5 7h14M10 7V5h4v2M7 7l1 12h8l1-12" />,
  buka: <path d="M14 4h6v6M20 4l-9 9M18 14v5a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1h5" />,
  plus: <path d="M12 5v14M5 12h14" />,
};
const Svg = ({ d }: { d: React.ReactNode }) => <svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true" focusable="false">{d}</svg>;

export function KelolaTamu({ slug, sudahMasuk }: { slug: string; sudahMasuk: boolean }) {
  const [kode, setKode] = useState<string | null>(null);
  const [daftar, setDaftar] = useState<Tamu[] | null>(null);
  const [pesan, setPesan] = useState<string | null>(null);
  const [nama, setNama] = useState("");
  const [telepon, setTelepon] = useState("");
  const [sibuk, setSibuk] = useState(false);
  const [tempel, setTempel] = useState("");
  const [tersalin, setTersalin] = useState<string | null>(null);

  async function api<T>(body: Record<string, unknown>, kodeEdit = kode): Promise<ResponseBase<T>> {
    const res = await fetch(`/api/undangan/${slug}/tamu`, {
      method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ...body, KodeEdit: kodeEdit }),
    });
    return res.json();
  }

  async function muat(kodeEdit: string | null) {
    setPesan(null);
    try {
      const hasil = await api<{ tamu: Tamu[] }>({ Aksi: "daftar" }, kodeEdit);
      if (hasil.Status !== STATUS_SUKSES || !hasil.Data) {
        if (kodeEdit) try { sessionStorage.removeItem(kunciSesi(slug)); } catch { /* abaikan */ }
        setPesan(kodeEdit || sudahMasuk ? hasil.Message || "Undangan tidak ditemukan atau bukan milik Anda." : null);
        setDaftar(null);
        return;
      }
      if (kodeEdit) try { sessionStorage.setItem(kunciSesi(slug), kodeEdit); } catch { /* abaikan */ }
      setKode(kodeEdit);
      setDaftar(hasil.Data.tamu);
    } catch {
      setPesan("Tidak bisa terhubung. Periksa koneksi, lalu muat ulang.");
    }
  }

  useEffect(() => {
    let k = ambilKode(location.hash);
    if (k) history.replaceState(null, "", location.pathname + location.search);
    else try { k = sessionStorage.getItem(kunciSesi(slug)); } catch { k = null; }
    // eslint-disable-next-line react-hooks/set-state-in-effect -- membaca hash dan sessionStorage hanya bisa setelah mount
    muat(k);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [slug]);

  const linkTamu = (t: Tamu) => `${location.origin}/u/${slug}?t=${t.Kode}`;

  async function tambah(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!nama.trim()) { setPesan("Nama tamu harus diisi."); return; }
    setSibuk(true);
    setPesan(null);
    try {
      const hasil = await api<Tamu>({ Aksi: "tambah", Nama: nama, Telepon: telepon });
      if (hasil.Status !== STATUS_SUKSES || !hasil.Data) { setPesan(hasil.Message); return; }
      setDaftar(d => [...(d ?? []), hasil.Data!]);
      setNama("");
      setTelepon("");
      document.getElementById("tamuNama")?.focus();
    } catch {
      setPesan("Tamu gagal ditambahkan. Periksa koneksi, lalu coba lagi.");
    } finally {
      setSibuk(false);
    }
  }

  function kirim(t: Tamu) {
    if (!t.Telepon) return;
    const teks = `Kepada Yth.\n${t.Nama}\n\nTanpa mengurangi rasa hormat, kami mengundang Bapak/Ibu/Saudara/i untuk hadir di acara pernikahan kami.\n\nBuka undangan:\n${linkTamu(t)}\n\nMohon tunjukkan QR pada undangan kepada penerima tamu saat tiba. Terima kasih.`;
    // dibuka langsung di event klik supaya tidak diblokir popup
    window.open(`https://wa.me/${t.Telepon}?text=${encodeURIComponent(teks)}`, "_blank", "noopener");
    api<Tamu>({ Aksi: "kirim", Kode: t.Kode }).then(hasil => {
      if (hasil.Status === STATUS_SUKSES && hasil.Data) setDaftar(d => d?.map(x => (x.Kode === t.Kode ? hasil.Data! : x)) ?? d);
    }).catch(() => { /* status terkirim hanya catatan; WhatsApp sudah terbuka */ });
  }

  async function salin(t: Tamu) {
    try {
      await navigator.clipboard.writeText(linkTamu(t));
      setTersalin(t.Kode);
      setTimeout(() => setTersalin(x => (x === t.Kode ? null : x)), 1800);
    } catch {
      gagal("Link gagal disalin.");
    }
  }

  async function hapus(t: Tamu) {
    if (!await tanya({ judul: `Hapus ${t.Nama}?`, teks: "Link dan QR tamu ini berhenti berlaku. Tidak bisa dikembalikan.", tombol: "Ya, hapus", bahaya: true })) return;
    const hasil = await api({ Aksi: "hapus", Kode: t.Kode }).catch(() => null);
    if (!hasil || hasil.Status !== STATUS_SUKSES) { gagal(hasil?.Message ?? "Tamu gagal dihapus. Periksa koneksi, lalu coba lagi."); return; }
    setDaftar(d => d?.filter(x => x.Kode !== t.Kode) ?? d);
    sukses("Tamu dihapus.");
  }

  // Belum punya akses: tempel link kelola tamu / edit, atau masuk
  if (daftar === null) {
    return (
      <main className="wrap akun-masuk">
        <div className="card akun-kartu">
          <h1>Tamu undangan</h1>
          <p className="akun-hint">Buka lewat link edit yang didapat saat undangan dibuat, atau tempel link itu di sini.</p>
          {pesan && <p className="empty" role="alert">{pesan}</p>}
          <form onSubmit={e => {
            e.preventDefault();
            const k = ambilKode(tempel);
            if (!k) { setPesan("Tempel link edit lengkap, misalnya https://.../edit/nama-undangan#kode=..."); return; }
            muat(k);
          }}>
            <div className="field">
              <label className="lbl" htmlFor="linkEditTamu">Link edit</label>
              <input id="linkEditTamu" type="text" autoComplete="off" value={tempel} onChange={e => setTempel(e.target.value)} placeholder="https://.../edit/...#kode=..." />
            </div>
            <button type="submit" className="btn">Buka daftar tamu</button>
          </form>
          {!sudahMasuk && (
            <p className="akun-alih">Membuat undangan saat masuk dengan Google? <Link href={`/masuk?returnUrl=${encodeURIComponent(`/tamu/${slug}`)}`}>Masuk</Link></p>
          )}
        </div>
      </main>
    );
  }

  const terkirim = daftar.filter(t => t.DikirimPada).length;
  const tanpaNomor = daftar.filter(t => !t.Telepon).length;

  return (
    <main className="wrap tm">
      <header className="tm-kepala">
        <div>
          <p className="beranda-fokus-eyebrow"><span aria-hidden="true">✦</span> Tamu undangan</p>
          <h1 className="brand">Kirim undangan ke tamu</h1>
          <p className="tagline">Setiap tamu mendapat link pribadi yang menyapa namanya dan QR unik untuk ditunjukkan saat datang.</p>
        </div>
        <a className="sy-btn" href={`/u/${slug}`} target="_blank" rel="noopener"><Svg d={Ikon.buka} />Lihat undangan</a>
      </header>

      <dl className="tm-ringkas">
        <div><dt>Tamu</dt><dd>{daftar.length}</dd></div>
        <div><dt>Terkirim</dt><dd>{terkirim}</dd></div>
        <div><dt>Belum dikirim</dt><dd>{daftar.length - terkirim}</dd></div>
      </dl>

      <form className="card tm-tambah" onSubmit={tambah} noValidate>
        <div className="field">
          <label className="lbl" htmlFor="tamuNama">Nama tamu</label>
          <input id="tamuNama" type="text" maxLength={60} autoComplete="off" value={nama} onChange={e => setNama(e.target.value)} placeholder="Contoh: Bapak Agus Setiawan" />
        </div>
        <div className="field">
          <label className="lbl" htmlFor="tamuTelepon">Nomor WhatsApp</label>
          <input id="tamuTelepon" type="tel" inputMode="tel" maxLength={20} autoComplete="off" value={telepon}
            onChange={e => setTelepon(saringTelepon(e.target.value))} placeholder="Contoh: 081234567890" />
        </div>
        <button className="btn tm-tambah-btn" type="submit" disabled={sibuk}><Svg d={Ikon.plus} />{sibuk ? "Menambah..." : "Tambah tamu"}</button>
        {pesan && <p className="notice tm-pesan" role="alert">{pesan}</p>}
      </form>

      {daftar.length === 0 ? (
        <p className="tm-kosong">Belum ada tamu. Tambahkan nama dan nomor WhatsApp di atas.</p>
      ) : (
        <>
          {tanpaNomor > 0 && <p className="footnote tm-catatan">{tanpaNomor} tamu belum punya nomor WhatsApp: salin link-nya untuk dikirim lewat aplikasi lain.</p>}
          <ul className="tm-daftar">
            {daftar.map(t => (
              <li key={t.Kode} className="tm-baris">
                <span className="tm-inisial" aria-hidden="true">{t.Nama.slice(0, 1).toUpperCase()}</span>
                <span className="tm-info">
                  <strong>{t.Nama}</strong>
                  <span>{t.Telepon ? tampilNomor(t.Telepon) : "Tanpa nomor WhatsApp"}</span>
                </span>
                <span className={t.DikirimPada ? "tm-status tm-status-kirim" : "tm-status"}>
                  {t.DikirimPada ? `Terkirim ${waktu(t.DikirimPada)}` : "Belum dikirim"}
                </span>
                <span className="tm-aksi">
                  {t.Telepon && (
                    <button type="button" className="sy-btn sy-btn-utama" onClick={() => kirim(t)}>
                      <Svg d={Ikon.wa} />{t.DikirimPada ? "Kirim ulang" : "Kirim undangan"}
                    </button>
                  )}
                  <button type="button" className="sy-btn sy-btn-ikon" onClick={() => salin(t)} aria-label={`Salin link undangan ${t.Nama}`} title="Salin link">
                    {tersalin === t.Kode ? "✓" : <Svg d={Ikon.salin} />}
                  </button>
                  <button type="button" className="sy-btn sy-btn-ikon tm-hapus" onClick={() => hapus(t)} aria-label={`Hapus ${t.Nama}`} title="Hapus">
                    <Svg d={Ikon.hapus} />
                  </button>
                </span>
              </li>
            ))}
          </ul>
        </>
      )}
    </main>
  );
}
