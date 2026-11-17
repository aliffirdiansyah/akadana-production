"use client";
// Perilaku form pembuatan (port Buat.js dari versi .NET). Bekerja langsung pada DOM dari FormBuat.tsx.
// Alur: form singkat -> pratinjau undangan (iframe) + editor berisi form lengkap yang bisa disembunyikan.
// Bedanya dengan versi .NET:
// - Pratinjau dirender di browser dari dokumen template (susunDokumen + IsiUndangan), tanpa server, jadi jalan offline.
// - Draf disimpan di localStorage (lib/draf.ts).
// - Foto diunggah langsung ke Supabase Storage lewat signed URL dari /api/undangan, lalu /api/undangan/{slug}/terbit.
// - Mode ubah (/edit/{slug}): editor diisi dari isian tersimpan, foto lama bisa dipertahankan, simpan lewat PUT /api/undangan/{slug}.
import { createElement } from "react";
import { flushSync } from "react-dom";
import { createRoot } from "react-dom/client";
import { IsiUndangan } from "@/components/undangan/IsiUndangan";
import { bacaDraf, hapusDraf, simpanDraf } from "@/lib/draf";
import { Konfirmasi } from "@/lib/konfirmasi";
import { supabaseBrowser } from "@/lib/supabase/browser";
import type { DokumenUndangan } from "@/lib/undangan/dokumen";
import {
  BUCKET_FOTO, ErrorBisnis, JUMLAH_ACARA_MAKS, JUMLAH_GALERI_MAKS, JUMLAH_REKENING_MAKS, JUMLAH_TAMU_MAKS, PATH_FOTO_PRATINJAU, UKURAN_FOTO_MAKS,
} from "@/lib/undangan/konstanta";
import { bersihkanInput, susunDokumen, type NewRow } from "@/lib/undangan/susun";
import { drafDariSingkat, periksaSingkat, saringTelepon, teleponValid, PESAN_TELEPON, type IsianSingkat } from "@/lib/undangan/singkat";
import { STATUS_SUKSES, type FotoIsian, type ResponseBase, type SpecFoto } from "@/lib/undangan/tipe";
import { hariIni as hariIniJakarta } from "@/lib/waktu";

const SISI_FOTO_GALERI = 1600;
const SISI_FOTO_MEMPELAI = 800;
const JEDA_PRATINJAU = 400;
// Batas tunggu font dan gambar sebelum pratinjau ditukar
const TUNGGU_ASET_MAKS = 1500;
const UKURAN_FILE_ASLI_MAKS = 30 * 1024 * 1024;

const BATAS = { galeri: JUMLAH_GALERI_MAKS, acara: JUMLAH_ACARA_MAKS, rekening: JUMLAH_REKENING_MAKS, tamu: JUMLAH_TAMU_MAKS, ukuranFoto: UKURAN_FOTO_MAKS };

type Baris = { el: HTMLElement; data: Record<string, string | boolean | null> };

interface HasilBuat {
  Slug: string;
  Url: string;
  KodeEdit: string | null;
  LinkEdit: string;
  Tamu: { Nama: string; Url: string }[];
  Unggah: { Nama: string; Path: string; Token: string }[];
}

const htmlAcara = (hariIni: string) => `
  <fieldset class="buat-baris">
    <legend>Acara</legend>
    <div class="fields">
      <label class="field full"><span class="lbl">Nama acara</span><input type="text" data-f="Nama" maxlength="60"></label>
      <label class="field full"><span class="lbl">Tanggal</span><input type="date" data-f="Tanggal" min="${hariIni}"></label>
      <label class="field"><span class="lbl">Jam mulai</span><input type="time" data-f="JamMulai"></label>
      <label class="field"><span class="lbl">Jam selesai</span><input type="time" data-f="JamSelesai"></label>
      <label class="field full"><span class="lbl">Tempat <span class="buat-opsional">(opsional)</span></span><input type="text" data-f="Tempat" maxlength="150"></label>
    </div>
    <div class="buat-baris-kaki">
      <label class="buat-centang"><input type="checkbox" data-f="Utama"> Acara utama</label>
      <button class="btn-ghost" type="button" data-hapus>Hapus acara</button>
    </div>
  </fieldset>`;

const HTML_REKENING = `
  <fieldset class="buat-baris">
    <legend>Rekening</legend>
    <div class="fields">
      <label class="field"><span class="lbl">Bank atau dompet digital</span><input type="text" data-f="Bank" maxlength="40"></label>
      <label class="field"><span class="lbl">Nomor rekening</span><input type="text" inputmode="numeric" data-f="Nomor" maxlength="30"></label>
      <label class="field full"><span class="lbl">Atas nama</span><input type="text" data-f="AtasNama" maxlength="80"></label>
    </div>
    <div class="buat-baris-kaki">
      <button class="btn-ghost" type="button" data-hapus>Hapus rekening</button>
    </div>
  </fieldset>`;

// Dipasang sekali saat FormBuat tampil. Mengembalikan fungsi pembersih (React StrictMode memasang dua kali saat dev).
// Mode ubah: undangan yang sudah ada. kodeEdit null = pemilik yang login.
export interface ModeUbah {
  slug: string;
  data: NewRow;
  foto: FotoIsian;
  kodeEdit: string | null;
}

