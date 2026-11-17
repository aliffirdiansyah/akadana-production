// Isi form pembuatan -> dokumen undangan. Fungsi murni, dipakai server (simpan) dan browser (pratinjau langsung).
// Isi contoh template diganti data dari form, atau dibuang dan disembunyikan bila kosong,
// supaya tidak ada data fiktif di undangan sungguhan.
import { DataOrang, DataRekening, DokumenUndangan, FORMAT_TELEPON, parseDokumen } from "./dokumen";
import { ErrorBisnis, EZonaWaktu, JUMLAH_ACARA_MAKS, JUMLAH_GALERI_MAKS, JUMLAH_REKENING_MAKS, JUMLAH_TAMU_MAKS, PESAN } from "./konstanta";
import { bacaTanggal, isoDenganOffset, tambahHari, teksTanggal, teksTanggalPendek } from "../waktu";

// Body form pembuatan (PascalCase, sama dengan Undangan.NewRow versi .NET)
export interface MempelaiRow {
  NamaPanggilan?: string | null;
  NamaLengkap?: string | null;
  AnakKe?: string | null;
  NamaAyah?: string | null;
  NamaIbu?: string | null;
}

export interface AcaraRow {
  Nama?: string | null;
  // yyyy-MM-dd
  Tanggal?: string | null;
  // HH:mm
  JamMulai?: string | null;
  JamSelesai?: string | null;
  Tempat?: string | null;
  Utama?: boolean;
}

export interface LokasiRow {
  Nama?: string | null;
  Alamat?: string | null;
  UrlPeta?: string | null;
}

export interface RekeningRow {
  Bank?: string | null;
  Nomor?: string | null;
  AtasNama?: string | null;
}

export interface NewRow {
  Wanita?: MempelaiRow | null;
  Pria?: MempelaiRow | null;
  ZonaWaktu?: number;
  Acara?: AcaraRow[] | null;
  Lokasi?: LokasiRow | null;
  // Nomor WhatsApp kontak, tampil di undangan (section penutup)
  Telepon?: string | null;
  TeksPembuka?: string | null;
  TerjemahPembuka?: string | null;
  TeksPenutup?: string | null;
  TerjemahPenutup?: string | null;
  TampilRsvp?: boolean;
  BatasRsvp?: string | null;
  MaksTamu?: number;
  CatatanRsvp?: string | null;
  TampilUcapan?: boolean;
  Rekening?: RekeningRow[] | null;
  CatatanAmplop?: string | null;
  Tamu?: string[] | null;
}

// Kartu pilihan template. Hanya template aktif pertama yang gratis, sisanya wajib login.
export interface TemplateKartu {
  kode: string;
  nama: string;
  gratis: boolean;
  // Isi sampul contoh dari dokumen template, untuk pratinjau kartu
  contohLabel: string;
  contohNama: string;
}

// Path foto per penanda; null = tanpa foto
export interface PathFoto {
  wanita: string | null;
  pria: string | null;
  galeri: string[];
}

interface MempelaiBersih { panggilan: string; lengkap: string; anakKe: string | null; ayah: string | null; ibu: string | null }
interface AcaraBersih { nama: string; tanggal: string | null; mulai: string | null; selesai: string | null; tempat: string | null; utama: boolean; teksWaktu: string }
interface LokasiBersih { nama: string; alamat: string | null; urlPeta: string }

export interface InputBersih {
  wanita: MempelaiBersih;
  pria: MempelaiBersih;
  zona: EZonaWaktu;
  acara: AcaraBersih[];
  acaraUtama: AcaraBersih | null;
  lokasi: LokasiBersih;
  telepon: string;
  rekening: DataRekening[];
  tamu: string[];
}

const FORMAT_NOMOR_REKENING = /^[0-9][0-9 .-]{3,29}$/;
const FORMAT_JAM = /^([01]\d|2[0-3]):[0-5]\d$/;

const rapikan = (teks: unknown) => (typeof teks === "string" ? teks : "").replace(/\s+/g, " ").trim();

function bersihkanTeks(teks: unknown, namaField: string, maks: number): string {
  const hasil = rapikan(teks);
  if (hasil.length === 0) throw new ErrorBisnis(PESAN.WAJIB(namaField));
  if (hasil.length > maks) throw new ErrorBisnis(`${namaField} maksimal ${maks} karakter`);
  return hasil;
}

function bersihkanOpsional(teks: unknown, namaField: string, maks: number): string | null {
  return rapikan(teks).length === 0 ? null : bersihkanTeks(teks, namaField, maks);
}

