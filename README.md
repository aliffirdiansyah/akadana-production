# Inviora

Generator undangan pernikahan digital, disiapkan sebagai PWA.
Stack: Next.js 16 (App Router, TypeScript), Supabase (Postgres, Auth, Storage), deploy di Vercel.

## Fitur

- Katalog template (`/`), pratinjau isi contoh (`/contoh/{kode}`). Template aktif dengan `urutan` terendah gratis; sisanya wajib masuk.
- Form pembuatan (`/buat/{kode}`): form singkat, lalu editor + pratinjau langsung. Pratinjau dirender di browser, jadi tetap jalan offline.
- Draf isian tersimpan otomatis di `localStorage` perangkat (foto tidak ikut).
- Undangan publik `/u/{slug}` dengan sapaan tamu `?to=Nama`, hitung mundur, RSVP, ucapan, amplop digital.
- Akun (Supabase Auth): `/masuk`, `/daftar`, dasbor `/saya` berisi undangan milik pengguna dengan jumlah RSVP dan ucapan.
- PWA: manifest, ikon (termasuk maskable), service worker (`public/sw.js`) dengan halaman `/offline`.

## Menjalankan lokal

```
npm install
cp .env.example .env.local     # isi dari Supabase Dashboard > Project Settings > API
npm run dev                    # http://localhost:3000
```

Service worker tidak dipasang di `localhost:3000` supaya tidak mengganggu hot reload. Untuk mencoba PWA:
`npm run build && npm start`, atau set `localStorage.inviora_sw_dev = "1"`.

## Menyiapkan Supabase

1. Buat project di Supabase (region Singapore, dekat region Vercel `sin1`).
2. Jalankan migration berurutan, lewat SQL Editor atau Supabase CLI (`supabase link` lalu `supabase db push`):
   - `supabase/migrations/20261117000001_skema.sql`: tabel, RLS, dan bucket Storage `undangan-foto`.
   - `supabase/migrations/20261117000002_seed_template.sql`: lima template + undangan contoh `/u/contoh-alif-putri`.
3. Authentication > URL Configuration: isi **Site URL** dengan domain produksi, dan tambahkan
   `https://<domain>/auth/confirm` serta `http://localhost:3000/auth/confirm` ke **Redirect URLs**.
4. Bila konfirmasi email aktif, link di email mengarah ke `/auth/confirm`, yang memasang session lalu kembali ke halaman asal.

Semua tabel memakai RLS tanpa policy: key anon tidak bisa membaca atau menulis tabel. Server mengakses data dengan
`SUPABASE_SERVICE_ROLE_KEY`, jadi key itu wajib rahasia (tanpa awalan `NEXT_PUBLIC_`).

## Deploy ke Vercel

1. Push repo ke GitHub, lalu Import Project di Vercel (framework Next.js terdeteksi otomatis, region di `vercel.json`).
2. Environment Variables (Production dan Preview):
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY` (Sensitive)
3. Deploy. `NEXT_PUBLIC_SUPABASE_URL` dibaca saat build untuk rewrite `/foto/*`, jadi redeploy setelah mengubahnya.

## Catatan

- Foto tidak lewat function Vercel (batas body 4,5 MB): `/api/undangan` membuat undangan berstatus Draf dan signed upload URL,
  browser mengunggah langsung ke Storage, lalu `/api/undangan/{slug}/terbit` memeriksa isi file dan menerbitkannya.
- Tidak ada rate limit di aplikasi (rate limiter in-memory tidak berlaku di serverless).
  Pasang aturan rate limit di Vercel Firewall untuk `/api/u/*` dan `/api/undangan`.
- Undangan Draf yang fotonya tidak pernah selesai diunggah tetap tersimpan; belum ada pembersihan otomatis.
