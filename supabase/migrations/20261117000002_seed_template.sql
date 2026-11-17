-- Lima template undangan Inviora. Semua nama, tanggal, alamat dan rekening di isi contoh fiktif.
-- Template aktif dengan urutan terendah (jawa-01) gratis; sisanya wajib login. Aman dijalankan ulang: isi template ditimpa.
-- CSS tiap template: public/undangan/css/{kode}.css. Simbol SVG: src/components/undangan/SimbolTemplate.tsx.
BEGIN;

INSERT INTO public.m_template (kode, nama, urutan, aktif, dokumen_awal) VALUES ('jawa-01', 'Adat Jawa — Sogan & Prada', 1, true, $json$
{
  "versi": 1,
  "meta": {
    "judul": "Pawiwahan Alif & Putri",
    "deskripsi": "Sabtu, 12 Juni 2027 · Yogyakarta"
  },
  "section": [
    { "id": "s1", "tipe": "sampul", "varian": "gunungan-tengah", "tampil": true, "isi": {
        "label": "Undangan Pawiwahan",
        "nama1": "Alif",
        "nama2": "Putri",
        "teksKepada": "Kagem / Kepada Yth.",
        "tamuDefault": "Bapak/Ibu/Saudara/i",
        "tombolBuka": "Buka Undangan"
    } },
    { "id": "s2", "tipe": "pembuka", "varian": "basa-krama", "tampil": true, "isi": {
        "label": "Sugeng Rawuh",
        "teks": "Kanthi nyuwun sih rahmat saha ridhaning Gusti Ingkang Maha Kuwasa, kula sakulawarga badhe mahargya dhaup putra-putri kula.",
        "terjemah": "Dengan memohon rahmat dan ridha Tuhan Yang Maha Kuasa, kami sekeluarga bermaksud menyelenggarakan pernikahan putra-putri kami."
    } },
    { "id": "s3", "tipe": "mempelai", "varian": "tumpuk", "tampil": true, "isi": {
        "orang": [
          { "label": "Mempelai Putri", "namaPanggilan": "Putri", "namaLengkap": "Putri Arum Prameswari, S.Ds.",
            "keterangan": "Putri kapisan saking\nBapak Hadi Santosa & Ibu Retno Wulandari", "foto": null },
          { "label": "Mempelai Kakung", "namaPanggilan": "Alif", "namaLengkap": "Alif Adi Wicaksono, S.T.",
            "keterangan": "Putra kaping kalih saking\nBapak Suryo Pranoto & Ibu Endang Lestari", "foto": null }
        ]
    } },
    { "id": "s4", "tipe": "hitung-mundur", "varian": "standar", "tampil": true, "isi": {
        "label": "Ngetang Dinten",
        "judul": "Sabtu, 12 Juni 2027",
        "mulai": "2027-06-12T08:00:00+07:00",
        "selesai": "2027-06-12T14:00:00+07:00",
        "lokasiKalender": "Pendapa Griya Laras, Yogyakarta"
    } },
    { "id": "s5", "tipe": "acara", "varian": "lini-masa", "tampil": true, "isi": {
        "label": "Rantaman Adicara",
        "judul": "Susunan Acara",
        "daftar": [
          { "nama": "Siraman", "waktu": "Jumat, 11 Juni 2027 · 09.00 WIB", "tempat": "Kediaman mempelai putri", "utama": false },
          { "nama": "Midodareni", "waktu": "Jumat, 11 Juni 2027 · 19.00 WIB", "tempat": "Kediaman mempelai putri", "utama": false },
          { "nama": "Ijab Kabul", "waktu": "Sabtu, 12 Juni 2027 · 08.00 WIB", "tempat": "Pendapa Griya Laras", "utama": true },
          { "nama": "Panggih & Resepsi", "waktu": "Sabtu, 12 Juni 2027 · 11.00–14.00 WIB", "tempat": "Pendapa Griya Laras", "utama": true }
        ],
        "lokasi": {
          "label": "Papan Pahargyan",
          "nama": "Pendapa Griya Laras",
          "alamat": "Jl. Contoh Kencana No. 12, Kotagede, Yogyakarta",
          "urlPeta": "https://maps.google.com/?q=Kotagede+Yogyakarta"
        }
    } },
    { "id": "s6", "tipe": "galeri", "varian": "grid", "tampil": true, "isi": {
        "label": "Pigura Katresnan",
        "judul": "Galeri",
        "foto": []
    } },
    { "id": "s7", "tipe": "rsvp", "varian": "standar", "tampil": true, "isi": {
        "label": "Konfirmasi Rawuh",
        "judul": "RSVP",
        "catatan": "Mohon konfirmasi kehadiran paling lambat 5 Juni 2027.",
        "batasTanggal": "2027-06-05",
        "maksTamu": 4
    } },
    { "id": "s8", "tipe": "ucapan", "varian": "standar", "tampil": true, "isi": {
        "label": "Pangestu",
        "judul": "Ucapan & Doa"
    } },
    { "id": "s9", "tipe": "amplop", "varian": "kartu", "tampil": true, "isi": {
        "label": "Tanda Kasih",
        "judul": "Amplop Digital",
        "catatan": "Doa restu Anda sudah lebih dari cukup. Bila berkenan memberi tanda kasih, dapat melalui:",
        "rekening": [
          { "bank": "BANK CONTOH", "nomor": "1234567890", "atasNama": "Putri Arum Prameswari" }
        ]
    } },
    { "id": "s10", "tipe": "penutup", "varian": "gunungan", "tampil": true, "isi": {
        "teks": "Mugi rawuh saha pangestu panjenengan dados pepadhang tumrap putra-putri kula.",
        "terjemah": "Kehadiran dan doa restu Anda menjadi penerang bagi putra-putri kami.",
        "label": "Matur Nuwun",
        "nama": "Alif & Putri",
        "keluarga": "Kulawarga Bapak Hadi Santosa\n& Kulawarga Bapak Suryo Pranoto"
    } }
  ]
}
$json$::jsonb)
ON CONFLICT (kode) DO UPDATE SET nama = EXCLUDED.nama, urutan = EXCLUDED.urutan, dokumen_awal = EXCLUDED.dokumen_awal;

