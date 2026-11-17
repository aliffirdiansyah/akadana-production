import "server-only";
// Akses database undangan (port Undangan.Services, Rsvp, Ucapan dari versi .NET). Semua aturan bisnis di sini,
// route handler dan page hanya memanggil fungsi ini.
import { createHash, randomBytes, randomInt } from "node:crypto";
import { supabaseAdmin } from "../supabase/admin";
import { SUPABASE_URL } from "../supabase/env";
import type { Pengguna } from "../supabase/server";
import { cariSection, DokumenUndangan, isiPertama, parseDokumen } from "./dokumen";
import {
  BUCKET_FOTO, ErrorBisnis, ErrorTidakAda, EStatusUndangan, JUMLAH_GALERI_MAKS, JUMLAH_TAMU_MAKS, JUMLAH_UCAPAN, MAKS_PESAN_UCAPAN, PATH_FOTO, PESAN,
} from "./konstanta";
import { bersihkanInput, bersihkanNama, NewRow, susunDokumen, TemplateKartu } from "./susun";
import { hariIni, waktuRelatif } from "../waktu";
import type { DaftarUcapan, FotoIsian, IsianUndangan, SpecFoto, UcapanItem } from "./tipe";

const FORMAT_SLUG = /^[a-z0-9]+(-[a-z0-9]+)*$/;
const HURUF_SLUG = "abcdefghijkmnpqrstuvwxyz23456789";

export interface UndanganTerbit {
  id: number;
  slug: string;
  templateKode: string;
  dokumen: DokumenUndangan;
}

export interface UndanganMilik {
  slug: string;
  judul: string;
  deskripsi: string | null;
  templateNama: string;
  templateKode: string;
  // Isi sampul, untuk gambar mini kartu dasbor
  label: string;
  nama1: string;
  nama2: string;
  // Waktu acara utama (ISO dengan offset) dari section hitung mundur; null bila belum bertanggal
  mulai: string | null;
  terbit: boolean;
  bisaDiubah: boolean;
  insDate: string;
  jumlahRsvp: number;
  jumlahHadir: number;
  jumlahUcapan: number;
}

function periksa<T>(hasil: { data: T; error: { message: string } | null }): T {
  if (hasil.error) throw new Error(hasil.error.message);
  return hasil.data;
}

// ---------- template ----------
interface BarisTemplate { kode: string; nama: string; dokumen_awal: unknown }

async function bacaTemplate(): Promise<BarisTemplate[]> {
  return periksa(await supabaseAdmin().from("m_template").select("kode, nama, dokumen_awal")
    .eq("aktif", true).order("urutan").order("kode")) as BarisTemplate[];
}

function keKartu(row: BarisTemplate, gratis: boolean): TemplateKartu {
  const sampul = isiPertama(parseDokumen(row.dokumen_awal), "sampul");
  return { kode: row.kode, nama: row.nama, gratis, contohLabel: sampul?.label ?? "", contohNama: sampul ? `${sampul.nama1} & ${sampul.nama2}` : "" };
}

// Urutan menentukan template gratis: yang pertama
export async function getTemplateList(): Promise<TemplateKartu[]> {
  return (await bacaTemplate()).map((x, i) => keKartu(x, i === 0));
}

// Template aktif beserta dokumen awalnya (isi contoh)
export async function getTemplate(kode: string): Promise<{ kartu: TemplateKartu; dokumen: DokumenUndangan }> {
  const daftar = await bacaTemplate();
  const i = daftar.findIndex(x => x.kode === kode);
  if (i < 0) throw new ErrorTidakAda(PESAN.TIDAK_DITEMUKAN("Template undangan"));
  return { kartu: keKartu(daftar[i], i === 0), dokumen: parseDokumen(daftar[i].dokumen_awal) };
}

