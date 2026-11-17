// Halaman undangan publik /u/{slug} (src/components/undangan/IsiUndangan.tsx), juga dimuat di pratinjau form pembuatan.
// Endpoint: GET/POST {dasar}/ucapan, POST {dasar}/rsvp dengan dasar /api/u/{slug}. Respons ResponseBase (PascalCase).
(() => {
  "use strict";

  const STATUS_SUKSES = 1;
  const main = document.getElementById("undangan");
  const urlDasar = main.dataset.url;
  // Pratinjau: "template" (isi contoh) atau "form" (form pembuatan). Undangan belum tersimpan.
  const pratinjau = main.dataset.pratinjau;

  // Error dengan pesan yang boleh langsung ditampilkan
  class PesanError extends Error {}

  async function panggil(url, body) {
    if (pratinjau === "template") throw new PesanError("Ini pratinjau template. Konfirmasi dan ucapan bisa dikirim di undangan sungguhan.");
    if (pratinjau === "form") throw new PesanError("Ini pratinjau. Formulir aktif setelah undangan dibuat.");
    const opsi = { headers: { "X-Requested-With": "XMLHttpRequest" } };
    if (body !== undefined) {
      opsi.method = "POST";
      opsi.headers["Content-Type"] = "application/json";
      opsi.body = JSON.stringify(body);
    }
    if (!navigator.onLine) throw new PesanError("Sedang offline. Sambungkan internet, lalu kirim lagi.");
    const res = await fetch(url, opsi);
    if (res.status === 429) throw new PesanError("Terlalu banyak percobaan. Tunggu satu menit, lalu coba lagi.");
    if (!res.ok) throw new PesanError("Permintaan ditolak server. Muat ulang halaman, lalu coba lagi.");
    const hasil = await res.json();
    if (hasil.Status !== STATUS_SUKSES) throw new PesanError(hasil.Message);
    return hasil;
  }

  function teksError(e) {
    return e instanceof PesanError ? e.message : "Gagal mengirim. Periksa koneksi, lalu coba lagi.";
  }

  function tampilPesan(el, teks, ok) {
    el.textContent = teks;
    el.classList.toggle("ok", ok);
    el.classList.toggle("gagal", !ok);
  }

  // ---------- sampul ----------
  // body.terkunci (halaman tidak bisa digulir) sampai sampul dibuka; body tidak dirender per halaman, jadi dipasang di sini
  const sampul = document.getElementById("sampul");
  if (sampul) {
    if (!sampul.classList.contains("terbuka")) document.body.classList.add("terkunci");
    document.getElementById("tombolBuka").addEventListener("click", () => {
      sampul.classList.add("terbuka");
      document.body.classList.remove("terkunci");
    });
  }

  // ---------- animasi muncul ----------
  const elMuncul = document.querySelectorAll(".muncul");
  if ("IntersectionObserver" in window) {
    const io = new IntersectionObserver(entries => {
      entries.forEach(e => {
        if (e.isIntersecting) { e.target.classList.add("tampak"); io.unobserve(e.target); }
      });
    }, { threshold: 0.15 });
    elMuncul.forEach(el => io.observe(el));
  } else {
    elMuncul.forEach(el => el.classList.add("tampak"));
  }

  // ---------- hitung mundur ----------
  document.querySelectorAll("[data-mundur]").forEach(box => {
    const target = new Date(box.dataset.mundur).getTime();
    const tick = () => {
      const s = Math.max(0, Math.floor((target - Date.now()) / 1000));
      const nilai = { hari: Math.floor(s / 86400), jam: Math.floor(s % 86400 / 3600), menit: Math.floor(s % 3600 / 60), detik: s % 60 };
      for (const k in nilai) box.querySelector(`[data-u="${k}"]`).textContent = nilai[k];
    };
    tick();
    setInterval(tick, 1000);
  });

  // ---------- RSVP ----------
  const formRsvp = document.getElementById("formRsvp");
  if (formRsvp) {
    const jumlah = formRsvp.elements.Jumlah;
    formRsvp.addEventListener("change", e => {
      if (e.target.name === "Hadir") jumlah.disabled = e.target.value !== "true";
    });

    formRsvp.addEventListener("submit", async e => {
      e.preventDefault();
      const pesan = formRsvp.querySelector(".pesan");
      const tombol = formRsvp.querySelector("button[type=submit]");
      const nama = formRsvp.elements.Nama.value.trim();
      if (!nama) { tampilPesan(pesan, "Nama harus diisi.", false); formRsvp.elements.Nama.focus(); return; }

      const hadir = formRsvp.elements.Hadir.value === "true";
      // pratinjau tidak mengirim apa pun, jadi tidak perlu ditanya
      if (!pratinjau && !await Konfirmasi.tanya({
        judul: "Kirim konfirmasi kehadiran?",
        teks: hadir ? `${nama}, hadir ${Number(jumlah.value)} orang.` : `${nama}, tidak dapat hadir.`,
        tombol: "Ya, kirim",
      })) return;
      tombol.disabled = true;
      tampilPesan(pesan, "Mengirim...", true);
      try {
        const hasil = await panggil(`${urlDasar}/rsvp`, { Nama: nama, Hadir: hadir, Jumlah: hadir ? Number(jumlah.value) : 0 });
        tampilPesan(pesan, hasil.Message, true);
        Konfirmasi.sukses(hasil.Message, "Terkirim");
      } catch (err) {
        tampilPesan(pesan, teksError(err), false);
      } finally {
        tombol.disabled = false;
      }
    });
  }

  // ---------- ucapan ----------
  const daftarUcapan = document.getElementById("daftarUcapan");

  function itemUcapan(u) {
    const li = document.createElement("li");
    const b = document.createElement("b"); b.textContent = u.Nama;
    const small = document.createElement("small"); small.textContent = u.Waktu;
    const p = document.createElement("p"); p.textContent = u.Pesan;
    li.append(b, small, p);
    return li;
  }

  const formUcapan = document.getElementById("formUcapan");
  if (formUcapan) {
    formUcapan.addEventListener("submit", async e => {
      e.preventDefault();
      const pesan = formUcapan.querySelector(".pesan");
      const tombol = formUcapan.querySelector("button[type=submit]");
      const nama = formUcapan.elements.Nama.value.trim();
      const isi = formUcapan.elements.Pesan.value.trim();
      if (!nama) { tampilPesan(pesan, "Nama harus diisi.", false); formUcapan.elements.Nama.focus(); return; }
      if (!isi) { tampilPesan(pesan, "Ucapan harus diisi.", false); formUcapan.elements.Pesan.focus(); return; }

      if (!pratinjau && !await Konfirmasi.tanya({
        judul: "Kirim ucapan?",
        teks: "Ucapan tampil untuk semua yang membuka undangan ini.",
        tombol: "Ya, kirim",
      })) return;
      tombol.disabled = true;
      tampilPesan(pesan, "Mengirim...", true);
      try {
        const hasil = await panggil(`${urlDasar}/ucapan`, { Nama: nama, Pesan: isi });
        daftarUcapan.prepend(itemUcapan(hasil.Data));
        daftarUcapan.scrollTop = 0;
        formUcapan.elements.Pesan.value = "";
        tampilPesan(pesan, hasil.Message, true);
        Konfirmasi.sukses(hasil.Message, "Terkirim");
      } catch (err) {
        tampilPesan(pesan, teksError(err), false);
      } finally {
        tombol.disabled = false;
      }
    });
  }

  const muatUcapan = document.getElementById("muatUcapan");
  if (muatUcapan) {
    muatUcapan.addEventListener("click", async () => {
      muatUcapan.disabled = true;
      try {
        const hasil = await panggil(`${urlDasar}/ucapan?mulai=${daftarUcapan.children.length}`);
        hasil.Data.Daftar.forEach(u => daftarUcapan.append(itemUcapan(u)));
        if (!hasil.Data.AdaLagi) muatUcapan.remove();
      } catch (err) {
        muatUcapan.textContent = teksError(err);
      } finally {
        muatUcapan.disabled = false;
      }
    });
  }

  // ---------- salin nomor rekening ----------
  document.querySelectorAll("[data-salin]").forEach(btn => {
    const asli = btn.textContent;
    btn.addEventListener("click", async () => {
      try {
        await navigator.clipboard.writeText(btn.dataset.salin);
        btn.textContent = "Tersalin ✓";
      } catch {
        btn.textContent = "Gagal menyalin";
      }
      setTimeout(() => { btn.textContent = asli; }, 1800);
    });
  });
})();
