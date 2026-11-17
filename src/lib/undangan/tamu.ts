// Nilai query string halaman undangan

type Query = string | string[] | undefined;

const satu = (v: Query) => (Array.isArray(v) ? v[0] : v ?? "");

// Nama tamu dari ?to=, dirapikan dan dipotong 60 karakter. null bila kosong (sampul memakai tamuDefault).
export function namaTamu(to: Query): string | null {
  const nama = satu(to).replace(/\s+/g, " ").trim();
  return nama ? nama.slice(0, 60) : null;
}

// Nama mempelai dari draf (localStorage) yang dibawa katalog ke /contoh/{kode}?w=&p=&wl=&pl=
export function namaDariQuery(q: Record<string, Query>) {
  return {
    Wanita: { NamaPanggilan: satu(q.w), NamaLengkap: satu(q.wl) },
    Pria: { NamaPanggilan: satu(q.p), NamaLengkap: satu(q.pl) },
  };
}