// ---------- undangan publik ----------
// Untuk halaman publik: hanya undangan berstatus Terbit
export async function getTerbit(slug: string): Promise<UndanganTerbit> {
  const s = (slug ?? "").trim().toLowerCase();
  if (s.length > 60 || !FORMAT_SLUG.test(s)) throw new ErrorTidakAda(PESAN.TIDAK_DITEMUKAN("Undangan"));
  const row = periksa(await supabaseAdmin().from("t_undangan").select("id, slug, template_kode, dokumen")
    .eq("slug", s).eq("status", EStatusUndangan.Terbit).maybeSingle());
  if (!row) throw new ErrorTidakAda(PESAN.TIDAK_DITEMUKAN("Undangan"));
  return { id: row.id, slug: row.slug, templateKode: row.template_kode, dokumen: parseDokumen(row.dokumen) };
}

// Ucapan publik (tidak disembunyikan), terbaru dulu
export async function getUcapan(undangan: UndanganTerbit, mulai: number): Promise<DaftarUcapan> {
  const awal = Math.max(0, Math.floor(Number(mulai) || 0));
  const rows = periksa(await supabaseAdmin().from("t_ucapan").select("nama, pesan, ins_date")
    .eq("undangan_id", undangan.id).eq("disembunyikan", false)
    .order("ins_date", { ascending: false }).order("id", { ascending: false })
    .range(awal, awal + JUMLAH_UCAPAN)) as { nama: string; pesan: string; ins_date: string }[];
  const sekarang = new Date();
  return {
    Daftar: rows.slice(0, JUMLAH_UCAPAN).map(x => ({ Nama: x.nama, Pesan: x.pesan, Waktu: waktuRelatif(new Date(x.ins_date), sekarang) })),
    AdaLagi: rows.length > JUMLAH_UCAPAN,
  };
}

export async function kirimUcapan(slug: string, input: { Nama?: unknown; Pesan?: unknown } | null): Promise<UcapanItem> {
  if (!input) throw new ErrorBisnis(PESAN.DATA_INVALID);
  const undangan = await getTerbit(slug);
  if (!cariSection(undangan.dokumen, "ucapan")) throw new ErrorBisnis(PESAN.SECTION_TIDAK_ADA("Ucapan"));

  const nama = bersihkanNama(input.Nama);
  const pesan = (typeof input.Pesan === "string" ? input.Pesan : "").trim();
  if (pesan.length === 0) throw new ErrorBisnis(PESAN.WAJIB("Ucapan"));
  if (pesan.length > MAKS_PESAN_UCAPAN) throw new ErrorBisnis(`Ucapan maksimal ${MAKS_PESAN_UCAPAN} karakter`);

  periksa(await supabaseAdmin().from("t_ucapan").insert({ undangan_id: undangan.id, nama, pesan }));
  return { Nama: nama, Pesan: pesan, Waktu: "baru saja" };
}

export async function kirimRsvp(slug: string, input: { Nama?: unknown; Hadir?: unknown; Jumlah?: unknown } | null): Promise<void> {
  if (!input) throw new ErrorBisnis(PESAN.DATA_INVALID);
  const undangan = await getTerbit(slug);
  const isi = cariSection(undangan.dokumen, "rsvp")?.isi;
  if (!isi) throw new ErrorBisnis(PESAN.SECTION_TIDAK_ADA("RSVP"));
  if (isi.batasTanggal && hariIni() > isi.batasTanggal) throw new ErrorBisnis("Konfirmasi kehadiran sudah ditutup");

  const nama = bersihkanNama(input.Nama);
  const hadir = input.Hadir === true;
  let jumlah = 0;
  if (hadir) {
    jumlah = Number(input.Jumlah);
    if (!Number.isInteger(jumlah) || jumlah < 1 || jumlah > isi.maksTamu) throw new ErrorBisnis(`Jumlah tamu antara 1 dan ${isi.maksTamu}`);
  }
  periksa(await supabaseAdmin().from("t_rsvp").insert({ undangan_id: undangan.id, nama, hadir, jumlah }));
}

// ---------- pembuatan dan perubahan ----------
export interface Unggahan {
  // "wanita", "pria", atau "galeri-{n}" (n = urutan di galeri, mulai 1)
  nama: string;
  path: string;
  token: string;
}

