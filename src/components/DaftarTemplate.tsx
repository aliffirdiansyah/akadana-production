// Kartu template katalog: pratinjau isi contoh (tab baru) dan tombol pakai. Dipakai beranda (pengunjung) dan /template.
import Link from "next/link";
import { NamaContoh, TautanContoh } from "@/components/TautanContoh";
import type { TemplateKartu } from "@/lib/undangan/susun";

export function DaftarTemplate({ daftar, sudahLogin }: { daftar: TemplateKartu[]; sudahLogin: boolean }) {
  return (
    <>
      {daftar.length === 0 ? (
        <p className="notice">Belum ada template yang tersedia.</p>
      ) : (
        <ul className="tpl-daftar tpl-katalog">
          {daftar.map(t => {
            const terkunci = !t.gratis && !sudahLogin;
            const tujuan = `/buat/${t.kode}`;
            const contoh = `/contoh/${t.kode}`;
            return (
              <li key={t.kode}>
                <div className="tpl-kartu" data-kode={t.kode}>
                  {/* gambar mini membuka pratinjau yang sama dengan tombol "Pratinjau", jadi disembunyikan dari pembaca layar */}
                  <TautanContoh className="tpl-pratinjau" href={contoh} tabIndex={-1} aria-hidden="true">
                    <span className="tpl-bingkai">
                      <span className="tpl-label">{t.contohLabel}</span>
                      <span className="tpl-nama"><NamaContoh asli={t.contohNama} /></span>
                      <span className="tpl-belah"></span>
                    </span>
                  </TautanContoh>
                  <span className="tpl-info">
                    <span className="tpl-judul">{t.nama}</span>
                    {t.gratis ? (
                      <span className="tpl-status tpl-gratis">Gratis</span>
                    ) : terkunci ? (
                      <span className="tpl-status tpl-kunci">
                        <svg viewBox="0 0 16 16" width="13" height="13" aria-hidden="true" focusable="false"><path fill="currentColor" d="M8 1a3.5 3.5 0 0 0-3.5 3.5V7H4a1 1 0 0 0-1 1v6a1 1 0 0 0 1 1h8a1 1 0 0 0 1-1V8a1 1 0 0 0-1-1h-.5V4.5A3.5 3.5 0 0 0 8 1Zm2 6H6V4.5a2 2 0 1 1 4 0V7Z" /></svg>
                        Wajib masuk
                      </span>
                    ) : (
                      <span className="tpl-status tpl-terbuka">Terbuka</span>
                    )}
                    <span className="tpl-tombol">
                      <TautanContoh className="tpl-btn tpl-btn-garis" href={contoh} aria-label={`Pratinjau ${t.nama} (tab baru)`}>Pratinjau</TautanContoh>
                      <Link className="tpl-btn tpl-btn-utama" href={terkunci ? `/masuk?returnUrl=${encodeURIComponent(tujuan)}` : tujuan}
                        aria-label={`${t.gratis ? "Coba gratis" : terkunci ? "Masuk untuk memakai" : "Pakai"} ${t.nama}`}>
                        {t.gratis ? "Coba gratis" : terkunci ? "Masuk" : "Pakai"}
                      </Link>
                    </span>
                  </span>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </>
  );
}
