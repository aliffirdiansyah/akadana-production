import "server-only";
// Akses database undangan (port Undangan.Services, Rsvp, Ucapan dari versi .NET). Semua aturan bisnis di sini,
// route handler dan page hanya memanggil fungsi ini.
import { createHash, randomBytes, randomInt } from "node:crypto";
import { supabaseAdmin } from "../supabase/admin";
import { SUPABASE_URL } from "../supabase/env";
import type { Pengguna } from "../supabase/server";
import { cariSection, DokumenUndangan, isiPertama, parseDokumen } from "./dokumen";
import {
  BUCKET_FOTO, ErrorBisnis, ErrorTidakAda, EStatusUndangan, JUMLAH_GALERI_MAKS, JUMLAH_UCAPAN, MAKS_PESAN_UCAPAN, PATH_FOTO, PESAN,
} from "./konstanta";
import { bersihkanInput, bersihkanNama, NewRow, susunDokumen, TemplateKartu } from "./susun";
import { hariIni, waktuRelatif } from "../waktu";
import type { DaftarUcapan, UcapanItem } from "./tipe";

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
  terbit: boolean;
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

// ---------- pembuatan ----------
export interface FotoDiminta {
  wanita: boolean;
  pria: boolean;
  jumlahGaleri: number;
}

export interface Unggahan {
  // "wanita", "pria", atau "galeri-{n}" (n mulai 1)
  nama: string;
  path: string;
  token: string;
}

export interface HasilBuat {
  slug: string;
  // Hanya dikembalikan sekali, saat dibuat. DB menyimpan hash-nya saja.
  kodeEdit: string;
  tamu: string[];
  unggah: Unggahan[];
}

const hashKode = (kode: string) => createHash("sha256").update(kode, "utf8").digest("hex");

// Nama depan wanita-pria + 4 huruf acak, mis. sekar-bimo-k3x9
function buatSlug(wanita: string, pria: string): string {
  const bagian = (nama: string) => nama.split(" ")[0].normalize("NFD").replace(/\p{Mn}/gu, "").toLowerCase().replace(/[^a-z0-9]/g, "").slice(0, 20);
  const akhiran = Array.from({ length: 4 }, () => HURUF_SLUG[randomInt(HURUF_SLUG.length)]).join("");
  const hasil = [bagian(wanita), bagian(pria)].filter(x => x.length > 0);
  if (hasil.length === 0) hasil.push("undangan");
  hasil.push(akhiran);
  return hasil.join("-");
}

// Undangan baru dari template pilihan. Disimpan sebagai Draf sampai foto selesai diunggah (terbitkan).
// Tanpa foto langsung Terbit. pemilik: pengguna yang login, null untuk tamu tanpa akun.
export async function buatBaru(kodeTemplate: string, pemilik: Pengguna | null, input: NewRow, foto: FotoDiminta): Promise<HasilBuat> {
  const { kartu, dokumen: dokumenAwal } = await getTemplate(kodeTemplate);
  if (!kartu.gratis && !pemilik) throw new ErrorBisnis(PESAN.TEMPLATE_TERKUNCI);
  const jumlahGaleri = Math.floor(Number(foto?.jumlahGaleri) || 0);
  if (jumlahGaleri < 0 || jumlahGaleri > JUMLAH_GALERI_MAKS) throw new ErrorBisnis(`Galeri maksimal ${JUMLAH_GALERI_MAKS} foto`);
  const data = bersihkanInput(input, jumlahGaleri, hariIni());

  const db = supabaseAdmin();
  let slug = "";
  for (let percobaan = 1; ; percobaan++) {
    if (percobaan > 5) throw new Error("Gagal membuat alamat undangan yang unik");
    slug = buatSlug(data.wanita.panggilan, data.pria.panggilan);
    const ada = periksa(await db.from("t_undangan").select("id").eq("slug", slug).maybeSingle());
    if (!ada) break;
  }

  // Foto disimpan di Storage: {slug}/{kunci}.jpg, ditampilkan lewat /foto/{slug}/{kunci}.jpg
  const daftarFoto: { nama: string; kunci: string; path: string }[] = [];
  const siapkan = (nama: string) => {
    const kunci = randomBytes(16).toString("hex");
    const path = `${slug}/${kunci}.jpg`;
    daftarFoto.push({ nama, kunci, path });
    return PATH_FOTO + path;
  };
  const pathWanita = foto?.wanita ? siapkan("wanita") : null;
  const pathPria = foto?.pria ? siapkan("pria") : null;
  const pathGaleri = Array.from({ length: jumlahGaleri }, (_, i) => siapkan(`galeri-${i + 1}`));

  const dokumen = susunDokumen(dokumenAwal, input, data, { wanita: pathWanita, pria: pathPria, galeri: pathGaleri });
  const kodeEdit = randomBytes(32).toString("base64url");

  const baris = periksa(await db.from("t_undangan").insert({
    slug,
    kode_edit_hash: hashKode(kodeEdit),
    template_kode: kartu.kode,
    dokumen,
    status: daftarFoto.length > 0 ? EStatusUndangan.Draf : EStatusUndangan.Terbit,
    pemilik_id: pemilik?.id ?? null,
  }).select("id").single()) as { id: number };

  try {
    if (daftarFoto.length > 0)
      periksa(await db.from("t_undangan_foto").insert(daftarFoto.map(f => ({ undangan_id: baris.id, kunci: f.kunci, path: f.path }))));
    if (data.tamu.length > 0)
      periksa(await db.from("t_undangan_tamu").insert(data.tamu.map(nama => ({ undangan_id: baris.id, nama }))));

    const unggah: Unggahan[] = [];
    for (const f of daftarFoto) {
      const { data: url, error } = await db.storage.from(BUCKET_FOTO).createSignedUploadUrl(f.path);
      if (error || !url) throw new Error(error?.message ?? "Gagal menyiapkan unggahan foto");
      unggah.push({ nama: f.nama, path: url.path, token: url.token });
    }
    return { slug, kodeEdit, tamu: data.tamu, unggah };
  } catch (e) {
    await db.from("t_undangan").delete().eq("id", baris.id);
    throw e;
  }
}

