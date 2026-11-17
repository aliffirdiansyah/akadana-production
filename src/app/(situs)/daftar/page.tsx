// Tidak ada pendaftaran terpisah: akun dibuat otomatis saat pertama masuk dengan Google. Alamat lama diarahkan ke /masuk.
import { redirect } from "next/navigation";

export default async function Daftar({ searchParams }: { searchParams: Promise<{ returnUrl?: string }> }) {
  const { returnUrl } = await searchParams;
  redirect(returnUrl ? `/masuk?returnUrl=${encodeURIComponent(returnUrl)}` : "/masuk");
}
