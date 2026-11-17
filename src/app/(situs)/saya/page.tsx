// Dasbor pengguna (/saya): undangan yang dibuat saat login. Tampilan di TampilanSaya.tsx.
import type { Metadata } from "next";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { getMilik } from "@/lib/undangan/data";
import { getPengguna } from "@/lib/supabase/server";
import { hariIni } from "@/lib/waktu";
import { TampilanSaya } from "./TampilanSaya";

export const metadata: Metadata = { title: "Undangan Saya | Akadana" };

export default async function Saya() {
  const pengguna = await getPengguna();
  if (!pengguna) redirect("/masuk?returnUrl=%2Fsaya");
  const daftar = await getMilik(pengguna);
  const h = await headers();
  const asal = `${h.get("x-forwarded-proto") ?? "https"}://${h.get("x-forwarded-host") ?? h.get("host")}`;
  return <TampilanSaya nama={pengguna.nama} daftar={daftar} hari={hariIni()} asal={asal} />;
}