export interface HasilSimpan {
  slug: string;
  // Hanya ada saat dibuat (dikembalikan sekali). DB menyimpan hash-nya saja.
  kodeEdit: string | null;
  unggah: Unggahan[];
}

const hashKode = (kode: string) => createHash("sha256").update(kode, "utf8").digest("hex");

// Nama depan wanita-pria + 4 huruf acak, mis. alif-putri-k3x9
function buatSlug(wanita: string, pria: string): string {
  const bagian = (nama: string) => nama.split(" ")[0].normalize("NFD").replace(/\p{Mn}/gu, "").toLowerCase().replace(/[^a-z0-9]/g, "").slice(0, 20);
  const akhiran = Array.from({ length: 4 }, () => HURUF_SLUG[randomInt(HURUF_SLUG.length)]).join("");
  const hasil = [bagian(wanita), bagian(pria)].filter(x => x.length > 0);
  if (hasil.length === 0) hasil.push("undangan");
  hasil.push(akhiran);
  return hasil.join("-");
}

interface FotoBaru { nama: string; kunci: string; path: string }

// Permintaan foto -> path di dokumen. Foto "tetap" hanya boleh foto milik undangan ini (lama); sisanya dibuatkan path baru.
function siapkanFoto(slug: string, spec: SpecFoto | null | undefined, lama: FotoIsian | null) {
  const baru: FotoBaru[] = [];
  const pathBaru = (nama: string) => {
    const kunci = randomBytes(16).toString("hex");
    const path = `${slug}/${kunci}.jpg`;
    baru.push({ nama, kunci, path });
    return PATH_FOTO + path;
  };
  const tidakAda = () => { throw new ErrorBisnis("Foto lama tidak ditemukan. Muat ulang halaman, lalu coba lagi."); };
  const mempelai = (pilih: unknown, nama: string, pathLama: string | null) =>
    pilih === "baru" ? pathBaru(nama) : pilih === "tetap" ? (pathLama ?? tidakAda()) : null;

  const galeriSpec = Array.isArray(spec?.Galeri) ? spec.Galeri : [];
  if (galeriSpec.length > JUMLAH_GALERI_MAKS) throw new ErrorBisnis(`Galeri maksimal ${JUMLAH_GALERI_MAKS} foto`);
  const galeriLama = new Set(lama?.Galeri ?? []);
  const foto: FotoIsian = {
    Wanita: mempelai(spec?.Wanita, "wanita", lama?.Wanita ?? null),
    Pria: mempelai(spec?.Pria, "pria", lama?.Pria ?? null),
    Galeri: galeriSpec.map((g, i) => {
      if (g === "baru") return pathBaru(`galeri-${i + 1}`);
      const tetap = typeof g === "object" && g ? g.Tetap : null;
      return tetap && galeriLama.has(tetap) ? tetap : tidakAda();
    }),
  };
  return { foto, baru };
}

async function buatUnggahan(baru: FotoBaru[]): Promise<Unggahan[]> {
  const db = supabaseAdmin();
  const hasil: Unggahan[] = [];
  for (const f of baru) {
    const { data: url, error } = await db.storage.from(BUCKET_FOTO).createSignedUploadUrl(f.path);
    if (error || !url) throw new Error(error?.message ?? "Gagal menyiapkan unggahan foto");
    hasil.push({ nama: f.nama, path: url.path, token: url.token });
  }
  return hasil;
}

