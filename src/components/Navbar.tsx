// Menu atas. Pengguna login melihat avatar inisial yang membuka laci profil (Laci.tsx).
import Link from "next/link";
import { getPengguna, inisial } from "@/lib/supabase/server";
import { Laci } from "./Laci";
import { Logo } from "./Logo";

export async function Navbar() {
  const pengguna = await getPengguna();
  return (
    <nav className="navbar" aria-label="Utama">
      <div className="wrap navbar-isi">
        <Link href="/" className="brand-link" aria-label="Inviora, ke beranda"><Logo /></Link>
        <ul className="navbar-menu">
          <li><Link href="/template">Template</Link></li>
          {pengguna && <li><Link href="/saya">Undangan saya</Link></li>}
        </ul>
        {pengguna
          ? <Laci nama={pengguna.nama} email={pengguna.email} inisial={inisial(pengguna.nama)} />
          : <Link className="navbar-masuk" href="/masuk">Masuk</Link>}
      </div>
    </nav>
  );
}
