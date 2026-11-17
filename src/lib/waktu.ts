// Waktu bisnis: tanggal Asia/Jakarta, bukan zona mesin (server Vercel berjalan di UTC).

const ZONA_BISNIS = "Asia/Jakarta";

// Tanggal hari ini di Jakarta, format yyyy-MM-dd
export function hariIni(sekarang: Date = new Date()): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: ZONA_BISNIS, year: "numeric", month: "2-digit", day: "2-digit" }).format(sekarang);
}

const POLA_TANGGAL = /^(\d{4})-(\d{2})-(\d{2})$/;

// yyyy-MM-dd (boleh diikuti jam, mis. 2027-06-12T00:00:00) -> yyyy-MM-dd, atau null bila tidak valid
export function bacaTanggal(nilai: unknown): string | null {
  if (typeof nilai !== "string") return null;
  const teks = nilai.trim().slice(0, 10);
  const m = POLA_TANGGAL.exec(teks);
  if (!m) return null;
  const d = new Date(Date.UTC(+m[1], +m[2] - 1, +m[3]));
  return d.getUTCFullYear() === +m[1] && d.getUTCMonth() === +m[2] - 1 && d.getUTCDate() === +m[3] ? teks : null;
}

function keUtc(tanggal: string): Date {
  const [y, m, d] = tanggal.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d));
}

// Mis. Sabtu, 12 Juni 2027
export function teksTanggal(tanggal: string): string {
  return new Intl.DateTimeFormat("id-ID", { timeZone: "UTC", weekday: "long", day: "numeric", month: "long", year: "numeric" }).format(keUtc(tanggal));
}

// Mis. 5 Juni 2027
export function teksTanggalPendek(tanggal: string): string {
  return new Intl.DateTimeFormat("id-ID", { timeZone: "UTC", day: "numeric", month: "long", year: "numeric" }).format(keUtc(tanggal));
}

// Tanggal + jam (HH:mm) di zona offsetJam -> ISO 8601 dengan offset, mis. 2027-06-12T08:00:00+07:00
export function isoDenganOffset(tanggal: string, jam: string, offsetJam: number): string {
  const tanda = offsetJam >= 0 ? "+" : "-";
  return `${tanggal}T${jam}:00${tanda}${String(Math.abs(offsetJam)).padStart(2, "0")}:00`;
}

export function tambahHari(tanggal: string, hari: number): string {
  const d = keUtc(tanggal);
  d.setUTCDate(d.getUTCDate() + hari);
  return d.toISOString().slice(0, 10);
}

// Waktu ucapan relatif terhadap sekarang
export function waktuRelatif(waktu: Date, sekarang: Date = new Date()): string {
  const menit = (sekarang.getTime() - waktu.getTime()) / 60000;
  if (menit < 1) return "baru saja";
  if (menit < 60) return `${Math.floor(menit)} menit lalu`;
  if (menit < 1440) return `${Math.floor(menit / 60)} jam lalu`;
  if (menit < 43200) return `${Math.floor(menit / 1440)} hari lalu`;
  return new Intl.DateTimeFormat("id-ID", { timeZone: ZONA_BISNIS, day: "numeric", month: "short", year: "numeric" }).format(waktu);
}
