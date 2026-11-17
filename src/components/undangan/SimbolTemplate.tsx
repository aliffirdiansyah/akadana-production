// Simbol SVG tiap template, dipakai section lewat <use href="#ikon-...">. jawa-02 dan jawa-03 memakai simbol jawa-01 (hanya beda warna).
import type { JSX } from "react";

function Jawa() {
  return (
    <svg width="0" height="0" style={{ position: "absolute" }} aria-hidden="true">
      <defs>
        <symbol id="ikon-gunungan" viewBox="0 0 100 124">
          <g fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round">
            <path d="M50 2 C60 26 90 52 92 88 L92 104 L8 104 L8 88 C10 52 40 26 50 2 Z" />
            <path d="M50 14 C57 32 80 54 82 86 L18 86 C20 54 43 32 50 14 Z" strokeOpacity=".7" />
            <path d="M50 30 V86 M50 46 C42 52 34 58 30 68 M50 46 C58 52 66 58 70 68 M50 60 C44 64 38 70 36 78 M50 60 C56 64 62 70 64 78" />
            <path d="M34 104 V92 H66 V104 M44 104 V96 H56 V104" />
            <path d="M4 104 H96 M10 110 H90 M18 116 H82" />
          </g>
        </symbol>
        <symbol id="ikon-belah" viewBox="0 0 14 14"><path d="M7 0 L14 7 L7 14 L0 7 Z" fill="currentColor" /></symbol>
      </defs>
    </svg>
  );
}

function Modern() {
  return (
    <svg width="0" height="0" style={{ position: "absolute" }} aria-hidden="true">
      <defs>
        <symbol id="ikon-hias" viewBox="0 0 64 40">
          <g fill="none" stroke="currentColor" strokeWidth="1.5">
            <circle cx="24" cy="20" r="18" />
            <circle cx="40" cy="20" r="18" />
          </g>
        </symbol>
        <symbol id="ikon-belah" viewBox="0 0 14 14"><circle cx="7" cy="7" r="3" fill="currentColor" /></symbol>
      </defs>
    </svg>
  );
}

function Islami() {
  return (
    <svg width="0" height="0" style={{ position: "absolute" }} aria-hidden="true">
      <defs>
        <symbol id="ikon-hias" viewBox="0 0 100 124">
          <g fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round">
            <path d="M10 120 V54 C10 30 34 20 50 4 C66 20 90 30 90 54 V120 Z" />
            <path d="M22 120 V58 C22 40 40 32 50 20 C60 32 78 40 78 58 V120" strokeOpacity=".7" />
            <path d="M34 120 V68 C34 56 44 52 50 44 C56 52 66 56 66 68 V120" strokeOpacity=".7" />
            <path d="M4 120 H96" />
          </g>
          <path d="M50 76 L53 83 L60 86 L53 89 L50 96 L47 89 L40 86 L47 83 Z" fill="currentColor" />
        </symbol>
        <symbol id="ikon-belah" viewBox="0 0 14 14"><path d="M7 0 L8.800 5.200 L14 7 L8.800 8.800 L7 14 L5.200 8.800 L0 7 L5.200 5.200 Z" fill="currentColor" /></symbol>
      </defs>
    </svg>
  );
}

const PETA: Record<string, () => JSX.Element> = {
  "jawa-01": Jawa,
  "jawa-02": Jawa,
  "jawa-03": Jawa,
  "modern-01": Modern,
  "islami-01": Islami,
};

// Template baru: tambah simbolnya di sini, CSS di public/undangan/css/{kode}.css, dan baris m_template
export function SimbolTemplate({ kode }: { kode: string }) {
  const Simbol = PETA[kode] ?? Jawa;
  return <Simbol />;
}
