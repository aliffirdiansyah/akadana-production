// Dasbor pengguna: undangan yang dibuat saat login, dengan ringkasan RSVP dan ucapan.
import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getMilik } from "@/lib/undangan/data";
import { getPengguna } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Undangan Saya | Inviora" };

const tanggal = (iso: string) =>
  new Intl.DateTimeFormat("id-ID", { timeZone: "Asia/Jakarta", day: "numeric", month: "long", year: "numeric" }).format(new Date(iso));

export default async function Saya() {
  const pengguna = await getPengguna();
  if (!pengguna) redirect("/masuk?returnUrl=%2Fsaya");
  const daftar = await getMilik(pengguna);

  return (
    <main className="wrap">
      <header className="top">
        <div>
          <h1 className="brand">Undangan saya</h1>
          <p className="tagline">Undangan yang Anda buat saat masuk sebagai {pengguna.nama}.</p>
        </div>
      </header>

      {daftar.length === 0 ? (
        <div className="card saya-kosong">
          <p>Belum ada undangan. Pilih template untuk membuat yang pertama.</p>
          <Link className="btn" href="/#template">Pilih template</Link>
        </div>
      ) : (
        <ul className="saya-daftar">
          {daftar.map(u => (
            <li key={u.slug} className="card saya-kartu">
              <div className="saya-kepala">
                <h2>{u.judul}</h2>
                <span className={u.terbit ? "tpl-status tpl-terbuka" : "tpl-status tpl-kunci"}>{u.terbit ? "Terbit" : "Foto belum terunggah"}</span>
              </div>
              {u.deskripsi && <p className="saya-ket">{u.deskripsi}</p>}
              <p className="footnote">{u.templateNama} · dibuat {tanggal(u.insDate)}</p>
              <dl className="saya-angka">
                <div><dt>Konfirmasi</dt><dd>{u.jumlahRsvp}</dd></div>
                <div><dt>Tamu hadir</dt><dd>{u.jumlahHadir}</dd></div>
                <div><dt>Ucapan</dt><dd>{u.jumlahUcapan}</dd></div>
              </dl>
              {u.terbit && (
                <div className="buat-aksi">
                  <a className="btn" href={`/u/${u.slug}`} target="_blank" rel="noopener">Buka undangan</a>
                </div>
              )}
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
