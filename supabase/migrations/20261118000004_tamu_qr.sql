-- Daftar tamu dengan nomor WhatsApp dan kode unik per tamu (link pribadi /u/{slug}?t={kode} + QR di undangan).
-- kode: 32 hex acak, rahasia milik tamu; QR berisi link pribadinya. Kolom hadir disiapkan untuk buku tamu digital.
ALTER TABLE public.t_undangan_tamu
    ADD COLUMN IF NOT EXISTS kode         varchar(32),
    ADD COLUMN IF NOT EXISTS telepon      varchar(16),
    ADD COLUMN IF NOT EXISTS dikirim_pada timestamptz,
    ADD COLUMN IF NOT EXISTS hadir_pada   timestamptz,
    ADD COLUMN IF NOT EXISTS jumlah_hadir integer;

-- Tamu lama (sebelum kolom ini ada) mendapat kode juga
UPDATE public.t_undangan_tamu SET kode = replace(gen_random_uuid()::text, '-', '') WHERE kode IS NULL;

ALTER TABLE public.t_undangan_tamu ALTER COLUMN kode SET NOT NULL;
ALTER TABLE public.t_undangan_tamu ALTER COLUMN kode SET DEFAULT replace(gen_random_uuid()::text, '-', '');
CREATE UNIQUE INDEX IF NOT EXISTS uq_undangan_tamu_kode ON public.t_undangan_tamu (kode);
ALTER TABLE public.t_undangan_tamu DROP CONSTRAINT IF EXISTS ck_undangan_tamu_telepon;
ALTER TABLE public.t_undangan_tamu ADD CONSTRAINT ck_undangan_tamu_telepon CHECK (telepon IS NULL OR telepon ~ '^628[0-9]{7,12}$');
