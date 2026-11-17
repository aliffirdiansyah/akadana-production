import "server-only";
// Pembungkus route handler JSON (pengganti BaseController.TryJson versi .NET): error bisnis jadi pesan,
// selain itu dicatat dan diganti pesan umum. Respons ResponseBase PascalCase.
import { NextResponse, type NextRequest } from "next/server";
import { ErrorBisnis, ErrorTidakAda } from "./undangan/konstanta";
import { STATUS_GAGAL, STATUS_SUKSES, type ResponseBase } from "./undangan/tipe";

export const sukses = <T,>(Message: string, Data?: T) => NextResponse.json<ResponseBase<T>>({ Status: STATUS_SUKSES, Message, Data });
export const gagal = (Message: string, status = 200) => NextResponse.json<ResponseBase>({ Status: STATUS_GAGAL, Message }, { status });

// POST hanya dari halaman situs ini (pengganti antiforgery token): Origin wajib sama dengan host permintaan
export function asalSah(req: NextRequest): boolean {
  const origin = req.headers.get("origin");
  if (!origin) return false;
  const host = req.headers.get("x-forwarded-host") ?? req.headers.get("host");
  try {
    return new URL(origin).host === host;
  } catch {
    return false;
  }
}

export async function tryJson(req: NextRequest, aksi: () => Promise<NextResponse>): Promise<NextResponse> {
  if (req.method !== "GET" && !asalSah(req)) return gagal("Permintaan ditolak.", 403);
  try {
    return await aksi();
  } catch (e) {
    if (e instanceof ErrorBisnis || e instanceof ErrorTidakAda) return gagal(e.message);
    console.error(`Error ${req.nextUrl.pathname}`, e);
    return gagal("Terjadi kesalahan pada server. Silakan coba lagi.");
  }
}

// Body JSON, null bila bukan JSON yang valid
export async function bacaJson<T>(req: NextRequest): Promise<T | null> {
  try {
    return (await req.json()) as T;
  } catch {
    return null;
  }
}
