// Isi undangan (kolom jsonb t_undangan.dokumen / m_template.dokumen_awal). Urutan section = urutan tampil.
// Setiap pasangan tipe + varian wajib punya komponen di src/components/undangan/section.
import { ErrorBisnis } from "./konstanta";

export const VERSI_TERBARU = 1;

export interface IsiSampul {
  label: string;
  nama1: string;
  nama2: string;
  teksKepada: string;
  tamuDefault: string;
  tombolBuka: string;
}

export interface IsiPembuka {
  label: string;
  teks: string;
  terjemah?: string | null;
}

export interface DataOrang {
  label: string;
  namaPanggilan: string;
  namaLengkap: string;
  keterangan?: string | null;
  foto?: string | null;
}

export interface IsiMempelai {
  orang: DataOrang[];
}

export interface IsiHitungMundur {
  label: string;
  judul: string;
  // ISO 8601 dengan offset zona acara
  mulai: string;
  selesai?: string | null;
  lokasiKalender?: string | null;
}

export interface ItemAcara {
  nama: string;
  waktu: string;
  tempat?: string | null;
  utama: boolean;
}

export interface InfoLokasi {
  label?: string | null;
  nama: string;
  alamat?: string | null;
  urlPeta?: string | null;
}

export interface IsiAcara {
  label: string;
  judul: string;
  daftar: ItemAcara[];
  lokasi?: InfoLokasi | null;
}

export interface IsiGaleri {
  label: string;
  judul: string;
  foto: string[];
}

export interface IsiRsvp {
  label: string;
  judul: string;
  catatan?: string | null;
  // Hari terakhir RSVP diterima (tanggal WIB yyyy-MM-dd, inklusif)
  batasTanggal?: string | null;
  maksTamu: number;
}

export interface IsiUcapan {
  label: string;
  judul: string;
}

export interface DataRekening {
  bank: string;
  nomor: string;
  atasNama: string;
}

export interface IsiAmplop {
  label: string;
  judul: string;
  catatan?: string | null;
  rekening: DataRekening[];
}

export interface IsiPenutup {
  teks: string;
  terjemah?: string | null;
  label: string;
  nama: string;
  keluarga?: string | null;
  // Nomor WhatsApp kontak (62xxxxxxxxx), tombol wa.me di penutup. Kosong di dokumen contoh template.
  telepon?: string | null;
}

export interface PetaIsi {
  sampul: IsiSampul;
  pembuka: IsiPembuka;
  mempelai: IsiMempelai;
  "hitung-mundur": IsiHitungMundur;
  acara: IsiAcara;
  galeri: IsiGaleri;
  rsvp: IsiRsvp;
  ucapan: IsiUcapan;
  amplop: IsiAmplop;
  penutup: IsiPenutup;
}

export type TipeSection = keyof PetaIsi;

export type SectionUndangan = {
  [K in TipeSection]: { id: string; tipe: K; varian: string; tampil: boolean; isi: PetaIsi[K] };
}[TipeSection];

export interface DokumenUndangan {
  versi: number;
  meta: { judul: string; deskripsi?: string | null };
  section: SectionUndangan[];
}

export const INFO_SECTION: Record<TipeSection, { nama: string; varian: string[] }> = {
  sampul: { nama: "Sampul", varian: ["gunungan-tengah", "hias"] },
  pembuka: { nama: "Pembuka", varian: ["basa-krama", "hias"] },
  mempelai: { nama: "Mempelai", varian: ["tumpuk"] },
  "hitung-mundur": { nama: "Hitung mundur", varian: ["standar", "ringkas"] },
  acara: { nama: "Susunan acara", varian: ["lini-masa"] },
  galeri: { nama: "Galeri", varian: ["grid"] },
  rsvp: { nama: "RSVP", varian: ["standar"] },
  ucapan: { nama: "Ucapan", varian: ["standar"] },
  amplop: { nama: "Amplop digital", varian: ["kartu"] },
  penutup: { nama: "Penutup", varian: ["gunungan", "hias"] },
};

