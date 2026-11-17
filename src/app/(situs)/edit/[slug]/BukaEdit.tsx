"use client";
// Membuka editor lewat link edit: kode diambil dari #kode=... (tidak terkirim ke server lewat URL), lalu dihapus dari
// address bar dan disimpan di sessionStorage tab ini. Tanpa kode: pengguna bisa menempel link edit atau masuk dengan Google.
import Link from "next/link";
import { useEffect, useState } from "react";
import type { DokumenUndangan } from "@/lib/undangan/dokumen";
import type { IsiAwal, TemplateKartu } from "@/lib/undangan/susun";
import { STATUS_SUKSES, type IsianUndangan, type ResponseBase } from "@/lib/undangan/tipe";
import { FormBuat } from "../../buat/[kode]/FormBuat";

interface DataEdit {
  Isian: IsianUndangan;
  Kartu: TemplateKartu;
  DokumenAwal: DokumenUndangan;
  Awal: IsiAwal;
}

const kunciSesi = (slug: string) => `akadana_kode_edit_${slug}`;

// Kode dari "#kode=..." atau dari link edit lengkap yang ditempel
function ambilKode(teks: string): string | null {
  const m = /(?:^|[#&?])kode=([A-Za-z0-9_-]{20,})/.exec(teks) ?? /^([A-Za-z0-9_-]{20,})$/.exec(teks.trim());
  return m ? m[1] : null;
}

export function BukaEdit({ slug, sudahMasuk, hariIni }: { slug: string; sudahMasuk: boolean; hariIni: string }) {
  const [data, setData] = useState<{ edit: DataEdit; kode: string } | null>(null);
  const [pesan, setPesan] = useState<string | null>(null);
  const [sibuk, setSibuk] = useState(false);
  const [tempel, setTempel] = useState("");

  async function buka(kode: string) {
    setSibuk(true);
    setPesan(null);
    try {
      const res = await fetch(`/api/undangan/${slug}/isian`, {
        method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ KodeEdit: kode }),
      });
      const hasil = (await res.json()) as ResponseBase<DataEdit>;
      if (hasil.Status !== STATUS_SUKSES || !hasil.Data) {
        try { sessionStorage.removeItem(kunciSesi(slug)); } catch { /* abaikan */ }
        setPesan(hasil.Message || "Link edit tidak cocok dengan undangan ini.");
        return;
      }
      try { sessionStorage.setItem(kunciSesi(slug), kode); } catch { /* abaikan */ }
      setData({ edit: hasil.Data, kode });
    } catch {
      setPesan("Tidak bisa terhubung. Periksa koneksi, lalu coba lagi.");
    } finally {
      setSibuk(false);
    }
  }

  useEffect(() => {
    let kode = ambilKode(location.hash);
    if (kode) history.replaceState(null, "", location.pathname + location.search);
    else try { kode = sessionStorage.getItem(kunciSesi(slug)); } catch { kode = null; }
    // eslint-disable-next-line react-hooks/set-state-in-effect -- membaca hash hanya bisa setelah mount
    if (kode) buka(kode);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [slug]);

  if (data) {
    const { edit, kode } = data;
    return (
      <FormBuat kartu={edit.Kartu} dokumenAwal={edit.DokumenAwal} awal={edit.Awal} hariIni={hariIni}
        ubah={{ slug: edit.Isian.Slug, data: edit.Isian.Data, foto: edit.Isian.Foto, kodeEdit: kode }} />
    );
  }

  return (
    <main className="wrap akun-masuk">
      <div className="card akun-kartu">
        <h1>Ubah undangan</h1>
        <p className="akun-hint">Buka lewat link edit yang didapat saat undangan dibuat, atau tempel link itu di sini.</p>
        {pesan && <p className="empty" role="alert">{pesan}</p>}
        <form onSubmit={e => {
          e.preventDefault();
          const kode = ambilKode(tempel);
          if (!kode) { setPesan("Tempel link edit lengkap, misalnya https://.../edit/nama-undangan#kode=..."); return; }
          buka(kode);
        }}>
          <div className="field">
            <label className="lbl" htmlFor="linkEdit">Link edit</label>
            <input id="linkEdit" type="text" autoComplete="off" value={tempel} onChange={e => setTempel(e.target.value)} placeholder="https://.../edit/...#kode=..." />
          </div>
          <button type="submit" className="btn" disabled={sibuk}>{sibuk ? "Membuka..." : "Buka editor"}</button>
        </form>
        {!sudahMasuk && (
          <p className="akun-alih">Membuat undangan saat masuk dengan Google? <Link href={`/masuk?returnUrl=${encodeURIComponent(`/edit/${slug}`)}`}>Masuk</Link></p>
        )}
      </div>
    </main>
  );
}