// Kata pembuka/penutup dan catatan: spasi dan baris baru dirapikan seperti versi .NET
const bersihkanParagraf = bersihkanOpsional;

// Nama tamu di RSVP/ucapan
export const bersihkanNama = (nama: unknown) => bersihkanTeks(nama, "Nama", 80);

function bersihkanMempelai(row: MempelaiRow | null | undefined, jenis: string): MempelaiBersih {
  const panggilan = bersihkanTeks(row?.NamaPanggilan, `Nama panggilan mempelai ${jenis}`, 40);
  return {
    panggilan,
    lengkap: bersihkanOpsional(row?.NamaLengkap, `Nama lengkap mempelai ${jenis}`, 100) ?? panggilan,
    anakKe: bersihkanOpsional(row?.AnakKe, `Urutan anak mempelai ${jenis}`, 20),
    ayah: bersihkanOpsional(row?.NamaAyah, `Nama ayah mempelai ${jenis}`, 80),
    ibu: bersihkanOpsional(row?.NamaIbu, `Nama ibu mempelai ${jenis}`, 80),
  };
}

function bacaJam(jam: unknown, namaAcara: string): string | null {
  const teks = rapikan(jam);
  if (!teks) return null;
  if (!FORMAT_JAM.test(teks)) throw new ErrorBisnis(`Jam ${namaAcara} tidak valid`);
  return teks;
}

// Mis. Sabtu, 12 Juni 2027 · 08.00–10.00 WIB
function teksWaktu(tanggal: string | null, mulai: string | null, selesai: string | null, zona: EZonaWaktu): string {
  if (!tanggal) return "Tanggal menyusul";
  let teks = teksTanggal(tanggal);
  if (!mulai) return teks;
  teks += " · " + mulai.replace(":", ".");
  if (selesai) teks += "–" + selesai.replace(":", ".");
  return `${teks} ${EZonaWaktu[zona]}`;
}

function bersihkanAcara(daftar: AcaraRow[] | null | undefined, zona: EZonaWaktu, hariIni: string): AcaraBersih[] {
  if (!Array.isArray(daftar) || daftar.length === 0) throw new ErrorBisnis("Susunan acara minimal berisi 1 acara");
  if (daftar.length > JUMLAH_ACARA_MAKS) throw new ErrorBisnis(`Susunan acara maksimal ${JUMLAH_ACARA_MAKS} acara`);

  return daftar.map(row => {
    const nama = bersihkanTeks(row?.Nama, "Nama acara", 60);
    const adaTanggal = rapikan(row?.Tanggal).length > 0;
    const tanggal = bacaTanggal(row?.Tanggal);
    if (adaTanggal && !tanggal) throw new ErrorBisnis(`Tanggal ${nama} tidak valid`);
    const mulai = bacaJam(row?.JamMulai, nama);
    const selesai = bacaJam(row?.JamSelesai, nama);

    if (tanggal && tanggal < hariIni) throw new ErrorBisnis(`Tanggal ${nama} tidak boleh sebelum hari ini`);
    if (!tanggal && (mulai || selesai)) throw new ErrorBisnis(`Isi tanggal ${nama} sebelum mengisi jamnya`);
    if (selesai && !mulai) throw new ErrorBisnis(`Isi jam mulai ${nama} sebelum jam selesai`);
    if (selesai && mulai && selesai <= mulai) throw new ErrorBisnis(`Jam selesai ${nama} harus setelah jam mulai`);

    return { nama, tanggal, mulai, selesai, tempat: bersihkanOpsional(row?.Tempat, `Tempat ${nama}`, 150), utama: row?.Utama === true, teksWaktu: teksWaktu(tanggal, mulai, selesai, zona) };
  });
}

function bersihkanLokasi(row: LokasiRow | null | undefined): LokasiBersih {
  const nama = bersihkanTeks(row?.Nama, "Nama tempat acara", 150);
  const alamat = bersihkanOpsional(row?.Alamat, "Alamat", 250);
  const url = bersihkanOpsional(row?.UrlPeta, "Link peta", 500);
  if (url) {
    let https = false;
    try { https = new URL(url).protocol === "https:"; } catch { https = false; }
    if (!https) throw new ErrorBisnis("Link peta harus berupa alamat https://");
  }
  return {
    nama,
    alamat,
    // tanpa link dari pengguna: pencarian Google Maps dari nama dan alamat
    urlPeta: url ?? "https://www.google.com/maps/search/?api=1&query=" + encodeURIComponent(alamat ? `${nama}, ${alamat}` : nama),
  };
}

