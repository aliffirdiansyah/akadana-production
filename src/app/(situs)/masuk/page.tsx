import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getPengguna } from "@/lib/supabase/server";
import { tujuanAman } from "@/lib/tujuan";
import { FormAkun } from "./FormAkun";

export const metadata: Metadata = { title: "Masuk | Inviora", description: "Masuk dengan akun Google untuk membuat undangan digital." };

export default async function Masuk({ searchParams }: { searchParams: Promise<{ returnUrl?: string; gagal?: string }> }) {
  const { returnUrl, gagal } = await searchParams;
  if (await getPengguna()) redirect(tujuanAman(returnUrl));
  return <FormAkun returnUrl={returnUrl} gagal={gagal != null} />;
}
