-- Isian form pembuatan disimpan bersama undangan, supaya undangan bisa diubah lagi lewat editor yang sama (/edit/{slug}).
-- isian: { "Data": NewRow (src/lib/undangan/susun.ts), "Foto": { "Wanita": path|null, "Pria": path|null, "Galeri": [path] } }
-- path foto berbentuk /foto/{slug}/{kunci}.jpg. NULL untuk undangan lama (sebelum kolom ini ada): tidak bisa diubah lewat editor.
ALTER TABLE public.t_undangan ADD COLUMN IF NOT EXISTS isian jsonb;
