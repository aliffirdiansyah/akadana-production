"use client";
// Sidebar profil di kanan (port Scripts/Akun/Laci.js). Esc dan klik di luar panel menutupnya.
import Link from "next/link";
import { useRef, useState } from "react";
import { tanya } from "@/lib/konfirmasi";

export function Laci({ nama, email, inisial }: { nama: string; email: string; inisial: string }) {
  const laci = useRef<HTMLDialogElement>(null);
  const tombol = useRef<HTMLButtonElement>(null);
  const [terbuka, setTerbuka] = useState(false);

  const tutup = () => laci.current?.close();

  async function keluar(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    // <dialog> modal menutupi SweetAlert, jadi ditutup selama bertanya
    tutup();
    if (await tanya({ judul: "Keluar dari akun?", tombol: "Ya, keluar" })) form.submit();
  }

  return (
    <>
      <button type="button" className="avatar navbar-avatar" ref={tombol} aria-haspopup="dialog" aria-expanded={terbuka}
        aria-controls="laciAkun" aria-label={`Profil ${nama}`} title={nama}
        onClick={() => { laci.current?.showModal(); setTerbuka(true); }}>{inisial}</button>
      <dialog className="laci" id="laciAkun" aria-labelledby="laciNama" ref={laci}
        onClose={() => { setTerbuka(false); tombol.current?.focus(); }}
        onClick={e => { if (e.target === laci.current) tutup(); }}>
        <div className="laci-isi">
          <div className="laci-atas">
            <span className="laci-judul">Akun saya</span>
            <button type="button" className="laci-tutup" onClick={tutup} aria-label="Tutup profil">
              <svg viewBox="0 0 16 16" width="16" height="16" aria-hidden="true" focusable="false"><path d="M3 3 13 13M13 3 3 13" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" /></svg>
            </button>
          </div>
          <div className="laci-profil">
            <span className="avatar laci-avatar" aria-hidden="true">{inisial}</span>
            <p className="laci-nama" id="laciNama">{nama}</p>
            <p className="laci-email">{email}</p>
          </div>
          <ul className="laci-menu">
            <li><Link href="/saya" onClick={tutup}>Undangan saya</Link></li>
            <li><Link href="/template" onClick={tutup}>Template undangan</Link></li>
          </ul>
          <form className="laci-keluar" action="/keluar" method="post" onSubmit={keluar}>
            <button type="submit" className="btn-ghost">Keluar</button>
          </form>
        </div>
      </dialog>
    </>
  );
}
