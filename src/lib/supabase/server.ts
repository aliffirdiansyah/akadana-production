import "server-only";
// Client Supabase dengan session pengguna dari cookie. Hanya untuk Auth (siapa yang login);
// tabel diakses lewat supabaseAdmin karena RLS menutup semua akses anon/authenticated.
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { SUPABASE_ANON_KEY, SUPABASE_URL } from "./env";

export async function supabaseServer() {
  const cookieStore = await cookies();
  return createServerClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    cookies: {
      getAll: () => cookieStore.getAll(),
      setAll: daftar => {
        try {
          daftar.forEach(({ name, value, options }) => cookieStore.set(name, value, options));
        } catch {
          // dipanggil dari Server Component: cookie diperbarui oleh proxy.ts
        }
      },
    },
  });
}

export interface Pengguna {
  id: string;
  email: string;
  nama: string;
}

// Pengguna yang login, diverifikasi ke server Auth (bukan sekadar membaca cookie). null bila belum login.
export async function getPengguna(): Promise<Pengguna | null> {
  if (!SUPABASE_URL) return null;
  const supabase = await supabaseServer();
  const { data } = await supabase.auth.getUser();
  const user = data.user;
  if (!user) return null;
  const email = user.email ?? "";
  // Google mengisi full_name / name di user_metadata
  const meta = user.user_metadata ?? {};
  const nama = [meta.full_name, meta.name].find((x): x is string => typeof x === "string" && x.trim().length > 0)?.trim() ?? email.split("@")[0];
  return { id: user.id, email, nama };
}

// Dua huruf pertama dari nama, untuk avatar
export function inisial(nama: string): string {
  const hasil = nama.split(/\s+/).filter(Boolean).slice(0, 2).map(x => x[0].toUpperCase()).join("");
  return hasil || "?";
}
