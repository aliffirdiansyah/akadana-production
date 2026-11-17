// Konfirmasi dan pesan hasil dengan SweetAlert2 (dimuat dari CDN sebelum file ini), untuk halaman undangan publik.
// Halaman aplikasi (React) memakai src/lib/konfirmasi.ts dengan API yang sama; perubahan perilaku dibuat di keduanya.
//
// Pemakaian:
// - Form biasa: <form data-konfirmasi="Teks pertanyaan" data-konfirmasi-judul="..." data-konfirmasi-tombol="..." data-konfirmasi-bahaya>
//   Form dikirim hanya setelah pengguna setuju. Validasi bawaan browser tetap berjalan lebih dulu.
// - Dari JavaScript: if (!await Konfirmasi.tanya({ judul, teks, tombol, bahaya })) return;
// - Pesan hasil: Konfirmasi.sukses(teks), Konfirmasi.gagal(teks).
// - Pesan berhasil setelah redirect: <body data-sukses="..."> (diisi dari TempData["Sukses"]).
(() => {
  "use strict";

  const warna = (nama, cadangan) =>
    getComputedStyle(document.documentElement).getPropertyValue(nama).trim() || cadangan;

  const dasar = () => ({
    buttonsStyling: true,
    confirmButtonColor: warna("--accent", "#1f5b4a"),
    cancelButtonColor: warna("--muted", "#5b6a62"),
    customClass: { popup: "inviora-swal" },
    // tanpa animasi bila pengguna meminta gerak dikurangi
    showClass: matchMedia("(prefers-reduced-motion: reduce)").matches ? { popup: "" } : undefined,
    hideClass: matchMedia("(prefers-reduced-motion: reduce)").matches ? { popup: "" } : undefined,
  });

  // Dialog <dialog> modal berada di lapisan teratas dan menutupi SweetAlert, jadi ditutup selama bertanya
  async function diLuarDialog(el, fn) {
    const dialog = el?.closest?.("dialog[open]");
    if (!dialog || typeof Swal === "undefined") return fn();
    dialog.close();
    const hasil = await fn();
    if (!hasil) dialog.showModal();
    return hasil;
  }

  async function tanya({ judul = "Simpan perubahan?", teks = "", tombol = "Ya, simpan", batal = "Batal", bahaya = false, asal = null } = {}) {
    // SweetAlert gagal dimuat (CDN diblokir): jatuh ke konfirmasi bawaan browser
    if (typeof Swal === "undefined") return confirm(teks ? `${judul}\n\n${teks}` : judul);
    return diLuarDialog(asal, async () => {
      const hasil = await Swal.fire({
        ...dasar(),
        icon: bahaya ? "warning" : "question",
        title: judul,
        text: teks || undefined,
        showCancelButton: true,
        confirmButtonText: tombol,
        cancelButtonText: batal,
        confirmButtonColor: bahaya ? warna("--danger", "#b23b2e") : warna("--accent", "#1f5b4a"),
        reverseButtons: true,
        focusCancel: bahaya,
      });
      return hasil.isConfirmed;
    });
  }

  function sukses(teks, judul = "Berhasil") {
    if (typeof Swal === "undefined") return Promise.resolve();
    return Swal.fire({
      ...dasar(),
      icon: "success",
      title: judul,
      text: teks || undefined,
      timer: 2200,
      timerProgressBar: true,
      showConfirmButton: false,
    });
  }

  function gagal(teks, judul = "Gagal") {
    if (typeof Swal === "undefined") { alert(teks); return Promise.resolve(); }
    return Swal.fire({ ...dasar(), icon: "error", title: judul, text: teks, confirmButtonText: "Tutup" });
  }

  window.Konfirmasi = { tanya, sukses, gagal };

  // Form dengan data-konfirmasi: dicegat di fase capture, sebelum handler submit milik form berjalan
  const sudahSetuju = new WeakSet();
  document.addEventListener("submit", async e => {
    const form = e.target;
    if (!(form instanceof HTMLFormElement) || !form.hasAttribute("data-konfirmasi")) return;
    if (sudahSetuju.has(form)) {
      sudahSetuju.delete(form);
      return;
    }
    e.preventDefault();
    e.stopImmediatePropagation();
    const d = form.dataset;
    const setuju = await tanya({
      judul: d.konfirmasiJudul || "Simpan perubahan?",
      teks: d.konfirmasi,
      tombol: d.konfirmasiTombol || "Ya, simpan",
      bahaya: d.konfirmasiBahaya !== undefined,
      asal: form,
    });
    if (!setuju) return;
    sudahSetuju.add(form);
    form.requestSubmit(e.submitter && e.submitter.form === form ? e.submitter : undefined);
  }, true);

  // Pesan berhasil dari aksi sebelumnya (POST lalu redirect)
  const pesan = document.body?.dataset.sukses;
  if (pesan) sukses(pesan);
})();
