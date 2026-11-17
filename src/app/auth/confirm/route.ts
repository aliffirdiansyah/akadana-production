// Link konfirmasi email dari Supabase Auth: ?token_hash=&type=&next=. Session dipasang lalu diarahkan ke next (URL lokal saja).
// Template email Supabase perlu mengarah ke {{ .SiteURL }}/auth/confirm?token_hash={{ .TokenHash }}&type=email&next={{ .RedirectTo }}
// atau memakai redirect bawaan (emailRedirectTo) yang sudah berisi /auth/confirm.
import type { EmailOtpType } from "@supabase/supabase-js";
import { NextResponse, type NextRequest } from "next/server";
import { supabaseServer } from "@/lib/supabase/server";

function lokal(next: string | null): string {
  if (!next) return "/";
  try {
    // next bisa URL lengkap (emailRedirectTo) atau path
    const url = new URL(next, "http://x");
    const path = url.pathname + url.search;
    return url.pathname.startsWith("/auth/") || path.startsWith("//") ? "/" : path;
  } catch {
    return "/";
  }
}

export async function GET(req: NextRequest) {
  const q = req.nextUrl.searchParams;
  const tokenHash = q.get("token_hash"), type = q.get("type") as EmailOtpType | null, code = q.get("code");
  const supabase = await supabaseServer();
  let ok = false;
  if (tokenHash && type) ok = !(await supabase.auth.verifyOtp({ type, token_hash: tokenHash })).error;
  else if (code) ok = !(await supabase.auth.exchangeCodeForSession(code)).error;
  return NextResponse.redirect(new URL(ok ? lokal(q.get("next")) : "/masuk?gagal=konfirmasi", req.nextUrl.origin));
}
