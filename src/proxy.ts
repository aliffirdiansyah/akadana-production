// Memperbarui session Supabase Auth di setiap navigasi, supaya Server Component membaca token yang masih berlaku.
import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export async function proxy(request: NextRequest) {
  // Kode OAuth yang mendarat di halaman lain (Supabase jatuh ke Site URL bila redirect URL tidak diizinkan):
  // teruskan ke /auth/callback supaya ditukar jadi session, lalu kembali ke halaman itu.
  const { pathname, searchParams } = request.nextUrl;
  const code = searchParams.get("code");
  if (code && request.method === "GET" && !pathname.startsWith("/auth/") && !pathname.startsWith("/api/")) {
    const sisa = new URLSearchParams(searchParams);
    sisa.delete("code");
    const next = pathname + (sisa.size > 0 ? `?${sisa}` : "");
    const tujuan = new URL("/auth/callback", request.nextUrl.origin);
    tujuan.searchParams.set("code", code);
    tujuan.searchParams.set("next", next);
    return NextResponse.redirect(tujuan);
  }

  let response = NextResponse.next({ request });
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL, kunci = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !kunci) return response;

  const supabase = createServerClient(url, kunci, {
    cookies: {
      getAll: () => request.cookies.getAll(),
      setAll: daftar => {
        daftar.forEach(({ name, value }) => request.cookies.set(name, value));
        response = NextResponse.next({ request });
        daftar.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
      },
    },
  });
  await supabase.auth.getUser();
  return response;
}

export const config = {
  // Halaman undangan publik, foto, aset statis, service worker, dan manifest tidak butuh session
  matcher: ["/((?!_next/static|_next/image|u/|foto/|undangan/css|js/|img/|ikon/|sw.js|manifest.webmanifest|favicon.ico|offline).*)"],
};
