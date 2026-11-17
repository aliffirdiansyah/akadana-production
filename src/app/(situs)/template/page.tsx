// Daftar template (/template): dibuka dari tombol "Ganti template" di editor dan menu navbar.
import type { Metadata } from "next";
import { DaftarTemplate } from "@/components/DaftarTemplate";
import { getTemplateList } from "@/lib/undangan/data";
import { getPengguna } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Pilih Template | Akadana" };
export const dynamic = "force-dynamic";

export default async function HalamanTemplate() {
  const [daftar, pengguna] = await Promise.all([getTemplateList(), getPengguna()]);
  return (
    <main className="wrap" id="template">
      <header className="top">
        <div>
          <h1 className="brand">Pilih template</h1>
          <p className="tagline">Lihat pratinjau tiap template. Isian yang sudah diisi ikut terbawa saat ganti template.</p>
        </div>
      </header>
      <DaftarTemplate daftar={daftar} sudahLogin={pengguna != null} />
    </main>
  );
}