// Disimpan sebagai 62xxxxxxxxx, dipakai untuk link wa.me
function bersihkanTelepon(telepon: unknown): string {
  let angka = (typeof telepon === "string" ? telepon : "").replace(/[\s\-().]/g, "");
  if (angka.length === 0) throw new ErrorBisnis(PESAN.WAJIB("Nomor WhatsApp"));
  if (angka.startsWith("+")) angka = angka.slice(1);
  if (angka.startsWith("0")) angka = "62" + angka.slice(1);
  if (!FORMAT_TELEPON.test(angka)) throw new ErrorBisnis("Nomor WhatsApp tidak valid. Contoh: 081234567890");
  return angka;
}

function bersihkanRekening(daftar: RekeningRow[] | null | undefined): DataRekening[] {
  const isi = (Array.isArray(daftar) ? daftar : []).filter(x => rapikan(x?.Bank) || rapikan(x?.Nomor) || rapikan(x?.AtasNama));
  if (isi.length > JUMLAH_REKENING_MAKS) throw new ErrorBisnis(`Amplop digital maksimal ${JUMLAH_REKENING_MAKS} rekening`);
  return isi.map(row => {
    const nomor = bersihkanTeks(row.Nomor, "Nomor rekening", 30);
    if (!FORMAT_NOMOR_REKENING.test(nomor)) throw new ErrorBisnis("Nomor rekening hanya boleh berisi angka, spasi, titik, atau tanda hubung");
    return { bank: bersihkanTeks(row.Bank, "Nama bank", 40), nomor, atasNama: bersihkanTeks(row.AtasNama, "Atas nama rekening", 80) };
  });
}

// Baris kosong dibuang, nama yang sama hanya disimpan sekali
function bersihkanTamu(daftar: string[] | null | undefined): string[] {
  const hasil: string[] = [];
  const sudah = new Set<string>();
  for (const x of Array.isArray(daftar) ? daftar : []) {
    if (!rapikan(x)) continue;
    const nama = bersihkanTeks(x, "Nama tamu", 60);
    const kunci = nama.toLocaleLowerCase("id-ID");
    if (sudah.has(kunci)) continue;
    sudah.add(kunci);
    hasil.push(nama);
  }
  if (hasil.length > JUMLAH_TAMU_MAKS) throw new ErrorBisnis(`Daftar tamu maksimal ${JUMLAH_TAMU_MAKS} nama`);
  return hasil;
}

// Validasi isi form, dipakai simpan dan pratinjau. Cek template terkunci dilakukan pemanggil (butuh status login).
export function bersihkanInput(input: NewRow | null | undefined, jumlahGaleri: number, hariIni: string): InputBersih {
  if (!input || typeof input !== "object") throw new ErrorBisnis(PESAN.DATA_INVALID);

  const wanita = bersihkanMempelai(input.Wanita, "wanita");
  const pria = bersihkanMempelai(input.Pria, "pria");
  const zona = Number(input.ZonaWaktu ?? EZonaWaktu.WIB) as EZonaWaktu;
  if (!(zona in EZonaWaktu) || typeof EZonaWaktu[zona] !== "string") throw new ErrorBisnis("Zona waktu tidak valid");
  const acara = bersihkanAcara(input.Acara, zona, hariIni);
  const lokasi = bersihkanLokasi(input.Lokasi);
  const telepon = bersihkanTelepon(input.Telepon);
  const rekening = bersihkanRekening(input.Rekening);
  const tamu = bersihkanTamu(input.Tamu);

  const bertanggal = acara.filter(x => x.tanggal);
  const acaraUtama = bertanggal.find(x => x.utama)
    ?? [...bertanggal].sort((a, b) => (a.tanggal! + (a.mulai ?? "")).localeCompare(b.tanggal! + (b.mulai ?? "")))[0]
    ?? null;

  if (input.TampilRsvp && rapikan(input.BatasRsvp)) {
    const batas = bacaTanggal(input.BatasRsvp);
    if (!batas) throw new ErrorBisnis("Batas konfirmasi tidak valid");
    if (batas < hariIni) throw new ErrorBisnis("Batas konfirmasi tidak boleh sebelum hari ini");
    if (acaraUtama && batas > acaraUtama.tanggal!) throw new ErrorBisnis("Batas konfirmasi tidak boleh setelah acara");
  }
  if (input.TampilRsvp) {
    const maks = Number(input.MaksTamu ?? 2);
    if (!Number.isInteger(maks) || maks < 1 || maks > 10) throw new ErrorBisnis("Maksimal tamu per konfirmasi antara 1 dan 10");
  }

  if (jumlahGaleri < 0 || jumlahGaleri > JUMLAH_GALERI_MAKS) throw new ErrorBisnis(`Galeri maksimal ${JUMLAH_GALERI_MAKS} foto`);

  return { wanita, pria, zona, acara, acaraUtama, lokasi, telepon, rekening, tamu };
}

