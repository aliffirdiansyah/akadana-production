// Kembali dari Google (Supabase Auth OAuth PKCE): ?code=&next=. Kode ditukar jadi session (cookie),
// lalu diarahkan ke next (URL lokal saja). Gagal -> /masuk?gagal=1.
// URL ini wajib terdaftar di Supabase > Authentication > URL Configuration > Redirect URLs.
import { NextResponse, type NextRequest } from "next/server";
import { supabaseServer } from "@/lib/supabase/server";
import { tujuanAman } from "@/lib/tujuan";

export async function GET(req: NextRequest) {
  const q = req.nextUrl.searchParams;
  const code = q.get("code");
  const next = tujuanAman(q.get("next"));
  let ok = false;
  if (code) ok = !(await (await supabaseServer()).auth.exchangeCodeForSession(code)).error;
  const tujuan = ok ? next : `/masuk?gagal=1${next !== "/" ? `&returnUrl=${encodeURIComponent(next)}` : ""}`;
  return NextResponse.redirect(new URL(tujuan, req.nextUrl.origin));
}