// Undangan baru dari template pilihan. Disimpan sebagai Draf sampai foto selesai diunggah (terbitkan).
// Tanpa foto langsung Terbit. pemilik: pengguna yang login, null untuk tamu tanpa akun.
export async function buatBaru(kodeTemplate: string, pemilik: Pengguna | null, input: NewRow, spec: SpecFoto | null): Promise<HasilSimpan> {
  const { kartu, dokumen: dokumenAwal } = await getTemplate(kodeTemplate);
  if (!kartu.gratis && !pemilik) throw new ErrorBisnis(PESAN.TEMPLATE_TERKUNCI);
  const data = bersihkanInput(input, Array.isArray(spec?.Galeri) ? spec.Galeri.length : 0, hariIni());

  const db = supabaseAdmin();
  let slug = "";
  for (let percobaan = 1; ; percobaan++) {
    if (percobaan > 5) throw new Error("Gagal membuat alamat undangan yang unik");
    slug = buatSlug(data.wanita.panggilan, data.pria.panggilan);
    const ada = periksa(await db.from("t_undangan").select("id").eq("slug", slug).maybeSingle());
    if (!ada) break;
  }

  // Foto disimpan di Storage: {slug}/{kunci}.jpg, ditampilkan lewat /foto/{slug}/{kunci}.jpg
  const { foto, baru } = siapkanFoto(slug, spec, null);
  const dokumen = susunDokumen(dokumenAwal, input, data, { wanita: foto.Wanita, pria: foto.Pria, galeri: foto.Galeri });
  const kodeEdit = randomBytes(32).toString("base64url");

  const baris = periksa(await db.from("t_undangan").insert({
    slug,
    kode_edit_hash: hashKode(kodeEdit),
    template_kode: kartu.kode,
    dokumen,
    isian: { Data: input, Foto: foto },
    status: baru.length > 0 ? EStatusUndangan.Draf : EStatusUndangan.Terbit,
    pemilik_id: pemilik?.id ?? null,
  }).select("id").single()) as { id: number };

  try {
    if (baru.length > 0)
      periksa(await db.from("t_undangan_foto").insert(baru.map(f => ({ undangan_id: baris.id, kunci: f.kunci, path: f.path }))));
    // Tamu dikelola terpisah di /tamu/{slug} (nama, nomor WA, kode unik), bukan dari editor
    return { slug, kodeEdit, unggah: await buatUnggahan(baru) };
  } catch (e) {
    await db.from("t_undangan").delete().eq("id", baris.id);
    throw e;
  }
}

interface BarisUbah { id: number; slug: string; status: number; template_kode: string; isian: { Data: NewRow; Foto: FotoIsian } | null }

// Hanya pemilik (login) atau pemegang kode edit. Selain itu dianggap tidak ada, supaya keberadaan slug tidak bocor.
async function barisDiizinkan(slug: string, pengguna: Pengguna | null, kodeEdit: unknown): Promise<BarisUbah> {
  const s = (slug ?? "").trim().toLowerCase();
  const tidakAda = new ErrorTidakAda(PESAN.TIDAK_DITEMUKAN("Undangan"));
  if (s.length > 60 || !FORMAT_SLUG.test(s)) throw tidakAda;
  const row = periksa(await supabaseAdmin().from("t_undangan")
    .select("id, slug, status, template_kode, isian, pemilik_id, kode_edit_hash").eq("slug", s).maybeSingle());
  if (!row) throw tidakAda;
  const pemilik = pengguna != null && row.pemilik_id === pengguna.id;
  const punyaKode = typeof kodeEdit === "string" && kodeEdit.length > 0 && row.kode_edit_hash === hashKode(kodeEdit);
  if (!pemilik && !punyaKode) throw tidakAda;
  return row as BarisUbah;
}

// Isian form untuk mengisi editor mode ubah
export async function getIsian(slug: string, pengguna: Pengguna | null, kodeEdit: unknown): Promise<IsianUndangan> {
  const row = await barisDiizinkan(slug, pengguna, kodeEdit);
  if (!row.isian) throw new ErrorBisnis("Undangan ini dibuat sebelum fitur ubah tersedia, jadi isiannya tidak bisa dibuka di editor.");
  return { Slug: row.slug, TemplateKode: row.template_kode, Data: row.isian.Data, Foto: row.isian.Foto };
}