INSERT INTO public.m_template (kode, nama, urutan, aktif, dokumen_awal)
SELECT baru.kode, baru.nama, baru.urutan, true, sumber.dokumen_awal
FROM public.m_template sumber
CROSS JOIN (VALUES
    ('jawa-02', 'Adat Jawa — Hijau Sirih & Prada', 2),
    ('jawa-03', 'Adat Jawa — Marun & Prada', 3)
) AS baru (kode, nama, urutan)
WHERE sumber.kode = 'jawa-01'
ON CONFLICT (kode) DO UPDATE SET nama = EXCLUDED.nama, urutan = EXCLUDED.urutan, dokumen_awal = EXCLUDED.dokumen_awal;

INSERT INTO public.m_template (kode, nama, urutan, aktif, dokumen_awal) VALUES ('modern-01', 'Modern Minimalis', 4, true, $json$
{
  "versi": 1,
  "meta": {
    "judul": "The Wedding of Alif & Putri",
    "deskripsi": "Sabtu, 12 Juni 2027 · Jakarta"
  },
  "section": [
    { "id": "s1", "tipe": "sampul", "varian": "hias", "tampil": true, "isi": {
        "label": "The Wedding of",
        "nama1": "Alif",
        "nama2": "Putri",
        "teksKepada": "Kepada Yth.",
        "tamuDefault": "Bapak/Ibu/Saudara/i",
        "tombolBuka": "Buka Undangan"
    } },
    { "id": "s2", "tipe": "pembuka", "varian": "hias", "tampil": true, "isi": {
        "label": "Undangan Pernikahan",
        "teks": "Dengan penuh rasa syukur, kami mengundang Anda untuk hadir dan berbagi kebahagiaan di hari pernikahan kami.",
        "terjemah": null
    } },
    { "id": "s3", "tipe": "mempelai", "varian": "tumpuk", "tampil": true, "isi": {
        "orang": [
          { "label": "Mempelai Wanita", "namaPanggilan": "Putri", "namaLengkap": "Putri Maharani, S.E.",
            "keterangan": "Putri pertama dari\nBapak Contoh Satu & Ibu Contoh Dua", "foto": null },
          { "label": "Mempelai Pria", "namaPanggilan": "Alif", "namaLengkap": "Alif Pratama, S.Kom.",
            "keterangan": "Putra kedua dari\nBapak Contoh Tiga & Ibu Contoh Empat", "foto": null }
        ]
    } },
    { "id": "s4", "tipe": "hitung-mundur", "varian": "ringkas", "tampil": true, "isi": {
        "label": "Menuju Hari Bahagia",
        "judul": "Sabtu, 12 Juni 2027",
        "mulai": "2027-06-12T10:00:00+07:00",
        "selesai": "2027-06-12T14:00:00+07:00",
        "lokasiKalender": "Aula Contoh, Jakarta"
    } },
    { "id": "s5", "tipe": "acara", "varian": "lini-masa", "tampil": true, "isi": {
        "label": "Rangkaian Acara",
        "judul": "Susunan Acara",
        "daftar": [
          { "nama": "Akad Nikah", "waktu": "Sabtu, 12 Juni 2027 · 10.00 WIB", "tempat": "Aula Contoh", "utama": true },
          { "nama": "Resepsi", "waktu": "Sabtu, 12 Juni 2027 · 12.00–14.00 WIB", "tempat": "Aula Contoh", "utama": true }
        ],
        "lokasi": {
          "label": "Lokasi",
          "nama": "Aula Contoh",
          "alamat": "Jl. Contoh Raya No. 1, Jakarta",
          "urlPeta": "https://maps.google.com/?q=Jakarta"
        }
    } },
    { "id": "s6", "tipe": "galeri", "varian": "grid", "tampil": true, "isi": {
        "label": "Momen Kami",
        "judul": "Galeri",
        "foto": []
    } },
    { "id": "s7", "tipe": "rsvp", "varian": "standar", "tampil": true, "isi": {
        "label": "Konfirmasi Kehadiran",
        "judul": "RSVP",
        "catatan": "Mohon konfirmasi kehadiran paling lambat 5 Juni 2027.",
        "batasTanggal": "2027-06-05",
        "maksTamu": 4
    } },
    { "id": "s8", "tipe": "ucapan", "varian": "standar", "tampil": true, "isi": {
        "label": "Doa & Harapan",
        "judul": "Kirim Ucapan"
    } },
    { "id": "s9", "tipe": "amplop", "varian": "kartu", "tampil": true, "isi": {
        "label": "Tanda Kasih",
        "judul": "Amplop Digital",
        "catatan": "Doa restu Anda sudah lebih dari cukup. Bila berkenan memberi tanda kasih, dapat melalui:",
        "rekening": [
          { "bank": "BANK CONTOH", "nomor": "1234567890", "atasNama": "Putri Maharani" }
        ]
    } },
    { "id": "s10", "tipe": "penutup", "varian": "hias", "tampil": true, "isi": {
        "teks": "Kehadiran dan doa restu Anda adalah hadiah terindah bagi kami.",
        "terjemah": null,
        "label": "Terima Kasih",
        "nama": "Alif & Putri",
        "keluarga": "Keluarga Bapak Contoh Satu\n& Keluarga Bapak Contoh Tiga"
    } }
  ]
}
$json$::jsonb)
ON CONFLICT (kode) DO UPDATE SET nama = EXCLUDED.nama, urutan = EXCLUDED.urutan, dokumen_awal = EXCLUDED.dokumen_awal;
INSERT INTO public.m_template (kode, nama, urutan, aktif, dokumen_awal) VALUES ('islami-01', 'Islami — Zamrud & Emas', 5, true, $json$
{
  "versi": 1,
  "meta": {
    "judul": "Walimatul 'Ursy Alif & Putri",
    "deskripsi": "Sabtu, 12 Juni 2027 · Bandung"
  },
  "section": [
    { "id": "s1", "tipe": "sampul", "varian": "hias", "tampil": true, "isi": {
        "label": "Walimatul 'Ursy",
        "nama1": "Alif",
        "nama2": "Putri",
        "teksKepada": "Kepada Yth.",
        "tamuDefault": "Bapak/Ibu/Saudara/i",
        "tombolBuka": "Buka Undangan"
    } },
    { "id": "s2", "tipe": "pembuka", "varian": "hias", "tampil": true, "isi": {
        "label": "Assalamu'alaikum Wr. Wb.",
        "teks": "Dengan memohon rahmat dan ridha Allah SWT, kami bermaksud menyelenggarakan pernikahan putra-putri kami.",
        "terjemah": "\"Dan di antara tanda-tanda (kebesaran)-Nya ialah Dia menciptakan pasangan-pasangan untukmu dari jenismu sendiri, agar kamu cenderung dan merasa tenteram kepadanya, dan Dia menjadikan di antara kamu rasa kasih dan sayang.\" (QS. Ar-Rum: 21)"
    } },
    { "id": "s3", "tipe": "mempelai", "varian": "tumpuk", "tampil": true, "isi": {
        "orang": [
          { "label": "Mempelai Wanita", "namaPanggilan": "Putri", "namaLengkap": "Putri Nur Rahmah, S.Pd.",
            "keterangan": "Putri pertama dari\nBapak Contoh Satu & Ibu Contoh Dua", "foto": null },
          { "label": "Mempelai Pria", "namaPanggilan": "Alif", "namaLengkap": "Muhammad Alif Hidayat, S.T.",
            "keterangan": "Putra kedua dari\nBapak Contoh Tiga & Ibu Contoh Empat", "foto": null }
        ]
    } },
    { "id": "s4", "tipe": "hitung-mundur", "varian": "ringkas", "tampil": true, "isi": {
        "label": "Menuju Hari Bahagia",
        "judul": "Sabtu, 12 Juni 2027",
        "mulai": "2027-06-12T08:00:00+07:00",
        "selesai": "2027-06-12T13:00:00+07:00",
        "lokasiKalender": "Masjid Contoh, Bandung"
    } },
    { "id": "s5", "tipe": "acara", "varian": "lini-masa", "tampil": true, "isi": {
        "label": "Rangkaian Acara",
        "judul": "Susunan Acara",
        "daftar": [
          { "nama": "Akad Nikah", "waktu": "Sabtu, 12 Juni 2027 · 08.00 WIB", "tempat": "Masjid Contoh", "utama": true },
          { "nama": "Walimah", "waktu": "Sabtu, 12 Juni 2027 · 11.00–13.00 WIB", "tempat": "Aula Contoh", "utama": true }
        ],
        "lokasi": {
          "label": "Lokasi",
          "nama": "Masjid Contoh",
          "alamat": "Jl. Contoh Raya No. 1, Bandung",
          "urlPeta": "https://maps.google.com/?q=Bandung"
        }
    } },
    { "id": "s6", "tipe": "galeri", "varian": "grid", "tampil": true, "isi": {
        "label": "Momen Kami",
        "judul": "Galeri",
        "foto": []
    } },
    { "id": "s7", "tipe": "rsvp", "varian": "standar", "tampil": true, "isi": {
        "label": "Konfirmasi Kehadiran",
        "judul": "RSVP",
        "catatan": "Mohon konfirmasi kehadiran paling lambat 5 Juni 2027.",
        "batasTanggal": "2027-06-05",
        "maksTamu": 4
    } },
    { "id": "s8", "tipe": "ucapan", "varian": "standar", "tampil": true, "isi": {
        "label": "Doa & Harapan",
        "judul": "Kirim Ucapan"
    } },
    { "id": "s9", "tipe": "amplop", "varian": "kartu", "tampil": true, "isi": {
        "label": "Tanda Kasih",
        "judul": "Amplop Digital",
        "catatan": "Doa restu Anda sudah lebih dari cukup. Bila berkenan memberi tanda kasih, dapat melalui:",
        "rekening": [
          { "bank": "BANK CONTOH", "nomor": "1234567890", "atasNama": "Putri Nur Rahmah" }
        ]
    } },
    { "id": "s10", "tipe": "penutup", "varian": "hias", "tampil": true, "isi": {
        "teks": "Merupakan suatu kehormatan dan kebahagiaan bagi kami apabila Bapak/Ibu/Saudara/i berkenan hadir dan memberikan doa restu.",
        "terjemah": "Wassalamu'alaikum Wr. Wb.",
        "label": "Jazakumullah Khairan",
        "nama": "Alif & Putri",
        "keluarga": "Keluarga Bapak Contoh Satu\n& Keluarga Bapak Contoh Tiga"
    } }
  ]
}
$json$::jsonb)
ON CONFLICT (kode) DO UPDATE SET nama = EXCLUDED.nama, urutan = EXCLUDED.urutan, dokumen_awal = EXCLUDED.dokumen_awal;

