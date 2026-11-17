// Service worker Akadana. Ditulis tangan (tanpa Workbox) supaya aturannya jelas:
// - Navigasi halaman: network-first, salinan terakhir disimpan; offline -> salinan, atau /offline.
//   /buat/* ikut disimpan, jadi form pembuatan yang pernah dibuka tetap bisa diisi tanpa internet (draf di localStorage).
// - Aset build Next (/_next/static, nama berisi hash): cache-first.
// - CSS template, script, ikon, foto undangan (/foto/*): stale-while-revalidate.
// - Font Google dan SweetAlert2 dari CDN: stale-while-revalidate.
// - API (/api/*), /auth/*, /keluar, dan semua selain GET: tidak pernah lewat cache.
// Naikkan VERSI bila aturan di file ini berubah; cache lama dihapus saat aktivasi.
const VERSI = "v1";
const CACHE_HALAMAN = `halaman-${VERSI}`;
const CACHE_ASET = `aset-${VERSI}`;
const CACHE_LUAR = `luar-${VERSI}`;
const HALAMAN_AWAL = ["/", "/offline"];
const MAKS_HALAMAN = 30;

self.addEventListener("install", event => {
  event.waitUntil(caches.open(CACHE_HALAMAN).then(c => c.addAll(HALAMAN_AWAL)).then(() => self.skipWaiting()));
});

self.addEventListener("activate", event => {
  const pakai = [CACHE_HALAMAN, CACHE_ASET, CACHE_LUAR];
  event.waitUntil(
    caches.keys()
      .then(kunci => Promise.all(kunci.filter(k => !pakai.includes(k)).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

async function batasiCache(nama, maks) {
  const cache = await caches.open(nama);
  const kunci = await cache.keys();
  for (let i = 0; i < kunci.length - maks; i++) await cache.delete(kunci[i]);
}

async function halaman(request) {
  const cache = await caches.open(CACHE_HALAMAN);
  try {
    const res = await fetch(request);
    // hanya halaman yang berhasil; halaman berisi data pribadi (/saya) tidak disimpan
    const url = new URL(request.url);
    if (res.ok && res.type === "basic" && !url.pathname.startsWith("/saya")) {
      cache.put(request, res.clone()).then(() => batasiCache(CACHE_HALAMAN, MAKS_HALAMAN));
    }
    return res;
  } catch {
    return (await cache.match(request, { ignoreSearch: true })) ?? (await cache.match("/offline")) ?? Response.error();
  }
}

async function cacheDulu(request, nama) {
  const cache = await caches.open(nama);
  const ada = await cache.match(request);
  if (ada) return ada;
  const res = await fetch(request);
  if (res.ok) cache.put(request, res.clone());
  return res;
}

async function basiSambilPerbarui(request, nama) {
  const cache = await caches.open(nama);
  const ada = await cache.match(request);
  const baru = fetch(request)
    .then(res => { if (res.ok || res.type === "opaque") cache.put(request, res.clone()); return res; })
    .catch(() => ada ?? Response.error());
  return ada ?? baru;
}

self.addEventListener("fetch", event => {
  const { request } = event;
  if (request.method !== "GET") return;
  const url = new URL(request.url);

  if (url.origin === self.location.origin) {
    if (url.pathname.startsWith("/api/") || url.pathname.startsWith("/auth/") || url.pathname === "/keluar") return;
    if (request.mode === "navigate") { event.respondWith(halaman(request)); return; }
    if (url.pathname.startsWith("/_next/static/")) { event.respondWith(cacheDulu(request, CACHE_ASET)); return; }
    if (/^\/(undangan\/css|js|ikon|img|foto)\//.test(url.pathname)) { event.respondWith(basiSambilPerbarui(request, CACHE_ASET)); return; }
    return;
  }

  if (["fonts.googleapis.com", "fonts.gstatic.com", "cdn.jsdelivr.net"].includes(url.hostname)) {
    event.respondWith(basiSambilPerbarui(request, CACHE_LUAR));
  }
});