// Ubah undangan: dokumen disusun ulang dari template dan isian baru. Alamat (slug), kode edit, RSVP, dan ucapan tetap.
// Foto lama yang tidak dipakai lagi dihapus; foto baru diunggah browser lalu diperiksa lewat terbitkan().
export async function ubah(slug: string, pengguna: Pengguna | null, kodeEdit: unknown, input: NewRow, spec: SpecFoto | null): Promise<HasilSimpan> {
  const row = await barisDiizinkan(slug, pengguna, kodeEdit);
  if (!row.isian) throw new ErrorBisnis("Undangan ini dibuat sebelum fitur ubah tersedia, jadi tidak bisa diubah lewat editor.");
  const { dokumen: dokumenAwal } = await getTemplate(row.template_kode);
  const data = bersihkanInput(input, Array.isArray(spec?.Galeri) ? spec.Galeri.length : 0, hariIni());

  const lama = row.isian.Foto;
  const { foto, baru } = siapkanFoto(row.slug, spec, lama);
  const dokumen = susunDokumen(dokumenAwal, input, data, { wanita: foto.Wanita, pria: foto.Pria, galeri: foto.Galeri });

  const db = supabaseAdmin();
  if (baru.length > 0)
    periksa(await db.from("t_undangan_foto").insert(baru.map(f => ({ undangan_id: row.id, kunci: f.kunci, path: f.path }))));
  const unggah = await buatUnggahan(baru);

  // Daftar tamu tidak disentuh: kode unik, nomor WA, dan status kirim/hadir tetap
  periksa(await db.from("t_undangan").update({ dokumen, isian: { Data: input, Foto: foto }, upd_date: new Date().toISOString() }).eq("id", row.id));

  // Foto lama yang dilepas: hapus file dan barisnya
  const dipakai = new Set([foto.Wanita, foto.Pria, ...foto.Galeri].filter(Boolean));
  const dilepas = [lama.Wanita, lama.Pria, ...lama.Galeri].filter((p): p is string => !!p && !dipakai.has(p)).map(p => p.slice(PATH_FOTO.length));
  if (dilepas.length > 0) {
    await db.storage.from(BUCKET_FOTO).remove(dilepas);
    periksa(await db.from("t_undangan_foto").delete().eq("undangan_id", row.id).in("path", dilepas));
  }

  return { slug: row.slug, kodeEdit: null, unggah };
}

// ---------- daftar tamu dan undangan pribadi ----------
const FORMAT_KODE_TAMU = /^[0-9a-f]{32}$/;

export interface TamuItem {
  Kode: string;
  Nama: string;
  // 62xxxxxxxxx, null bila belum diisi
  Telepon: string | null;
  DikirimPada: string | null;
  HadirPada: string | null;
}

interface BarisTamu { kode: string; nama: string; telepon: string | null; dikirim_pada: string | null; hadir_pada: string | null }

const keTamu = (x: BarisTamu): TamuItem => ({ Kode: x.kode, Nama: x.nama, Telepon: x.telepon, DikirimPada: x.dikirim_pada, HadirPada: x.hadir_pada });

// Nomor WA tamu: 08xx / 628xx / +628xx -> 628xx. Kosong = null.
function bersihkanTeleponTamu(v: unknown): string | null {
  let angka = (typeof v === "string" ? v : "").replace(/\D/g, "");
  if (!angka) return null;
  if (angka.startsWith("0")) angka = "62" + angka.slice(1);
  if (!/^628\d{7,12}$/.test(angka)) throw new ErrorBisnis("Nomor WhatsApp tamu tidak valid. Contoh: 081234567890");
  return angka;
}

// Tamu urut ditambahkan; hanya pemilik atau pemegang kode edit
export async function daftarTamu(slug: string, pengguna: Pengguna | null, kodeEdit: unknown): Promise<{ slug: string; tamu: TamuItem[] }> {
  const row = await barisDiizinkan(slug, pengguna, kodeEdit);
  const rows = periksa(await supabaseAdmin().from("t_undangan_tamu").select("kode, nama, telepon, dikirim_pada, hadir_pada")
    .eq("undangan_id", row.id).order("id")) as BarisTamu[];
  return { slug: row.slug, tamu: rows.map(keTamu) };
}

