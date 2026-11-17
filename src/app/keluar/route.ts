// POST /keluar: akhiri session lalu kembali ke beranda
import { NextResponse, type NextRequest } from "next/server";
import { asalSah } from "@/lib/api";
import { supabaseServer } from "@/lib/supabase/server";

export async function POST(req: NextRequest) {
  if (asalSah(req)) await (await supabaseServer()).auth.signOut();
  return NextResponse.redirect(new URL("/", req.nextUrl.origin), 303);
}
