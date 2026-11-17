import "server-only";
// Client service role: melewati RLS. Hanya dipakai kode server di src/lib/undangan/data.ts.
import { createClient, SupabaseClient } from "@supabase/supabase-js";
import { SUPABASE_URL } from "./env";

let klien: SupabaseClient | null = null;

export function supabaseAdmin(): SupabaseClient {
  if (klien) return klien;
  const kunci = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!SUPABASE_URL || !kunci) throw new Error("NEXT_PUBLIC_SUPABASE_URL dan SUPABASE_SERVICE_ROLE_KEY belum diisi");
  klien = createClient(SUPABASE_URL, kunci, { auth: { persistSession: false, autoRefreshToken: false } });
  return klien;
}
