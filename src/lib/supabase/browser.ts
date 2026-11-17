"use client";
// Client Supabase di browser: masuk dengan Google (session disimpan di cookie oleh @supabase/ssr) dan unggah foto lewat signed URL.
import { createBrowserClient } from "@supabase/ssr";
import { SUPABASE_ANON_KEY, SUPABASE_URL } from "./env";

export function supabaseBrowser() {
  return createBrowserClient(SUPABASE_URL, SUPABASE_ANON_KEY);
}
