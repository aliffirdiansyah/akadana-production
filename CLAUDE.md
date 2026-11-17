@AGENTS.md

# CLAUDE.md

Inviora: generator undangan pernikahan digital (Next.js 16 + Supabase, untuk Vercel dan sebagai PWA. Identifier, pesan error, dan teks UI berbahasa Indonesia; pertahankan.
Cara menjalankan, setup Supabase, dan deploy: `README.md`.

## Perintah

```
npm run dev        # http://localhost:3000
npm run build      # wajib lolos sebelum selesai
npm run lint
npm run typecheck
npm run ikon       # buat ulang ikon PWA dari public/img/logo/inviora-ikon.svg
```

Tidak ada test project. Next.js 16 berbeda dari versi lama (mis. `src/proxy.ts` menggantikan middleware, `params` berupa Promise):
baca `node_modules/next/dist/docs/` sebelum memakai API Next.

## Struktur

- `src/lib/undangan/`: semua aturan bisnis.
  - `dokumen.ts`: tipe dan validasi dokumen undangan (jsonb `t_undangan.dokumen` / `m_template.dokumen_awal`). Section = tipe + varian.
  - `susun.ts`: form (`NewRow`, PascalCase) -> dokumen. Fungsi murni, dipakai server (simpan) dan browser (pratinjau). Perubahan aturan cukup di sini.
  - `data.ts` (`server-only`): akses Supabase dengan service role. Route handler dan page hanya memanggil fungsi di sini.
  - Error bisnis: `ErrorBisnis` / `ErrorTidakAda` dengan pesan Indonesia (`konstanta.ts`). `lib/api.ts` mengubahnya jadi `ResponseBase` (`Status`, `Message`, `Data`).
- Waktu bisnis: tanggal Asia/Jakarta (`lib/waktu.ts`), bukan zona server.
- Route group `(situs)` (navbar, `site.css` + `situs.css` + `aplikasi.css`) dan `(undangan)` (halaman undangan polos + CSS template). Keduanya root layout sendiri.
- Halaman undangan: `components/undangan/IsiUndangan.tsx` + `Section.tsx`, komponen murni tanpa hooks. Dirender server di `/u/[slug]` dan `/contoh/[kode]`, dan di browser untuk pratinjau (`buat/[kode]/editor.ts`, `createRoot` + `flushSync`).
  - Perilaku halaman (sampul, hitung mundur, RSVP, ucapan, salin rekening) ada di `public/js/undangan.js` (vanilla). Di halaman React skrip dimuat setelah hydration oleh `SkripUndangan.tsx`; jangan ubah jadi `<script defer>`, karena undangan.js mengubah DOM dan memicu hydration mismatch.
- Template baru butuh: baris `m_template` (migration), `public/undangan/css/{kode}.css`, dan simbol di `components/undangan/SimbolTemplate.tsx`. Pasangan tipe + varian section baru: `INFO_SECTION` di `dokumen.ts` + komponen di `Section.tsx`.
- Form pembuatan: markup statis di `FormBuat.tsx`, perilaku imperatif di `editor.ts` (port `Buat.js`). Draf di `localStorage` (`lib/draf.ts`).
- Konfirmasi: setiap aksi yang menyimpan/mengubah/menghapus bertanya dulu lewat SweetAlert2 (`lib/konfirmasi.ts` di React, `public/js/konfirmasi.js` di halaman undangan; API sama, ubah keduanya). Draf otomatis satu-satunya pengecualian.
- CSS: `src/styles/site.css` (token warna) dan `situs.css` (bagian katalog/editor/navbar/akun) disalin dari versi .NET. Tambahan baru di `aplikasi.css` memakai token yang ada.

## Data dan keamanan

- Skema di `supabase/migrations/`; perubahan skema = migration baru, jangan ubah migration yang sudah jalan di produksi.
- RLS aktif tanpa policy di semua tabel: hanya server (service role, `lib/supabase/admin.ts`) yang mengakses tabel. Jangan pakai service role di kode `"use client"`.
- Auth: Supabase Auth, hanya Google (OAuth PKCE): `/masuk` -> Google -> `/auth/callback` (tukar kode jadi session). Tidak ada form email/password; `/daftar` mengarah ke `/masuk`. Server membaca pengguna dengan `getPengguna()` (`lib/supabase/server.ts`, memverifikasi ke server Auth). `src/proxy.ts` memperbarui session.
- POST API mengecek header `Origin` sama dengan host (`asalSah`), pengganti antiforgery token.
- Foto: Storage bucket `undangan-foto` (publik baca, maks 2 MB, JPG/PNG/WebP), path `{slug}/{kunci}.jpg`, kunci 32 hex acak. Dokumen menyimpan `/foto/...`, di-rewrite ke Storage di `next.config.ts`. Unggah lewat signed upload URL, lalu `terbit` memeriksa magic bytes.
- Kode edit hanya dikembalikan sekali; DB menyimpan SHA-256-nya.
- Jangan menaruh kredensial di file yang di-commit; `.env.local` di-ignore, `.env.example` hanya berisi nama variabel.

## PWA

`src/app/manifest.ts`, ikon di `public/ikon/`, service worker `public/sw.js` (didaftarkan `public/js/daftar-sw.js`). Naikkan `VERSI` di `sw.js` bila aturan cache berubah. API, `/auth/*`, dan `/saya` tidak pernah disimpan cache.
