// Daftar tamu undangan /tamu/{slug}: tambah nama + nomor WA, kirim undangan pribadi (link ?t=kode dengan QR unik) lewat WhatsApp.
// Pemilik yang login langsung masuk; selain itu lewat link kelola tamu (#kode=..., dibaca di browser oleh KelolaTamu).
import type { Metadata } from "next";
import { getPengguna } from "@/lib/supabase/server";
import { KelolaTamu } from "./KelolaTamu";

export const metadata: Metadata = { title: "Tamu Undangan | Akadana", robots: { index: false, follow: false } };

export default async function HalamanTamu({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const pengguna = await getPengguna();
  return <KelolaTamu slug={slug} sudahMasuk={pengguna != null} />;
}