function teksOrangTua(orang: MempelaiBersih, sebutan: string): string | null {
  const orangTua = [orang.ayah, orang.ibu].filter(Boolean).join(" & ");
  if (!orangTua) return null;
  return (orang.anakKe ? `${sebutan} ${orang.anakKe} dari\n` : `${sebutan} dari\n`) + orangTua;
}

// Dokumen template + isi form -> dokumen undangan
export function susunDokumen(dokumenAwal: unknown, input: NewRow, data: InputBersih, foto: PathFoto): DokumenUndangan {
  const dokumen = parseDokumen(structuredClone(dokumenAwal));
  const { wanita, pria, acara, acaraUtama, lokasi, rekening, zona } = data;
  const teksTgl = acaraUtama ? teksTanggal(acaraUtama.tanggal!) : null;
  const pasangan = `${wanita.panggilan} & ${pria.panggilan}`;

  dokumen.meta.judul = `Undangan Pernikahan ${pasangan}`;
  dokumen.meta.deskripsi = teksTgl ? `${teksTgl} · ${lokasi.nama}` : lokasi.nama;

  for (const section of dokumen.section) {
    switch (section.tipe) {
      case "sampul":
        section.isi.nama1 = wanita.panggilan;
        section.isi.nama2 = pria.panggilan;
        break;

      case "pembuka":
        section.isi.teks = bersihkanParagraf(input.TeksPembuka, "Kata pembuka", 500) ?? section.isi.teks;
        section.isi.terjemah = bersihkanParagraf(input.TerjemahPembuka, "Terjemahan kata pembuka", 500);
        break;

      case "mempelai": {
        // urutan template: putri lalu putra
        const orang = [
          { data: wanita, foto: foto.wanita, sebutan: "Putri" },
          { data: pria, foto: foto.pria, sebutan: "Putra" },
        ];
        section.isi.orang = section.isi.orang.slice(0, 2).map((o, i): DataOrang => ({
          label: o.label,
          namaPanggilan: orang[i].data.panggilan,
          namaLengkap: orang[i].data.lengkap,
          keterangan: teksOrangTua(orang[i].data, orang[i].sebutan),
          foto: orang[i].foto,
        }));
        break;
      }

      case "hitung-mundur":
        section.tampil = acaraUtama != null;
        if (acaraUtama) {
          const tanggal = acaraUtama.tanggal!;
          section.isi.judul = teksTgl!;
          section.isi.mulai = isoDenganOffset(tanggal, acaraUtama.mulai ?? "00:00", zona);
          // tanpa jam: acara sehari penuh. Ada jam mulai saja: kalender memakai durasi bawaan.
          section.isi.selesai = acaraUtama.selesai
            ? isoDenganOffset(tanggal, acaraUtama.selesai, zona)
            : acaraUtama.mulai == null ? isoDenganOffset(tambahHari(tanggal, 1), "00:00", zona) : null;
          section.isi.lokasiKalender = acaraUtama.tempat ?? lokasi.nama;
        }
        break;

      case "acara":
        section.isi.daftar = acara.map(x => ({ nama: x.nama, waktu: x.teksWaktu, tempat: x.tempat, utama: x.utama }));
        section.isi.lokasi = { label: section.isi.lokasi?.label ?? null, nama: lokasi.nama, alamat: lokasi.alamat, urlPeta: lokasi.urlPeta };
        break;

      case "galeri":
        section.isi.foto = foto.galeri;
        section.tampil = foto.galeri.length > 0;
        break;

      case "rsvp": {
        section.tampil = input.TampilRsvp === true;
        const batas = (input.TampilRsvp && bacaTanggal(input.BatasRsvp)) || acaraUtama?.tanggal || null;
        section.isi.batasTanggal = batas;
        if (input.TampilRsvp) section.isi.maksTamu = Number(input.MaksTamu ?? 2);
        section.isi.catatan = bersihkanOpsional(input.CatatanRsvp, "Catatan konfirmasi", 200)
          ?? (batas ? `Mohon konfirmasi kehadiran paling lambat ${teksTanggalPendek(batas)}.` : "Mohon konfirmasi kehadiran Anda.");
        break;
      }

      case "ucapan":
        section.tampil = input.TampilUcapan === true;
        break;

      case "amplop":
        section.isi.rekening = rekening;
        section.isi.catatan = bersihkanParagraf(input.CatatanAmplop, "Catatan amplop digital", 300) ?? section.isi.catatan;
        section.tampil = rekening.length > 0;
        break;

      case "penutup": {
        section.isi.teks = bersihkanParagraf(input.TeksPenutup, "Kata penutup", 500) ?? section.isi.teks;
        section.isi.terjemah = bersihkanParagraf(input.TerjemahPenutup, "Terjemahan kata penutup", 500);
        section.isi.nama = pasangan;
        section.isi.telepon = data.telepon;
        const keluarga = [wanita.ayah ?? wanita.ibu, pria.ayah ?? pria.ibu].filter(Boolean).map(x => `Keluarga ${x}`);
        section.isi.keluarga = keluarga.length > 0 ? keluarga.join("\n& ") : null;
        break;
      }
    }
  }
  // validasi ulang hasil akhir (mis. path foto, link peta)
  return parseDokumen(JSON.parse(JSON.stringify(dokumen)));
}

