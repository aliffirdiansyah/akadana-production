// Memperbarui session Supabase Auth di setiap navigasi, supaya Server Component membaca token yang masih berlaku.
import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export async function proxy(request: NextRequest) {
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