export async function tambahTamu(slug: string, pengguna: Pengguna | null, kodeEdit: unknown, input: { Nama?: unknown; Telepon?: unknown }): Promise<TamuItem> {
  const row = await barisDiizinkan(slug, pengguna, kodeEdit);
  const nama = (typeof input?.Nama === "string" ? input.Nama : "").replace(/\s+/g, " ").trim();
  if (!nama) throw new ErrorBisnis(PESAN.WAJIB("Nama tamu"));
  if (nama.length > 60) throw new ErrorBisnis("Nama tamu maksimal 60 karakter");
  const telepon = bersihkanTeleponTamu(input?.Telepon);
  const db = supabaseAdmin();
  const { count } = await db.from("t_undangan_tamu").select("id", { count: "exact", head: true }).eq("undangan_id", row.id);
  if ((count ?? 0) >= JUMLAH_TAMU_MAKS) throw new ErrorBisnis(`Daftar tamu maksimal ${JUMLAH_TAMU_MAKS} nama`);
  const baru = periksa(await db.from("t_undangan_tamu").insert({ undangan_id: row.id, nama, telepon, kode: randomBytes(16).toString("hex") })
    .select("kode, nama, telepon, dikirim_pada, hadir_pada").single()) as BarisTamu;
  return keTamu(baru);
}

async function barisTamu(slug: string, pengguna: Pengguna | null, kodeEdit: unknown, kode: unknown) {
  const row = await barisDiizinkan(slug, pengguna, kodeEdit);
  if (typeof kode !== "string" || !FORMAT_KODE_TAMU.test(kode)) throw new ErrorTidakAda(PESAN.TIDAK_DITEMUKAN("Tamu"));
  return { undanganId: row.id, kode };
}

export async function hapusTamu(slug: string, pengguna: Pengguna | null, kodeEdit: unknown, kode: unknown): Promise<void> {
  const t = await barisTamu(slug, pengguna, kodeEdit, kode);
  periksa(await supabaseAdmin().from("t_undangan_tamu").delete().eq("undangan_id", t.undanganId).eq("kode", t.kode));
}

// Ditandai saat tombol kirim ditekan (WhatsApp dibuka di perangkat pengirim; pengiriman sebenarnya tidak bisa dipastikan)
export async function tandaiTerkirim(slug: string, pengguna: Pengguna | null, kodeEdit: unknown, kode: unknown): Promise<TamuItem> {
  const t = await barisTamu(slug, pengguna, kodeEdit, kode);
  const hasil = periksa(await supabaseAdmin().from("t_undangan_tamu").update({ dikirim_pada: new Date().toISOString() })
    .eq("undangan_id", t.undanganId).eq("kode", t.kode).select("kode, nama, telepon, dikirim_pada, hadir_pada").maybeSingle()) as BarisTamu | null;
  if (!hasil) throw new ErrorTidakAda(PESAN.TIDAK_DITEMUKAN("Tamu"));
  return keTamu(hasil);
}

// Tamu pemilik link pribadi /u/{slug}?t={kode}; null bila kode tidak cocok
export async function getTamuUndangan(undangan: UndanganTerbit, kode: unknown): Promise<{ nama: string; kode: string } | null> {
  if (typeof kode !== "string" || !FORMAT_KODE_TAMU.test(kode)) return null;
  const row = periksa(await supabaseAdmin().from("t_undangan_tamu").select("nama, kode")
    .eq("undangan_id", undangan.id).eq("kode", kode).maybeSingle()) as { nama: string; kode: string } | null;
  return row;
}

// Tipe ditentukan dari isi file, bukan dari header kiriman browser. Null bila bukan JPG, PNG, atau WebP.
function kenaliFoto(b: Uint8Array): string | null {
  if (b.length >= 3 && b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff) return "image/jpeg";
  if (b.length >= 8 && [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a].every((x, i) => b[i] === x)) return "image/png";
  const ascii = (dari: number, ke: number) => String.fromCharCode(...b.slice(dari, ke));
  if (b.length >= 12 && ascii(0, 4) === "RIFF" && ascii(8, 12) === "WEBP") return "image/webp";
  return null;
}