export function pasangEditor({ kode, dokumenAwal, hariIni, ubah }: { kode: string; dokumenAwal: DokumenUndangan; hariIni: string; ubah?: ModeUbah | null }) {
  const ac = new AbortController();
  const on = <K extends keyof HTMLElementEventMap>(el: EventTarget, ev: K, fn: (e: HTMLElementEventMap[K]) => void) =>
    el.addEventListener(ev, fn as EventListener, { signal: ac.signal });

  const $ = <T extends HTMLElement = HTMLInputElement>(id: string) => document.getElementById(id) as T;
  const form = $<HTMLFormElement>("buatForm"), notice = $<HTMLDivElement>("buatNotice"), kirim = $<HTMLButtonElement>("buatKirim");
  const urlObjek: string[] = [];

  function tampil(teks: string) {
    notice.hidden = false;
    notice.textContent = teks;
  }

  // ---------- baris acara dan rekening ----------
  function pasangDaftar(wadah: HTMLElement, html: string, tombol: HTMLButtonElement, batas: number) {
    const perbarui = () => { tombol.hidden = wadah.children.length >= batas; };
    function tambah(awal: Record<string, string | boolean> = {}) {
      const t = document.createElement("template");
      t.innerHTML = html.trim();
      const baris = t.content.firstElementChild as HTMLElement;
      for (const [nama, nilai] of Object.entries(awal)) {
        const el = baris.querySelector<HTMLInputElement>(`[data-f="${nama}"]`);
        if (!el) continue;
        if (el.type === "checkbox") el.checked = nilai === true; else el.value = String(nilai);
      }
      on(baris.querySelector("[data-hapus]")!, "click", () => {
        baris.remove();
        perbarui();
        tombol.focus();
        jadwalPratinjau();
      });
      wadah.append(baris);
      perbarui();
      return baris;
    }
    on(tombol, "click", () => tambah().querySelector("input")!.focus());
    return {
      tambah,
      kosongkan: () => { wadah.replaceChildren(); perbarui(); },
      nilai: (): Baris[] => [...wadah.children].map(baris => {
        const hasil: Baris["data"] = {};
        baris.querySelectorAll<HTMLInputElement>("[data-f]").forEach(el => {
          hasil[el.dataset.f!] = el.type === "checkbox" ? el.checked : (el.value.trim() || null);
        });
        return { el: baris as HTMLElement, data: hasil };
      }),
    };
  }

  const daftarAcara = pasangDaftar($("daftarAcara"), htmlAcara(hariIni), $<HTMLButtonElement>("tambahAcara"), BATAS.acara);
  const daftarRekening = pasangDaftar($("daftarRekening"), HTML_REKENING, $<HTMLButtonElement>("tambahRekening"), BATAS.rekening);
  daftarAcara.tambah({ Nama: "Akad Nikah", Utama: true });
  daftarAcara.tambah({ Nama: "Resepsi", Utama: true });

  // ---------- foto ----------
  // Foto diperkecil di browser dan ditulis ulang sebagai JPEG, sekaligus membuang metadata seperti lokasi GPS
  async function kecilkan(file: File, sisiMaks: number): Promise<Blob> {
    if (file.size > UKURAN_FILE_ASLI_MAKS) throw new Error("terlalu besar");
    const gambar = await createImageBitmap(file, { imageOrientation: "from-image" });
    const skala = Math.min(1, sisiMaks / Math.max(gambar.width, gambar.height));
    const kanvas = document.createElement("canvas");
    kanvas.width = Math.round(gambar.width * skala);
    kanvas.height = Math.round(gambar.height * skala);
    const ctx = kanvas.getContext("2d")!;
    ctx.fillStyle = "#fff";
    ctx.fillRect(0, 0, kanvas.width, kanvas.height);
    ctx.drawImage(gambar, 0, 0, kanvas.width, kanvas.height);
    gambar.close();
    const blob = await new Promise<Blob | null>(selesai => kanvas.toBlob(selesai, "image/jpeg", 0.85));
    if (!blob || blob.size > BATAS.ukuranFoto) throw new Error("terlalu besar");
    return blob;
  }

  // Foto baru (blob) atau foto lama yang sudah tersimpan (path, mode ubah)
  const fotoMempelai: Record<"Wanita" | "Pria", Blob | null> = { Wanita: null, Pria: null };
  const fotoLama: Record<"Wanita" | "Pria", string | null> = { Wanita: ubah?.foto.Wanita ?? null, Pria: ubah?.foto.Pria ?? null };

  document.querySelectorAll<HTMLInputElement>("[data-foto-mempelai]").forEach(input => {
    const k = input.dataset.fotoMempelai as "Wanita" | "Pria";
    const kotak = $<HTMLDivElement>(`pratinjau${k}`);
    const img = kotak.querySelector("img")!;

    // foto lama tampil sejak awal di mode ubah
    if (fotoLama[k]) { img.src = fotoLama[k]!; kotak.hidden = false; }

    function bersihkan() {
      if (img.src.startsWith("blob:")) URL.revokeObjectURL(img.src);
      img.removeAttribute("src");
      fotoMempelai[k] = null;
      fotoLama[k] = null;
      kotak.hidden = true;
      input.value = "";
      jadwalPratinjau();
    }

    on(input, "change", async () => {
      const file = input.files?.[0];
      if (!file) { bersihkan(); return; }
      try {
        const blob = await kecilkan(file, SISI_FOTO_MEMPELAI);
        if (img.src.startsWith("blob:")) URL.revokeObjectURL(img.src);
        fotoMempelai[k] = blob;
        fotoLama[k] = null;
        img.src = URL.createObjectURL(blob);
        urlObjek.push(img.src);
        kotak.hidden = false;
        notice.hidden = true;
        jadwalPratinjau();
      } catch {
        bersihkan();
        tampil(`Foto "${file.name}" tidak bisa dibaca. Gunakan JPG, PNG, atau WebP di bawah 30 MB.`);
      }
    });
    on(kotak.querySelector("button")!, "click", () => { bersihkan(); input.focus(); });
  });

  // blob = foto baru; path = foto lama yang dipertahankan (mode ubah)
  const galeri: { blob: Blob | null; url: string; path: string | null }[] = (ubah?.foto.Galeri ?? []).map(path => ({ blob: null, url: path, path }));
  const inputGaleri = $("fotoGaleri"), daftarGaleri = $<HTMLUListElement>("daftarGaleri");

  function gambarGaleri() {
    daftarGaleri.replaceChildren(...galeri.map((foto, i) => {
      const li = document.createElement("li");
      const img = document.createElement("img");
      img.src = foto.url;
      img.alt = `Foto galeri ${i + 1}`;
      const hapus = document.createElement("button");
      hapus.type = "button";
      hapus.className = "btn-ghost";
      hapus.textContent = "Hapus";
      hapus.setAttribute("aria-label", `Hapus foto galeri ${i + 1}`);
      hapus.addEventListener("click", () => {
        if (foto.blob) URL.revokeObjectURL(foto.url);
        galeri.splice(i, 1);
        gambarGaleri();
        inputGaleri.focus();
      });
      li.append(img, hapus);
      return li;
    }));
    daftarGaleri.hidden = galeri.length === 0;
    jadwalPratinjau();
  }

  on(inputGaleri, "change", async () => {
    const files = [...(inputGaleri.files ?? [])];
    inputGaleri.value = "";
    const gagal: string[] = [];
    let lewat = 0;
    for (const file of files) {
      if (galeri.length >= BATAS.galeri) { lewat++; continue; }
      try {
        const blob = await kecilkan(file, SISI_FOTO_GALERI);
        galeri.push({ blob, url: URL.createObjectURL(blob), path: null });
      } catch {
        gagal.push(file.name);
      }
    }
    gambarGaleri();
    const pesan = [];
    if (lewat) pesan.push(`Galeri maksimal ${BATAS.galeri} foto, ${lewat} foto tidak ditambahkan.`);
    if (gagal.length) pesan.push(`Tidak bisa dibaca: ${gagal.join(", ")}. Gunakan JPG, PNG, atau WebP di bawah 30 MB.`);
    if (pesan.length) tampil(pesan.join(" ")); else notice.hidden = true;
  });

  // ---------- RSVP dan tamu ----------
  const tampilRsvp = $("tampilRsvp");
  on(tampilRsvp, "change", () => { $("isianRsvp").hidden = !tampilRsvp.checked; });

  const bacaTamu = () => ($<HTMLTextAreaElement>("daftarTamu").value).split("\n").map(x => x.trim()).filter(Boolean);
  on($("daftarTamu"), "input", () => { $("jumlahTamu").textContent = String(bacaTamu().length); });

  // ---------- nomor WhatsApp ----------
  // Hanya angka (boleh diawali "+"): huruf, spasi, dan tanda lain langsung dibuang saat diketik atau ditempel (lib/undangan/singkat.ts)

  for (const id of ["singkatTelepon", "telepon"]) {
    const el = $(id);
    on(el, "input", () => {
      const bersih = saringTelepon(el.value);
      if (bersih === el.value) return;
      // posisi kursor dipertahankan: hitung karakter yang tersisa sebelum kursor
      const kursor = saringTelepon(el.value.slice(0, el.selectionStart ?? el.value.length)).length;
      el.value = bersih;
      el.setSelectionRange(kursor, kursor);
    });
  }

  // ---------- kirim ----------
  function periksa(acara: Baris[], rekening: Baris[], tamu: string[]): { pesan: string; el: HTMLElement } | null {
    const wajib: [string, string][] = [
      ["panggilanWanita", "Nama panggilan mempelai wanita"],
      ["panggilanPria", "Nama panggilan mempelai pria"],
    ];
    for (const [id, label] of wajib) {
      if (!$(id).value.trim()) return { pesan: `${label} harus diisi.`, el: $(id) };
    }
    if (acara.length === 0) return { pesan: "Susunan acara minimal berisi 1 acara.", el: $("tambahAcara") };
    const f = (el: HTMLElement, n: string) => el.querySelector<HTMLElement>(`[data-f="${n}"]`)!;
    for (const { el, data } of acara) {
      if (!data.Nama) return { pesan: "Nama acara harus diisi.", el: f(el, "Nama") };
      if ((data.JamMulai || data.JamSelesai) && !data.Tanggal) return { pesan: `Isi tanggal ${data.Nama} sebelum mengisi jamnya.`, el: f(el, "Tanggal") };
      if (data.JamSelesai && !data.JamMulai) return { pesan: `Isi jam mulai ${data.Nama} sebelum jam selesai.`, el: f(el, "JamMulai") };
      if (data.JamSelesai && data.JamMulai && data.JamSelesai <= data.JamMulai) return { pesan: `Jam selesai ${data.Nama} harus setelah jam mulai.`, el: f(el, "JamSelesai") };
    }
    if (!$("lokasiNama").value.trim()) return { pesan: "Nama tempat acara harus diisi.", el: $("lokasiNama") };
    if (!$("telepon").value.trim()) return { pesan: "Nomor WhatsApp harus diisi.", el: $("telepon") };
    if (!teleponValid($("telepon").value)) return { pesan: PESAN_TELEPON, el: $("telepon") };
    const peta = $("lokasiPeta").value.trim();
    if (peta && !peta.startsWith("https://")) return { pesan: "Link peta harus berupa alamat https://", el: $("lokasiPeta") };
    for (const { el, data } of rekening) {
      if (!data.Bank && !data.Nomor && !data.AtasNama) continue;
      for (const [nama, label] of [["Bank", "Nama bank"], ["Nomor", "Nomor rekening"], ["AtasNama", "Atas nama rekening"]]) {
        if (!data[nama]) return { pesan: `${label} harus diisi.`, el: f(el, nama) };
      }
    }
    if (tampilRsvp.checked) {
      const maks = Number($("maksTamu").value);
      if (!Number.isInteger(maks) || maks < 1 || maks > 10) return { pesan: "Maksimal tamu per konfirmasi antara 1 dan 10.", el: $("maksTamu") };
    }
    if (tamu.length > BATAS.tamu) return { pesan: `Daftar tamu maksimal ${BATAS.tamu} nama.`, el: $("daftarTamu") };
    const namaPanjang = tamu.find(x => x.length > 60);
    if (namaPanjang) return { pesan: `Nama tamu maksimal 60 karakter: ${namaPanjang}`, el: $("daftarTamu") };
    return null;
  }

  function mempelai(k: string) {
    const nilai = (n: string) => $(`${n}${k}`).value.trim() || null;
    return { NamaPanggilan: nilai("panggilan"), NamaLengkap: nilai("lengkap"), AnakKe: nilai("anak"), NamaAyah: nilai("ayah"), NamaIbu: nilai("ibu") };
  }

  function kumpulkanData(acara: Baris[], rekening: Baris[], tamu: string[]): NewRow {
    const nilai = (id: string) => ($<HTMLInputElement | HTMLTextAreaElement>(id).value).trim() || null;
    return {
      Wanita: mempelai("Wanita"),
      Pria: mempelai("Pria"),
      ZonaWaktu: Number($<HTMLSelectElement>("zonaWaktu").value),
      Acara: acara.map(x => x.data) as NewRow["Acara"],
      Lokasi: { Nama: nilai("lokasiNama"), Alamat: nilai("lokasiAlamat"), UrlPeta: nilai("lokasiPeta") },
      Telepon: nilai("telepon"),
      TeksPembuka: nilai("teksPembuka"),
      TerjemahPembuka: nilai("terjemahPembuka"),
      TeksPenutup: nilai("teksPenutup"),
      TerjemahPenutup: nilai("terjemahPenutup"),
      TampilRsvp: tampilRsvp.checked,
      BatasRsvp: nilai("batasRsvp"),
      MaksTamu: Number($("maksTamu").value),
      CatatanRsvp: nilai("catatanRsvp"),
      TampilUcapan: $("tampilUcapan").checked,
      Rekening: rekening.map(x => x.data).filter(x => x.Bank || x.Nomor || x.AtasNama) as NewRow["Rekening"],
      CatatanAmplop: nilai("catatanAmplop"),
      Tamu: tamu,
    };
  }

  // Undangan yang sudah dibuat tetapi fotonya belum selesai diunggah: kirim ulang melanjutkan, tidak membuat undangan baru
  let tertunda: { hasil: HasilBuat; data: NewRow; selesai: Set<string> } | null = null;

  async function postJson<T>(url: string, body: unknown, method = "POST"): Promise<ResponseBase<T>> {
    const res = await fetch(url, { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
    if (res.status === 413) throw new ErrorBisnis("Isian terlalu besar. Kurangi daftar tamu, lalu coba lagi.");
    if (!res.ok && res.headers.get("content-type")?.includes("json") !== true) throw new ErrorBisnis("Permintaan ditolak server. Muat ulang halaman, lalu coba lagi.");
    return res.json();
  }

  // Permintaan foto ke server: foto baru diunggah setelah disimpan, foto lama (mode ubah) dipertahankan
  function specFoto(): SpecFoto {
    const mempelai = (k: "Wanita" | "Pria") => fotoMempelai[k] ? "baru" as const : fotoLama[k] ? "tetap" as const : null;
    return { Wanita: mempelai("Wanita"), Pria: mempelai("Pria"), Galeri: galeri.map(g => g.blob ? "baru" as const : { Tetap: g.path! }) };
  }

  const teksKirim = ubah ? "Simpan perubahan" : "Buat undangan";

  function blobUntuk(nama: string): Blob | null {
    if (nama === "wanita") return fotoMempelai.Wanita;
    if (nama === "pria") return fotoMempelai.Pria;
    const m = /^galeri-(\d+)$/.exec(nama);
    return m ? galeri[Number(m[1]) - 1]?.blob ?? null : null;
  }

  async function unggahDanTerbitkan(t: NonNullable<typeof tertunda>) {
    const supabase = supabaseBrowser();
    const sisa = t.hasil.Unggah.filter(u => !t.selesai.has(u.Nama));
    let ke = t.selesai.size;
    for (const u of sisa) {
      tampil(`Mengunggah foto ${++ke} dari ${t.hasil.Unggah.length}...`);
      const blob = blobUntuk(u.Nama);
      if (!blob) throw new ErrorBisnis("Foto yang dipilih berubah. Muat ulang halaman, lalu buat undangan lagi.");
      const { error } = await supabase.storage.from(BUCKET_FOTO).uploadToSignedUrl(u.Path, u.Token, blob, { contentType: "image/jpeg" });
      if (error) throw new ErrorBisnis(`Foto gagal diunggah. Periksa koneksi, lalu tekan ${teksKirim} lagi untuk melanjutkan.`);
      t.selesai.add(u.Nama);
    }
    if (t.hasil.Unggah.length > 0) {
      tampil("Memeriksa foto...");
      const hasil = await postJson(`/api/undangan/${t.hasil.Slug}/terbit`, { KodeEdit: t.hasil.KodeEdit ?? ubah?.kodeEdit ?? null });
      if (hasil.Status !== STATUS_SUKSES) throw new ErrorBisnis(hasil.Message);
    }
  }

  on(form, "submit", async e => {
    e.preventDefault();
    const acara = daftarAcara.nilai(), rekening = daftarRekening.nilai(), tamu = bacaTamu();

    if (!tertunda) {
      const salah = periksa(acara, rekening, tamu);
      if (salah) {
        tampilEditor(true);
        tampil(salah.pesan);
        // Field di bagian akordeon yang tertutup tidak bisa difokus
        const bagian = salah.el.closest("details");
        if (bagian) bagian.open = true;
        salah.el.focus();
        return;
      }
    }
    if (!navigator.onLine) {
      tampil(ubah
        ? "Sedang offline. Simpan perubahan setelah tersambung ke internet; jangan tutup halaman ini."
        : "Sedang offline. Isian sudah tersimpan sebagai draf di perangkat ini; buat undangan setelah tersambung ke internet.");
      return;
    }

    if (!tertunda && !await Konfirmasi.tanya(ubah ? {
      judul: "Simpan perubahan?",
      teks: "Undangan langsung berubah untuk semua yang membuka link-nya. Alamat, RSVP, dan ucapan tetap.",
      tombol: "Ya, simpan",
    } : {
      judul: "Buat undangan sekarang?",
      teks: "Undangan langsung terbit dan bisa dibuka siapa pun yang punya link-nya.",
      tombol: "Ya, buat undangan",
    })) return;

    kirim.disabled = true;
    try {
      if (!tertunda) {
        const data = kumpulkanData(acara, rekening, tamu);
        tampil(ubah ? "Menyimpan perubahan..." : "Membuat undangan...");
        const hasil = ubah
          ? await postJson<HasilBuat>(`/api/undangan/${ubah.slug}`, { KodeEdit: ubah.kodeEdit, Data: data, Foto: specFoto() }, "PUT")
          : await postJson<HasilBuat>("/api/undangan", { Kode: kode, Data: data, Foto: specFoto() });
        if (hasil.Status !== STATUS_SUKSES || !hasil.Data) { tampil(hasil.Message); Konfirmasi.gagal(hasil.Message); return; }
        tertunda = { hasil: hasil.Data, data, selesai: new Set() };
      }
      await unggahDanTerbitkan(tertunda);
      const { hasil, data } = tertunda;
      tertunda = null;
      if (!ubah) hapusDraf();
      tampilHasil(hasil, data);
      Konfirmasi.sukses(ubah ? "Perubahan tersimpan." : "Undangan berhasil dibuat. Simpan link edit dan bagikan link undangannya.");
    } catch (err) {
      const pesan = err instanceof ErrorBisnis ? err.message : `${ubah ? "Perubahan gagal disimpan" : "Undangan gagal dibuat"}. Periksa koneksi, lalu coba lagi.`;
      tampil(pesan);
      Konfirmasi.gagal(pesan);
    } finally {
      kirim.disabled = false;
    }
  });

  // ---------- hasil ----------
  async function salin(btn: HTMLElement, teks: string) {
    const asli = btn.dataset.asli ??= btn.textContent ?? "";
    try {
      await navigator.clipboard.writeText(teks);
      btn.textContent = "Tersalin";
    } catch {
      btn.textContent = "Gagal menyalin";
    }
    setTimeout(() => { btn.textContent = asli; }, 1800);
  }

  function barisTamu(tamu: { Nama: string; Url: string }, pasangan: string) {
    const li = document.createElement("li");
    const nama = document.createElement("span");
    nama.textContent = tamu.Nama;
    const salinBtn = document.createElement("button");
    salinBtn.type = "button";
    salinBtn.className = "btn-ghost";
    salinBtn.textContent = "Salin link";
    salinBtn.setAttribute("aria-label", `Salin link untuk ${tamu.Nama}`);
    salinBtn.addEventListener("click", () => salin(salinBtn, tamu.Url));
    const wa = document.createElement("a");
    wa.className = "btn-ghost";
    wa.target = "_blank";
    wa.rel = "noopener";
    wa.textContent = "WhatsApp";
    wa.setAttribute("aria-label", `Kirim ke ${tamu.Nama} lewat WhatsApp`);
    wa.href = "https://wa.me/?text=" + encodeURIComponent(`Kepada ${tamu.Nama}, kami mengundang Anda ke pernikahan ${pasangan}: ${tamu.Url}`);
    li.append(nama, salinBtn, wa);
    return li;
  }

  function tampilHasil(hasil: HasilBuat, data: NewRow) {
    const pasangan = `${data.Wanita?.NamaPanggilan} & ${data.Pria?.NamaPanggilan}`;
    const url = $<HTMLAnchorElement>("hasilUrl");
    url.href = hasil.Url;
    url.textContent = hasil.Url;
    $<HTMLAnchorElement>("hasilBuka").href = hasil.Url;
    $("hasilLinkEdit").textContent = hasil.LinkEdit;
    $<HTMLAnchorElement>("hasilWa").href = "https://wa.me/?text=" + encodeURIComponent(`Undangan pernikahan ${pasangan}: ${hasil.Url}`);

    if (hasil.Tamu.length > 0) {
      $("hasilTamu").hidden = false;
      $("hasilTamuDaftar").replaceChildren(...hasil.Tamu.map(x => barisTamu(x, pasangan)));
      const semua = $("salinSemuaTamu");
      on(semua, "click", () => salin(semua, hasil.Tamu.map(x => `${x.Nama}: ${x.Url}`).join("\n")));
    }

    clearTimeout(timerPratinjau);
    aktif = false;
    $("buatRuang").hidden = true;
    $("buatUndangan").classList.remove("buat-lebar");
    const kotak = $("buatHasil");
    kotak.hidden = false;
    kotak.focus();
  }

  document.querySelectorAll<HTMLElement>("[data-salin]").forEach(btn => {
    on(btn, "click", () => salin(btn, $(btn.dataset.salin!).textContent ?? ""));
  });

  // ---------- pratinjau ----------
  // Halaman undangan dirender di browser dari isi form (tanpa disimpan). Dua iframe bergantian: versi baru dimuat
  // di iframe cadangan yang tersembunyi, diberi posisi gulir dan keadaan sampul yang sama, lalu ditukar,
  // supaya perubahan tidak terlihat sebagai muat ulang.
  // Foto belum diunggah: dokumen memakai path penanda, diganti di sini dengan URL blob foto pilihan.
  const statusPratinjau = $("pratinjauStatus");
  const [bingkaiA, bingkaiB] = $("pratinjau").querySelectorAll("iframe");
  let tampak = bingkaiA, cadangan = bingkaiB;
  let timerPratinjau: ReturnType<typeof setTimeout> | undefined, aktif = false, htmlTerakhir = "", versi = 0;
  let urlBlobTampak: string[] = [], urlBlobBaru: string[] = [];

  function jadwalPratinjau(jeda = JEDA_PRATINJAU) {
    if (!aktif) return;
    clearTimeout(timerPratinjau);
    timerPratinjau = setTimeout(muatPratinjau, jeda);
  }

  on(form, "input", () => jadwalPratinjau());
  on(form, "change", () => jadwalPratinjau());

  // Komponen IsiUndangan -> HTML. createRoot + flushSync di elemen lepas, dipanggil dari timer (bukan saat render React).
  function keHtml(dokumen: DokumenUndangan): string {
    const wadah = document.createElement("div");
    const root = createRoot(wadah);
    flushSync(() => root.render(createElement(IsiUndangan, {
      dokumen, templateKode: kode, slug: "pratinjau", namaTamu: null, ucapan: { Daftar: [], AdaLagi: false }, pratinjau: "form",
    })));
    const html = wadah.innerHTML;
    root.unmount();
    return html;
  }

  function dokumenHtml(isi: string) {
    return `<!DOCTYPE html><html lang="id"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">`
      + `<link rel="stylesheet" href="/undangan/css/${kode}.css"></head><body>${isi}<script src="/js/undangan.js"></script></body></html>`;
  }

  function muatPratinjau() {
    simpanIsian();
    const data = kumpulkanData(daftarAcara.nilai(), daftarRekening.nilai(), []);
    let html: string;
    try {
      const bersih = bersihkanInput(data, galeri.length, hariIniJakarta());
      const dokumen = susunDokumen(dokumenAwal, data, bersih, {
        // foto baru: penanda yang diganti URL blob; foto lama: path aslinya
        wanita: fotoMempelai.Wanita ? PATH_FOTO_PRATINJAU + "wanita" : fotoLama.Wanita,
        pria: fotoMempelai.Pria ? PATH_FOTO_PRATINJAU + "pria" : fotoLama.Pria,
        galeri: galeri.map((g, i) => g.blob ? `${PATH_FOTO_PRATINJAU}galeri-${i + 1}` : g.path!),
      });
      html = keHtml(dokumen);
    } catch (err) {
      statusPratinjau.textContent = err instanceof ErrorBisnis ? `Pratinjau belum diperbarui: ${err.message}` : "Pratinjau gagal dibuat. Muat ulang halaman, lalu coba lagi.";
      if (!(err instanceof ErrorBisnis)) console.error(err);
      return;
    }
    statusPratinjau.textContent = "";
    const k = html + fotoKunci();
    if (k === htmlTerakhir) return;
    htmlTerakhir = k;
    tampilkanPratinjau(dokumenHtml(gantiFoto(html)));
  }

  // Foto yang dipilih ikut menentukan apakah pratinjau berubah
  const idBlob = new WeakMap<Blob, number>();
  let nomorBlob = 0;
  function fotoKunci() {
    const id = (blob: Blob | null) => blob ? (idBlob.get(blob) ?? (idBlob.set(blob, ++nomorBlob), nomorBlob)) : 0;
    return [id(fotoMempelai.Wanita), fotoLama.Wanita, id(fotoMempelai.Pria), fotoLama.Pria, ...galeri.map(x => x.path ?? id(x.blob))].join(",");
  }

  function gantiFoto(html: string) {
    urlBlobBaru.forEach(url => URL.revokeObjectURL(url));
    urlBlobBaru = [];
    const ganti = (nama: string, blob: Blob) => {
      const url = URL.createObjectURL(blob);
      urlBlobBaru.push(url);
      html = html.replaceAll(`"${PATH_FOTO_PRATINJAU}${nama}"`, `"${url}"`);
    };
    if (fotoMempelai.Wanita) ganti("wanita", fotoMempelai.Wanita);
    if (fotoMempelai.Pria) ganti("pria", fotoMempelai.Pria);
    galeri.forEach((foto, i) => { if (foto.blob) ganti(`galeri-${i + 1}`, foto.blob); });
    return html;
  }

  const tunggu = (ms: number) => new Promise(selesai => setTimeout(selesai, ms));
  const frame = () => new Promise(selesai => requestAnimationFrame(() => requestAnimationFrame(selesai)));

  function tampilkanPratinjau(html: string) {
    const nomor = ++versi;
    cadangan.onload = async () => {
      const baru = cadangan.contentDocument, lama = tampak.contentDocument;
      // Abaikan load dari pengosongan iframe (srcdoc "") atau versi yang sudah tergantikan
      if (nomor !== versi || !baru?.getElementById("undangan")) return;
      const win = cadangan.contentWindow!;

      // Tanpa animasi selama penyesuaian, supaya hasil akhir langsung terlihat saat ditukar
      const instan = baru.createElement("style");
      instan.textContent = "*, *::before, *::after { transition: none !important; animation: none !important; }";
      baru.head.append(instan);

      const sampulLama = lama?.getElementById("sampul");
      if (sampulLama?.classList.contains("terbuka")) {
        baru.getElementById("sampul")?.classList.add("terbuka");
        baru.body.classList.remove("terkunci");
      }
      const munculLama = lama ? [...lama.querySelectorAll(".muncul")].map(el => el.classList.contains("tampak")) : [];
      baru.querySelectorAll(".muncul").forEach((el, i) => { if (munculLama[i]) el.classList.add("tampak"); });

      const gambar = [...baru.images].filter(img => !img.complete).map(img => img.decode().catch(() => {}));
      await Promise.race([Promise.all([baru.fonts?.ready, ...gambar]), tunggu(TUNGGU_ASET_MAKS)]);
      if (nomor !== versi) return;

      // Sedang mengedit: gulir ke bagian yang diedit (posisinya bisa bergeser karena isi berubah).
      // Selain itu posisi gulir lama, dibaca saat ditukar karena pengguna bisa menggulir selama versi baru dimuat.
      if (!(sasaran && gulirKe(baru, sasaran, false)))
        win.scrollTo(0, tampak.contentWindow?.scrollY ?? 0);
      await frame();
      if (nomor !== versi) return;

      tukar();
      instan.remove();
    };
    cadangan.srcdoc = html;
  }

  // ---------- gulir ke bagian yang diedit ----------
  // Field editor -> section pratinjau (data-tipe) dan, bila ada, elemen di dalamnya
  type Sasaran = { tipe: string; cari?: (sec: Element) => Element | null };
  const nth = (pilih: string, i: number) => (sec: Element) => sec.querySelectorAll(pilih)[i] ?? null;
  const PETA_SASARAN: [RegExp, (m: RegExpMatchArray) => Sasaran][] = [
    [/^(panggilan|lengkap|ayah|ibu|anak|foto)(Wanita|Pria)$/, m => ({ tipe: "mempelai", cari: sec => nth(".foto-bulat", m[2] === "Wanita" ? 0 : 1)(sec)?.parentElement ?? null })],
    [/^(zonaWaktu|tambahAcara)$/, () => ({ tipe: "acara" })],
    [/^lokasi/, () => ({ tipe: "acara", cari: sec => sec.querySelector(".lokasi") })],
    [/^telepon$/, () => ({ tipe: "penutup", cari: sec => sec.querySelector(".kontak") })],
    [/^(teks|terjemah)Penutup$/, () => ({ tipe: "penutup" })],
    [/^(teks|terjemah)Pembuka$/, () => ({ tipe: "pembuka" })],
    [/^fotoGaleri$/, () => ({ tipe: "galeri" })],
    [/^(tambahRekening|catatanAmplop)$/, () => ({ tipe: "amplop" })],
    [/^(tampilRsvp|batasRsvp|maksTamu|catatanRsvp)$/, () => ({ tipe: "rsvp" })],
    [/^tampilUcapan$/, () => ({ tipe: "ucapan" })],
  ];
  let sasaran: Sasaran | null = null;

  function sasaranDari(el: HTMLElement): Sasaran | null {
    const baris = el.closest(".buat-baris");
    if (baris?.parentElement?.id === "daftarAcara") {
      const i = [...baris.parentElement.children].indexOf(baris);
      return { tipe: "acara", cari: nth("li", i) };
    }
    if (baris?.parentElement?.id === "daftarRekening") return { tipe: "amplop" };
    for (const [pola, buat] of PETA_SASARAN) {
      const m = (el.id || "").match(pola);
      if (m) return buat(m);
    }
    return null;
  }

  // Tidak memakai scrollIntoView, karena ikut menggulir halaman di luar iframe.
  // Sampul yang masih tertutup dibuka dulu, karena halaman tidak bisa digulir selama terkunci.
  function gulirKe(doc: Document | null, s: Sasaran, halus: boolean) {
    const sec = doc?.querySelector(`[data-tipe="${s.tipe}"]`);
    if (!doc || !sec) return false;
    const target = s.cari?.(sec) ?? sec;
    const win = doc.defaultView!;
    const sampul = doc.getElementById("sampul");
    if (sampul && !sampul.classList.contains("terbuka")) {
      sampul.classList.add("terbuka");
      doc.body.classList.remove("terkunci");
    }
    const kotak = target.getBoundingClientRect();
    const ruangAtas = kotak.height < win.innerHeight ? (win.innerHeight - kotak.height) / 2 : 24;
    win.scrollTo({ top: Math.max(0, kotak.top + win.scrollY - ruangAtas), behavior: halus ? "smooth" : "instant" });
    return true;
  }

  on(form, "focusin", e => {
    sasaran = sasaranDari(e.target as HTMLElement);
    if (sasaran && aktif) gulirKe(tampak.contentDocument, sasaran, true);
  });
  // Bagian akordeon dibuka pengguna: bagian itu terlihat di editor, pratinjau bergulir ke section-nya.
  // Memakai klik pada summary, bukan event toggle, supaya atribut open bawaan saat halaman dimuat tidak ikut menggulir.
  on(form, "click", e => {
    const bagian = (e.target as HTMLElement).closest("summary")?.parentElement;
    if (bagian instanceof HTMLDetailsElement) requestAnimationFrame(() => bukaBagian(bagian));
  });

  function bukaBagian(bagian: HTMLDetailsElement) {
    if (!bagian.open) return;
    bagian.scrollIntoView({ block: "nearest" });
    const field = bagian.querySelector<HTMLElement>(".buat-bagian-isi input, .buat-bagian-isi select, .buat-bagian-isi textarea, .buat-bagian-isi button");
    const s = field && sasaranDari(field);
    if (s && aktif) gulirKe(tampak.contentDocument, s, true);
  }

  on(form, "focusout", e => {
    if (!form.contains(e.relatedTarget as Node | null)) sasaran = null;
  });

  function tukar() {
    [tampak, cadangan] = [cadangan, tampak];
    tampak.onload = null;
    cadangan.onload = null;
    tampak.classList.remove("cadangan");
    tampak.removeAttribute("aria-hidden");
    tampak.removeAttribute("tabindex");
    tampak.inert = false;
    cadangan.classList.add("cadangan");
    cadangan.setAttribute("aria-hidden", "true");
    cadangan.tabIndex = -1;
    cadangan.inert = true;
    // Foto versi lama dilepas setelah tidak tampil lagi
    urlBlobTampak.forEach(url => URL.revokeObjectURL(url));
    [urlBlobTampak, urlBlobBaru] = [urlBlobBaru, []];
    // Menghentikan skrip versi lama (hitung mundur) di iframe yang kini tersembunyi
    cadangan.srcdoc = "";
  }

  // ---------- editor ----------
  const tombolEditor = $<HTMLButtonElement>("tombolEditor"), ruang = $("buatRuang");

  function tampilEditor(lihat: boolean) {
    $("buatKartu").hidden = !lihat;
    ruang.classList.toggle("editor-tertutup", !lihat);
    tombolEditor.setAttribute("aria-expanded", String(lihat));
    tombolEditor.textContent = lihat ? "Sembunyikan editor" : "Tampilkan editor";
  }
  on(tombolEditor, "click", () => tampilEditor($("buatKartu").hidden));

  // ---------- draf ----------
  // Bentuk draf = data kirim (NewRow). Teks bawaan template disimpan null bila tidak diubah,
  // supaya draf tidak menimpa teks bawaan template lain.
  const TEKS_BAWAAN = { teksPembuka: "TeksPembuka", terjemahPembuka: "TerjemahPembuka", teksPenutup: "TeksPenutup", terjemahPenutup: "TerjemahPenutup", catatanAmplop: "CatatanAmplop" } as const;
  const FIELD_MEMPELAI = { panggilan: "NamaPanggilan", lengkap: "NamaLengkap", anak: "AnakKe", ayah: "NamaAyah", ibu: "NamaIbu" } as const;

  function simpanIsian() {
    // mode ubah tidak menimpa draf undangan baru di perangkat ini
    if (ubah) return;
    const data = kumpulkanData(daftarAcara.nilai(), daftarRekening.nilai(), bacaTamu());
    for (const [id, nama] of Object.entries(TEKS_BAWAAN)) {
      const el = $<HTMLTextAreaElement>(id);
      if (el.value === el.defaultValue) data[nama] = null;
    }
    if (!simpanDraf(data)) statusPratinjau.textContent = "Isian belum tersimpan di perangkat ini (penyimpanan penuh atau mode privat).";
  }

  // Tanggal lama bisa berbentuk 2027-06-12T00:00:00, input date butuh 2027-06-12
  const tanggal = (v: unknown) => v ? String(v).slice(0, 10) : "";

  function pulihkanDraf(d: NewRow) {
    const setel = (id: string, v: unknown) => { $<HTMLInputElement>(id).value = v == null ? "" : String(v); };
    for (const k of ["Wanita", "Pria"] as const)
      for (const [n, nama] of Object.entries(FIELD_MEMPELAI)) setel(n + k, d[k]?.[nama]);
    if (d.ZonaWaktu) setel("zonaWaktu", d.ZonaWaktu);
    setel("lokasiNama", d.Lokasi?.Nama);
    setel("lokasiAlamat", d.Lokasi?.Alamat);
    setel("lokasiPeta", d.Lokasi?.UrlPeta);
    setel("telepon", saringTelepon(d.Telepon ?? ""));
    for (const [id, nama] of Object.entries(TEKS_BAWAAN))
      if (d[nama] != null) setel(id, d[nama]);
    tampilRsvp.checked = !!d.TampilRsvp;
    $("isianRsvp").hidden = !tampilRsvp.checked;
    setel("batasRsvp", tanggal(d.BatasRsvp));
    setel("maksTamu", d.MaksTamu || 2);
    setel("catatanRsvp", d.CatatanRsvp);
    $("tampilUcapan").checked = !!d.TampilUcapan;
    setel("daftarTamu", (d.Tamu ?? []).join("\n"));
    $("jumlahTamu").textContent = String(bacaTamu().length);

    daftarAcara.kosongkan();
    (d.Acara ?? []).forEach(x => daftarAcara.tambah({
      Nama: x.Nama ?? "", Tanggal: tanggal(x.Tanggal), JamMulai: x.JamMulai ?? "", JamSelesai: x.JamSelesai ?? "", Tempat: x.Tempat ?? "", Utama: !!x.Utama,
    }));
    daftarRekening.kosongkan();
    (d.Rekening ?? []).forEach(x => daftarRekening.tambah({ Bank: x.Bank ?? "", Nomor: x.Nomor ?? "", AtasNama: x.AtasNama ?? "" }));
  }

  on($("mulaiUlang"), "click", async () => {
    if (!await Konfirmasi.tanya({
      judul: "Mulai dari awal?",
      teks: "Semua isian yang tersimpan dihapus dan tidak bisa dikembalikan. Foto yang sudah dipilih juga hilang.",
      tombol: "Ya, hapus isian",
      bahaya: true,
    })) return;
    clearTimeout(timerPratinjau);
    aktif = false;
    hapusDraf();
    location.reload();
  });

  // ---------- form singkat ----------
  const singkat = $<HTMLFormElement>("singkatForm"), singkatNotice = $("singkatNotice");

  function bukaRuang() {
    $("buatSingkat").hidden = true;
    $("buatTagline").textContent = "Pratinjau berubah mengikuti isi editor. Isian tersimpan otomatis di perangkat ini, kecuali foto.";
    $("buatUndangan").classList.add("buat-lebar");
    ruang.hidden = false;
    aktif = true;
    jadwalPratinjau(0);
  }

  on(singkat, "submit", e => {
    e.preventDefault();
    // Aturan dan bentuk draf sama dengan form data utama di beranda (lib/undangan/singkat.ts)
    const id: Record<keyof IsianSingkat, string> = {
      pria: "singkatPria", wanita: "singkatWanita", telepon: "singkatTelepon", tanggal: "singkatTanggal", jam: "singkatJam", lokasi: "singkatLokasi",
    };
    const isi = Object.fromEntries(Object.entries(id).map(([k, v]) => [k, $(v).value])) as unknown as IsianSingkat;
    const salah = periksaSingkat(isi);
    if (salah) {
      singkatNotice.hidden = false;
      singkatNotice.textContent = salah.pesan;
      $(id[salah.kolom]).focus();
      return;
    }
    pulihkanDraf(drafDariSingkat(isi));
    bukaRuang();
    tombolEditor.focus();
  });

  if (ubah) {
    // Mode ubah: editor diisi dari undangan tersimpan, tanpa form singkat dan tanpa draf perangkat
    pulihkanDraf(ubah.data);
    $("mulaiUlang").hidden = true;
    kirim.textContent = teksKirim;
    $("hasilJudul").textContent = "Perubahan tersimpan";
    $("hasilEdit").hidden = true;
    bukaRuang();
    $("buatTagline").textContent = "Pratinjau berubah mengikuti isi editor. Perubahan baru tampil di undangan setelah disimpan.";
  } else {
    // Sudah pernah mengisi data utama (di sini atau di beranda): langsung ke pratinjau dan editor
    const drafAwal = bacaDraf();
    if (drafAwal) {
      pulihkanDraf(drafAwal);
      bukaRuang();
    }
  }
  if (galeri.length > 0) gambarGaleri();

  return () => {
    ac.abort();
    clearTimeout(timerPratinjau);
    aktif = false;
    daftarAcara.kosongkan();
    daftarRekening.kosongkan();
    [...urlObjek, ...urlBlobTampak, ...urlBlobBaru, ...galeri.map(x => x.url)].forEach(url => URL.revokeObjectURL(url));
  };
}
