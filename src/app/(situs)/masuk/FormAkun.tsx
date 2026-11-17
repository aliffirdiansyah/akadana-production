"use client";
// Form masuk dan daftar (port Views/Akun/Masuk.cshtml dan Daftar.cshtml) dengan Supabase Auth.
// Session disimpan di cookie oleh @supabase/ssr, jadi server langsung mengenali pengguna setelah ini.
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { supabaseBrowser } from "@/lib/supabase/browser";
import { tujuanAman } from "@/lib/tujuan";

// Pesan Supabase Auth (Inggris) -> pesan Indonesia
function pesanAuth(pesan: string): string {
  const p = pesan.toLowerCase();
  if (p.includes("invalid login")) return "Email atau password salah.";
  if (p.includes("email not confirmed")) return "Email belum dikonfirmasi. Buka link konfirmasi yang kami kirim ke email Anda.";
  if (p.includes("already registered") || p.includes("already been registered")) return "Email sudah terdaftar. Silakan masuk.";
  if (p.includes("password should be") || p.includes("weak password")) return "Password minimal 8 karakter.";
  if (p.includes("rate limit")) return "Terlalu banyak percobaan. Tunggu sebentar, lalu coba lagi.";
  if (p.includes("fetch")) return "Tidak bisa terhubung. Periksa koneksi, lalu coba lagi.";
  return "Terjadi kesalahan. Silakan coba lagi.";
}

export function FormAkun({ mode, returnUrl }: { mode: "masuk" | "daftar"; returnUrl?: string }) {
  const router = useRouter();
  const [pesan, setPesan] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [sibuk, setSibuk] = useState(false);
  const tujuan = tujuanAman(returnUrl);

  async function kirim(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    const email = String(f.get("Email") ?? "").trim();
    const password = String(f.get("Password") ?? "");
    setPesan(null);

    if (mode === "daftar") {
      const nama = String(f.get("Nama") ?? "").replace(/\s+/g, " ").trim();
      if (!nama) return setPesan("Nama harus diisi.");
      if (password.length < 8) return setPesan("Password minimal 8 karakter.");
      if (password !== f.get("UlangiPassword")) return setPesan("Ulangi password tidak sama.");
      setSibuk(true);
      const { data, error } = await supabaseBrowser().auth.signUp({
        email, password,
        options: { data: { nama: nama.slice(0, 100) }, emailRedirectTo: `${location.origin}/auth/confirm?next=${encodeURIComponent(tujuan)}` },
      });
      setSibuk(false);
      if (error) return setPesan(pesanAuth(error.message));
      // Konfirmasi email aktif di Supabase: belum ada session sampai link di email dibuka
      if (!data.session) return setInfo("Akun dibuat. Buka link konfirmasi yang kami kirim ke email Anda untuk masuk.");
    } else {
      setSibuk(true);
      const { error } = await supabaseBrowser().auth.signInWithPassword({ email, password });
      setSibuk(false);
      if (error) return setPesan(pesanAuth(error.message));
    }
    router.replace(tujuan);
    router.refresh();
  }

  const alih = returnUrl ? `?returnUrl=${encodeURIComponent(returnUrl)}` : "";

  return (
    <main className="wrap akun-masuk">
      <div className="card akun-kartu">
        <h1>{mode === "masuk" ? "Selamat datang" : "Buat akun"}</h1>
        <p className="akun-hint">{mode === "masuk"
          ? "Masuk ke akun Inviora untuk membuat undangan digital."
          : "Daftar untuk memakai semua template dan melihat undangan Anda di satu tempat."}</p>
        {pesan && <p className="empty" role="alert">{pesan}</p>}
        {info ? (
          <p className="notice" role="status">{info}</p>
        ) : (
          <form onSubmit={kirim} noValidate>
            {mode === "daftar" && (
              <div className="field">
                <label className="lbl" htmlFor="Nama">Nama</label>
                <input id="Nama" name="Nama" autoComplete="name" maxLength={100} required />
              </div>
            )}
            <div className="field">
              <label className="lbl" htmlFor="Email">Email</label>
              <input type="email" id="Email" name="Email" autoComplete={mode === "masuk" ? "username" : "email"} maxLength={254} required />
            </div>
            <div className="field">
              <label className="lbl" htmlFor="Password">Password</label>
              <input type="password" id="Password" name="Password" autoComplete={mode === "masuk" ? "current-password" : "new-password"} minLength={mode === "daftar" ? 8 : undefined} required />
            </div>
            {mode === "daftar" && (
              <div className="field">
                <label className="lbl" htmlFor="UlangiPassword">Ulangi password</label>
                <input type="password" id="UlangiPassword" name="UlangiPassword" autoComplete="new-password" required />
              </div>
            )}
            <button type="submit" className="btn" disabled={sibuk}>{sibuk ? "Memproses..." : mode === "masuk" ? "Masuk" : "Daftar"}</button>
          </form>
        )}
        <p className="akun-alih">
          {mode === "masuk"
            ? <>Belum punya akun? <Link href={`/daftar${alih}`}>Daftar</Link></>
            : <>Sudah punya akun? <Link href={`/masuk${alih}`}>Masuk</Link></>}
        </p>
      </div>
    </main>
  );
}
