// Logo Akadana: tanda dua cincin + tulisan "akadana" ("akad" hijau, "ana" emas). Warna dari CSS (.logo-*), jadi ikut varian navbar terang/gelap.
// Versi file ada di public/img/logo/.
export function Logo() {
  return (
    <span className="logo">
      <svg className="logo-tanda" viewBox="6 4 50 46" aria-hidden="true" focusable="false">
        <path className="logo-emas-isi" d="M22 6.5 27.5 12 22 17.5 16.5 12Z" />
        <circle className="logo-kiri" cx="22" cy="30" r="13" />
        <circle className="logo-emas" cx="38" cy="30" r="13" />
        <path className="logo-kiri" d="M32.65 37.46A13 13 0 0 1 26.45 42.22" />
      </svg>
      <span className="logo-teks">akad<span>ana</span></span>
    </span>
  );
}
