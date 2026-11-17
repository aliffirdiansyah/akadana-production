// Ditampilkan service worker (public/sw.js) saat halaman yang diminta belum tersimpan dan perangkat offline.
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Offline | Inviora" };
export const dynamic = "force-static";

export default function Offline() {
  return (
    <main className="wrap">
      <div className="card saya-kosong">
        <h1 className="brand">Sedang offline</h1>
        <p>Halaman ini belum tersimpan di perangkat. Sambungkan internet, lalu muat ulang.</p>
        <p className="footnote">Form pembuatan yang sudah pernah dibuka tetap bisa diisi tanpa internet; isian tersimpan sebagai draf.</p>
      </div>
    </main>
  );
}