-- Undangan contoh di /u/contoh-alif-putri. Kode edit diacak: tidak ada yang perlu mengubahnya.
-- Undangan contoh lama (nama Sekar & Bimo) dihapus beserta ucapannya.
DELETE FROM public.t_undangan WHERE slug = 'contoh-sekar-bimo';

INSERT INTO public.t_undangan (slug, kode_edit_hash, template_kode, dokumen, status)
SELECT 'contoh-alif-putri', encode(extensions.digest(gen_random_uuid()::text, 'sha256'), 'hex'), kode, dokumen_awal, 2
FROM public.m_template WHERE kode = 'jawa-01'
ON CONFLICT (slug) DO UPDATE SET dokumen = EXCLUDED.dokumen, upd_date = now();

INSERT INTO public.t_ucapan (undangan_id, nama, pesan, ins_date)
SELECT id, 'Mbak Laras', 'Sugeng nempuh hidup baru, mugi dados keluarga ingkang sakinah, mawaddah, warahmah.', now() - interval '2 days'
FROM public.t_undangan WHERE slug = 'contoh-alif-putri'
AND NOT EXISTS (SELECT 1 FROM public.t_ucapan u JOIN public.t_undangan t ON t.id = u.undangan_id WHERE t.slug = 'contoh-alif-putri');

COMMIT;
