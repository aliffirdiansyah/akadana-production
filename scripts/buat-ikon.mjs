// Membuat ikon PWA (PNG) dari logo SVG. Jalankan ulang bila logo berubah: npm run ikon
import sharp from "sharp";
import { readFile, writeFile } from "node:fs/promises";

const svg = await readFile("public/img/logo/akadana-ikon.svg", "utf8");
// Versi persegi penuh tanpa sudut membulat (sistem operasi memotong sendiri)
const penuh = svg.replace('rx="14" ', "");
// Maskable: tanda di zona aman 80% tengah, latar memenuhi kanvas
const maskable = penuh.replace('<g transform="translate(2 6)">', '<g transform="translate(8.4 10.8) scale(0.8)">');

const buat = (isi, ukuran, nama) => sharp(Buffer.from(isi), { density: 384 }).resize(ukuran, ukuran).png().toFile(`public/ikon/${nama}`);
await buat(svg, 192, "ikon-192.png");
await buat(svg, 512, "ikon-512.png");
await buat(maskable, 512, "ikon-maskable-512.png");
await buat(penuh, 180, "apple-touch-icon.png");
await writeFile("public/favicon.ico", await sharp(Buffer.from(svg), { density: 384 }).resize(48, 48).png().toBuffer());
console.log("ikon dibuat");