// Tipe ditentukan dari isi file, bukan dari header kiriman browser. Null bila bukan JPG, PNG, atau WebP.
function kenaliFoto(b: Uint8Array): string | null {
  if (b.length >= 3 && b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff) return "image/jpeg";
  if (b.length >= 8 && [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a].every((x, i) => b[i] === x)) return "image/png";
  const ascii = (dari: number, ke: number) => String.fromCharCode(...b.slice(dari, ke));
  if (b.length >= 12 && ascii(0, 4) === "RIFF" && ascii(8, 12) === "WEBP") return "image/webp";
  return null;
}

// Setelah semua foto terunggah: periksa isi tiap file, lalu undangan Terbit. Hanya pembuat (pemegang kode edit) yang boleh.
export async function terbitkan(slug: string, kodeEdit: unknown): Promise<void> {
  if (typeof kodeEdit !== "string" || !FORMAT_SLUG.test(slug ?? "")) throw new ErrorTidakAda(PESAN.TIDAK_DITEMUKAN("Undangan"));
  const db = supabaseAdmin();
  const row = periksa(await db.from("t_undangan").select("id, status, kode_edit_hash").eq("slug", slug).maybeSingle());
  if (!row || row.kode_edit_hash !== hashKode(kodeEdit)) throw new ErrorTidakAda(PESAN.TIDAK_DITEMUKAN("Undangan"));
  if (row.status === EStatusUndangan.Terbit) return;

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
  periksa(await db.from("t_undangan").update({ status: EStatusUndangan.Terbit, upd_date: new Date().toISOString() }).eq("id", row.id));
}

// ---------- dasbor ----------
// Undangan yang dibuat pengguna saat login, terbaru dulu, dengan ringkasan RSVP dan ucapan
export async function getMilik(pengguna: Pengguna): Promise<UndanganMilik[]> {
  const db = supabaseAdmin();
  const rows = periksa(await db.from("t_undangan")
    .select("id, slug, dokumen, status, ins_date, m_template(nama), t_rsvp(hadir, jumlah), t_ucapan(count)")
    .eq("pemilik_id", pengguna.id).order("ins_date", { ascending: false }).order("id", { ascending: false })) as unknown as {
      slug: string; dokumen: unknown; status: number; ins_date: string; m_template: { nama: string } | null;
      t_rsvp: { hadir: boolean; jumlah: number }[]; t_ucapan: { count: number }[];
    }[];
  return rows.map(x => {
    const dokumen = parseDokumen(x.dokumen);
    return {
      slug: x.slug,
      judul: dokumen.meta.judul,
      deskripsi: dokumen.meta.deskripsi ?? null,
      templateNama: x.m_template?.nama ?? "",
      terbit: x.status === EStatusUndangan.Terbit,
      insDate: x.ins_date,
      jumlahRsvp: x.t_rsvp.length,
      jumlahHadir: x.t_rsvp.filter(r => r.hadir).reduce((n, r) => n + r.jumlah, 0),
      jumlahUcapan: x.t_ucapan[0]?.count ?? 0,
    };
  });
}