// Nama panggilan wanita dan pria dari draf, null bila salah satu belum diisi
export function namaDraf(draf: NewRow | null | undefined): { wanita: string; pria: string } | null {
  const bersih = (nama: unknown) => {
    const hasil = rapikan(nama);
    return hasil.length === 0 ? null : hasil.slice(0, 40);
  };
  const wanita = bersih(draf?.Wanita?.NamaPanggilan);
  const pria = bersih(draf?.Pria?.NamaPanggilan);
  return wanita && pria ? { wanita, pria } : null;
}

// Pratinjau template: nama mempelai contoh diganti nama dari draf. Isi contoh lain (orang tua, acara, lokasi) tetap.
export function gantiNamaContoh(dokumen: DokumenUndangan, draf: NewRow): DokumenUndangan {
  const nama = namaDraf(draf);
  if (!nama) return dokumen;
  const lengkap = (n: unknown) => { const h = rapikan(n); return h.length === 0 ? null : h.slice(0, 80); };
  const lengkapWanita = lengkap(draf.Wanita?.NamaLengkap) ?? nama.wanita;
  const lengkapPria = lengkap(draf.Pria?.NamaLengkap) ?? nama.pria;
  const pasangan = `${nama.wanita} & ${nama.pria}`;
  const hasil = structuredClone(dokumen);

  const sampul = hasil.section.find(s => s.tipe === "sampul");
  if (sampul?.tipe === "sampul") hasil.meta.judul = hasil.meta.judul.replace(`${sampul.isi.nama1} & ${sampul.isi.nama2}`, pasangan);

  for (const s of hasil.section) {
    if (s.tipe === "sampul") { s.isi.nama1 = nama.wanita; s.isi.nama2 = nama.pria; }
    else if (s.tipe === "mempelai") {
      const n = [[nama.wanita, lengkapWanita], [nama.pria, lengkapPria]];
      s.isi.orang.slice(0, 2).forEach((o, i) => { o.namaPanggilan = n[i][0]; o.namaLengkap = n[i][1]; });
    }
    else if (s.tipe === "amplop") s.isi.rekening.forEach(r => { r.atasNama = lengkapWanita; });
    else if (s.tipe === "penutup") s.isi.nama = pasangan;
  }
  return hasil;
}

// Teks bawaan template untuk mengisi awal form pembuatan
export interface IsiAwal {
  teksPembuka: string | null;
  terjemahPembuka: string | null;
  teksPenutup: string | null;
  terjemahPenutup: string | null;
  catatanAmplop: string | null;
}

export function isiAwal(dokumen: DokumenUndangan): IsiAwal {
  const ambil = <T,>(tipe: string) => dokumen.section.find(s => s.tipe === tipe)?.isi as T | undefined;
  const pembuka = ambil<{ teks: string; terjemah?: string | null }>("pembuka");
  const penutup = ambil<{ teks: string; terjemah?: string | null }>("penutup");
  return {
    teksPembuka: pembuka?.teks ?? null,
    terjemahPembuka: pembuka?.terjemah ?? null,
    teksPenutup: penutup?.teks ?? null,
    terjemahPenutup: penutup?.terjemah ?? null,
    catatanAmplop: ambil<{ catatan?: string | null }>("amplop")?.catatan ?? null,
  };
}