// Foto hanya boleh path lokal hasil unggah (mis. /foto/sekar-bimo-k3x9/ab12....jpg), bukan URL luar
const PATH_LOKAL = /^\/[A-Za-z0-9/_.-]+$/;
export const FORMAT_TELEPON = /^628\d{7,12}$/;

function validasiFoto(path: string | null | undefined, namaField: string) {
  if (!path) return;
  if (!PATH_LOKAL.test(path) || path.includes("..")) throw new ErrorBisnis(`${namaField} tidak valid`);
}

function validasiUrlHttps(url: string | null | undefined, namaField: string) {
  if (!url) return;
  let ok = false;
  try {
    ok = new URL(url).protocol === "https:";
  } catch {
    ok = false;
  }
  if (!ok) throw new ErrorBisnis(`${namaField} harus berupa alamat https://`);
}

const teks = (v: unknown) => (typeof v === "string" ? v : "");
const opsional = (v: unknown) => (typeof v === "string" ? v : null);
const objek = (v: unknown): Record<string, unknown> | null => (v && typeof v === "object" && !Array.isArray(v) ? (v as Record<string, unknown>) : null);
const daftar = (v: unknown): unknown[] => (Array.isArray(v) ? v : []);

// Isi section dibaca seperti deserialisasi bertipe: field tidak dikenal dibuang, field hilang diberi nilai bawaan
const BACA_ISI: { [K in TipeSection]: (o: Record<string, unknown>) => PetaIsi[K] } = {
  sampul: o => ({
    label: teks(o.label), nama1: teks(o.nama1), nama2: teks(o.nama2), teksKepada: teks(o.teksKepada),
    tamuDefault: teks(o.tamuDefault), tombolBuka: typeof o.tombolBuka === "string" ? o.tombolBuka : "Buka Undangan",
  }),
  pembuka: o => ({ label: teks(o.label), teks: teks(o.teks), terjemah: opsional(o.terjemah) }),
  mempelai: o => {
    const orang = daftar(o.orang).map(x => objek(x) ?? {}).map(p => ({
      label: teks(p.label), namaPanggilan: teks(p.namaPanggilan), namaLengkap: teks(p.namaLengkap),
      keterangan: opsional(p.keterangan), foto: opsional(p.foto),
    }));
    if (orang.length < 1 || orang.length > 2) throw new ErrorBisnis("Section mempelai berisi 1 atau 2 orang");
    orang.forEach(p => validasiFoto(p.foto, "Foto mempelai"));
    return { orang };
  },
  "hitung-mundur": o => {
    const mulai = teks(o.mulai), selesai = opsional(o.selesai);
    if (Number.isNaN(Date.parse(mulai))) throw new ErrorBisnis("Waktu mulai tidak valid");
    if (selesai != null && (Number.isNaN(Date.parse(selesai)) || Date.parse(selesai) < Date.parse(mulai)))
      throw new ErrorBisnis("Waktu selesai tidak boleh sebelum waktu mulai");
    return { label: teks(o.label), judul: teks(o.judul), mulai, selesai, lokasiKalender: opsional(o.lokasiKalender) };
  },
  acara: o => {
    const lok = objek(o.lokasi);
    const lokasi = lok ? { label: opsional(lok.label), nama: teks(lok.nama), alamat: opsional(lok.alamat), urlPeta: opsional(lok.urlPeta) } : null;
    validasiUrlHttps(lokasi?.urlPeta, "Link peta");
    return {
      label: teks(o.label), judul: teks(o.judul), lokasi,
      daftar: daftar(o.daftar).map(x => objek(x) ?? {}).map(i => ({ nama: teks(i.nama), waktu: teks(i.waktu), tempat: opsional(i.tempat), utama: i.utama === true })),
    };
  },
  galeri: o => {
    const foto = daftar(o.foto).filter((x): x is string => typeof x === "string");
    if (foto.length > 30) throw new ErrorBisnis("Galeri maksimal 30 foto");
    foto.forEach(f => validasiFoto(f, "Foto galeri"));
    return { label: teks(o.label), judul: teks(o.judul), foto };
  },
  rsvp: o => {
    const maksTamu = typeof o.maksTamu === "number" ? o.maksTamu : 2;
    if (!Number.isInteger(maksTamu) || maksTamu < 1 || maksTamu > 10) throw new ErrorBisnis("Maksimal tamu per RSVP antara 1 dan 10");
    const batas = opsional(o.batasTanggal);
    return { label: teks(o.label), judul: teks(o.judul), catatan: opsional(o.catatan), batasTanggal: batas ? batas.slice(0, 10) : null, maksTamu };
  },
  ucapan: o => ({ label: teks(o.label), judul: teks(o.judul) }),
  amplop: o => {
    const rekening = daftar(o.rekening).map(x => objek(x) ?? {}).map(r => ({ bank: teks(r.bank), nomor: teks(r.nomor), atasNama: teks(r.atasNama) }));
    if (rekening.length > 5) throw new ErrorBisnis("Amplop digital maksimal 5 rekening");
    return { label: teks(o.label), judul: teks(o.judul), catatan: opsional(o.catatan), rekening };
  },
  penutup: o => {
    const telepon = opsional(o.telepon);
    if (telepon && !FORMAT_TELEPON.test(telepon)) throw new ErrorBisnis("Nomor WhatsApp tidak valid");
    return { teks: teks(o.teks), terjemah: opsional(o.terjemah), label: teks(o.label), nama: teks(o.nama), keluarga: opsional(o.keluarga), telepon };
  },
};

