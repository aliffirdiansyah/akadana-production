// Variabel lingkungan Supabase. NEXT_PUBLIC_* boleh sampai ke browser; service role hanya di server (admin.ts).
export const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
export const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";