// Setelah foto terunggah (dibuat atau diubah): periksa isi tiap file, lalu undangan Terbit.
// Hanya pemilik atau pemegang kode edit. Foto yang bukan gambar dihapus.
export async function terbitkan(slug: string, pengguna: Pengguna | null, kodeEdit: unknown): Promise<void> {
  const row = await barisDiizinkan(slug, pengguna, kodeEdit);
  const db = supabaseAdmin();
  const fotos = periksa(await db.from("t_undangan_foto").select("path").eq("undangan_id", row.id)) as { path: string }[];
  // Hanya 16 byte pertama yang dibaca (Range), cukup untuk mengenali tipe file
  for (const f of fotos) {
    const res = await fetch(`${SUPABASE_URL}/storage/v1/object/public/${BUCKET_FOTO}/${f.path}`, { headers: { Range: "bytes=0-15" }, cache: "no-store" });
    if (!res.ok) throw new ErrorBisnis("Foto belum selesai diunggah. Coba lagi.");
    if (!kenaliFoto(new Uint8Array(await res.arrayBuffer()).slice(0, 16))) {
      await db.storage.from(BUCKET_FOTO).remove([f.path]);
      throw new ErrorBisnis("Foto harus berformat JPG, PNG, atau WebP");
    }
  }
  if (row.status !== EStatusUndangan.Terbit)
    periksa(await db.from("t_undangan").update({ status: EStatusUndangan.Terbit, upd_date: new Date().toISOString() }).eq("id", row.id));
}

// ---------- dasbor ----------
// Undangan yang dibuat pengguna saat login, terbaru dulu, dengan ringkasan RSVP dan ucapan
// Jumlah undangan milik pengguna (untuk pintasan di beranda), tanpa memuat isinya
export async function hitungMilik(pengguna: Pengguna): Promise<number> {
  const { count, error } = await supabaseAdmin().from("t_undangan").select("id", { count: "exact", head: true }).eq("pemilik_id", pengguna.id);
  if (error) throw new Error(error.message);
  return count ?? 0;
}

export async function getMilik(pengguna: Pengguna): Promise<UndanganMilik[]> {
  const db = supabaseAdmin();
  const rows = periksa(await db.from("t_undangan")
    .select("id, slug, dokumen, status, ins_date, template_kode, isian_ada:isian->Data->Wanita, m_template(nama), t_rsvp(hadir, jumlah), t_ucapan(count)")
    .eq("pemilik_id", pengguna.id).order("ins_date", { ascending: false }).order("id", { ascending: false })) as unknown as {
      slug: string; dokumen: unknown; status: number; ins_date: string; template_kode: string; isian_ada: unknown;
      m_template: { nama: string } | null; t_rsvp: { hadir: boolean; jumlah: number }[]; t_ucapan: { count: number }[];
    }[];
  return rows.map(x => {
    const dokumen = parseDokumen(x.dokumen);
    const sampul = isiPertama(dokumen, "sampul");
    return {
      slug: x.slug,
      judul: dokumen.meta.judul,
      deskripsi: dokumen.meta.deskripsi ?? null,
      templateNama: x.m_template?.nama ?? "",
      templateKode: x.template_kode,
      label: sampul?.label ?? "",
      nama1: sampul?.nama1 ?? "",
      nama2: sampul?.nama2 ?? "",
      mulai: cariSection(dokumen, "hitung-mundur")?.isi.mulai ?? null,
      bisaDiubah: x.isian_ada != null,
      terbit: x.status === EStatusUndangan.Terbit,
      insDate: x.ins_date,
      jumlahRsvp: x.t_rsvp.length,
      jumlahHadir: x.t_rsvp.filter(r => r.hadir).reduce((n, r) => n + r.jumlah, 0),
      jumlahUcapan: x.t_ucapan[0]?.count ?? 0,
    };
  });
}