// Baca dan validasi dokumen (string JSON atau objek dari jsonb). Tipe/varian tidak dikenal dan isi tidak valid ditolak.
export function parseDokumen(sumber: unknown): DokumenUndangan {
  let data: unknown = sumber;
  if (typeof sumber === "string") {
    try {
      data = JSON.parse(sumber);
    } catch {
      throw new ErrorBisnis("Dokumen undangan tidak valid");
    }
  }
  const d = objek(data);
  if (!d || d.versi !== VERSI_TERBARU) throw new ErrorBisnis("Versi dokumen undangan tidak dikenal");
  const meta = objek(d.meta) ?? {};
  const judul = teks(meta.judul);
  if (!judul.trim()) throw new ErrorBisnis("Judul undangan harus diisi");

  const id = new Set<string>();
  const section = daftar(d.section).map(x => {
    const s = objek(x) ?? {};
    const sid = teks(s.id);
    if (!sid.trim() || id.has(sid)) throw new ErrorBisnis("Id section kosong atau ganda");
    id.add(sid);
    const tipe = teks(s.tipe) as TipeSection;
    const info = INFO_SECTION[tipe];
    if (!info) throw new ErrorBisnis(`Tipe section "${tipe}" tidak dikenal`);
    const varian = teks(s.varian);
    if (!info.varian.includes(varian)) throw new ErrorBisnis(`Varian "${varian}" tidak tersedia untuk section ${info.nama}`);
    const isiObj = objek(s.isi);
    if (!isiObj) throw new ErrorBisnis(`Isi section ${info.nama} tidak valid`);
    const isi = BACA_ISI[tipe](isiObj);
    return { id: sid, tipe, varian, tampil: s.tampil === true, isi } as SectionUndangan;
  });

  return { versi: VERSI_TERBARU, meta: { judul, deskripsi: opsional(meta.deskripsi) }, section };
}

export function cariSection<K extends TipeSection>(dokumen: DokumenUndangan, tipe: K): Extract<SectionUndangan, { tipe: K }> | undefined {
  return dokumen.section.find(s => s.tampil && s.tipe === tipe) as Extract<SectionUndangan, { tipe: K }> | undefined;
}

export function isiPertama<K extends TipeSection>(dokumen: DokumenUndangan, tipe: K): PetaIsi[K] | undefined {
  return dokumen.section.find(s => s.tipe === tipe)?.isi as PetaIsi[K] | undefined;
}
