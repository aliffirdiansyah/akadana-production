// Mendaftarkan service worker (public/sw.js) setelah halaman selesai dimuat. Tidak dipasang saat dev (localhost:3000
// tanpa build) supaya cache tidak mengganggu hot reload; set localStorage "inviora_sw_dev" = "1" untuk mencobanya.
(() => {
  "use strict";
  if (!("serviceWorker" in navigator)) return;
  let dev = false;
  try { dev = location.hostname === "localhost" && localStorage.getItem("inviora_sw_dev") !== "1"; } catch { dev = false; }
  if (dev && location.port === "3000") return;
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("/sw.js", { scope: "/", updateViaCache: "none" }).catch(() => {});
  });
})();
