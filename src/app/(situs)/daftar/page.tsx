import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getPengguna } from "@/lib/supabase/server";
import { tujuanAman } from "@/lib/tujuan";
import { FormAkun } from "../masuk/FormAkun";

export const metadata: Metadata = { title: "Daftar | Inviora", description: "Buat akun Inviora untuk memakai semua template undangan." };

export default async function Daftar({ searchParams }: { searchParams: Promise<{ returnUrl?: string }> }) {
  const { returnUrl } = await searchParams;
  if (await getPengguna()) redirect(tujuanAman(returnUrl));
  return <FormAkun mode="daftar" returnUrl={returnUrl} />;
}
