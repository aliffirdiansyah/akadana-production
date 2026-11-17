"use client";
// Link ke /contoh/{kode} (tab baru). Bila draf berisi nama kedua mempelai, nama itu dibawa lewat query
// supaya pratinjau dan kartu katalog menampilkan nama mempelai sendiri, bukan nama contoh.
import { useSyncExternalStore } from "react";
import { bacaDraf, langgananDraf, teksDraf } from "@/lib/draf";
import { namaDraf } from "@/lib/undangan/susun";

function useNamaDraf() {
  // snapshot berupa teks draf (stabil antar render); diurai di bawah
  const teks = useSyncExternalStore(langgananDraf, teksDraf, () => "");
  if (!teks) return null;
  const draf = bacaDraf();
  const nama = namaDraf(draf);
  return nama ? { ...nama, wl: draf?.Wanita?.NamaLengkap ?? "", pl: draf?.Pria?.NamaLengkap ?? "" } : null;
}

type Props = React.AnchorHTMLAttributes<HTMLAnchorElement> & { href: string };

export function TautanContoh({ href, children, ...lain }: Props) {
  const nama = useNamaDraf();
  let tujuan = href;
  if (nama) {
    const q = new URLSearchParams({ w: nama.wanita, p: nama.pria });
    if (nama.wl) q.set("wl", nama.wl);
    if (nama.pl) q.set("pl", nama.pl);
    tujuan += "?" + q.toString();
  }
  return <a href={tujuan} target="_blank" rel="noopener" {...lain}>{children}</a>;
}

// Nama contoh di kartu katalog, diganti nama dari draf bila sudah diisi
export function NamaContoh({ asli }: { asli: string }) {
  const nama = useNamaDraf();
  return <>{nama ? `${nama.wanita} & ${nama.pria}` : asli}</>;
}
