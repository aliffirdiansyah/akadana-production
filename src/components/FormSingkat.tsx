"use client";
// Form data utama di beranda: 6 kolom yang langsung menjadi draf editor (lib/undangan/singkat.ts), jadi pengguna tidak
// mengetik ulang di /buat. Bila draf sudah ada, form diganti tombol lanjutkan.
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useSyncExternalStore } from "react";
import { bacaDraf, hapusDraf, langgananDraf, simpanDraf, teksDraf } from "@/lib/draf";
import { tanya } from "@/lib/konfirmasi";
import { drafDariSingkat, periksaSingkat, saringTelepon, type IsianSingkat } from "@/lib/undangan/singkat";
import { namaDraf } from "@/lib/undangan/susun";

const KOSONG: IsianSingkat = { pria: "", wanita: "", telepon: "", tanggal: "", jam: "", lokasi: "" };

export function FormSingkat({ kodeTemplate, hariIni }: { kodeTemplate: string; hariIni: string }) {
  const router = useRouter();
  const teks = useSyncExternalStore(langgananDraf, teksDraf, () => "");
  const nama = teks ? namaDraf(bacaDraf()) : null;
  const [isi, setIsi] = useState<IsianSingkat>(KOSONG);
  const [salah, setSalah] = useState<{ kolom: keyof IsianSingkat; pesan: string } | null>(null);
  const [sibuk, setSibuk] = useState(false);
  const tujuan = `/buat/${kodeTemplate}`;

  const ubah = (kolom: keyof IsianSingkat) => (e: React.ChangeEvent<HTMLInputElement>) => {
    const nilai = kolom === "telepon" ? saringTelepon(e.target.value) : e.target.value;
    setIsi(x => ({ ...x, [kolom]: nilai }));
    if (salah?.kolom === kolom) setSalah(null);
  };

  function kirim(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const s = periksaSingkat(isi);
    if (s) {
      setSalah(s);
      document.getElementById(`beranda-${s.kolom}`)?.focus();
      return;
    }
    if (!simpanDraf(drafDariSingkat(isi))) {
      setSalah({ kolom: "pria", pesan: "Isian tidak bisa disimpan di perangkat ini (mode privat atau penyimpanan penuh)." });
      return;
    }
    setSibuk(true);
    router.push(tujuan);
  }

  async function mulaiBaru() {
    if (!await tanya({ judul: "Mulai undangan baru?", teks: "Isian yang tersimpan di perangkat ini dihapus dan tidak bisa dikembalikan.", tombol: "Ya, mulai baru", bahaya: true })) return;
    hapusDraf();
  }

  if (nama) {
    return (
      <div className="card beranda-form" aria-labelledby="judulLanjut">
        <p className="beranda-form-label">Isian tersimpan di perangkat ini</p>
        <h2 id="judulLanjut" className="beranda-form-judul">Undangan {nama.wanita} &amp; {nama.pria}</h2>
        <p className="footnote">Lanjutkan dari editor: semua yang sudah diisi tetap ada, kecuali foto.</p>
        <div className="beranda-form-aksi">
          <Link className="btn" href={tujuan}>Lanjutkan mengisi</Link>
          <button type="button" className="btn-ghost" onClick={mulaiBaru}>Mulai undangan baru</button>
        </div>
      </div>
    );
  }

  const kolom = (k: keyof IsianSingkat, label: string, props: React.InputHTMLAttributes<HTMLInputElement>, penuh = false) => (
    <div className={penuh ? "field full" : "field"}>
      <label className="lbl" htmlFor={`beranda-${k}`}>{label}</label>
      <input id={`beranda-${k}`} value={isi[k]} onChange={ubah(k)} aria-invalid={salah?.kolom === k || undefined} required {...props} />
    </div>
  );

  return (
    <form className="card beranda-form" onSubmit={kirim} noValidate aria-labelledby="judulDataUtama">
      <p className="beranda-form-label">Mulai di sini, gratis</p>
      <h2 id="judulDataUtama" className="beranda-form-judul">Data utama undangan</h2>
      <div className="fields">
        {kolom("pria", "Nama mempelai pria", { type: "text", maxLength: 40, autoComplete: "off", placeholder: "Nama panggilan" })}
        {kolom("wanita", "Nama mempelai wanita", { type: "text", maxLength: 40, autoComplete: "off", placeholder: "Nama panggilan" })}
        {kolom("telepon", "Nomor WhatsApp", { type: "tel", inputMode: "tel", maxLength: 20, autoComplete: "tel", placeholder: "Contoh: 081234567890" }, true)}
        {kolom("tanggal", "Tanggal acara", { type: "date", min: hariIni })}
        {kolom("jam", "Jam acara", { type: "time" })}
        {kolom("lokasi", "Lokasi acara", { type: "text", maxLength: 150, placeholder: "Contoh: Pendapa Griya Laras" }, true)}
      </div>
      {salah && <p className="notice" role="alert">{salah.pesan}</p>}
      <button className="btn beranda-form-kirim" type="submit" disabled={sibuk}>{sibuk ? "Membuka editor..." : "Buat undangan"}</button>
      <p className="footnote">Isian tersimpan otomatis di perangkat ini. Lengkapi detail lain dan pilih template sambil melihat pratinjaunya.</p>
    </form>
  );
}
