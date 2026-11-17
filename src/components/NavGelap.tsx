"use client";
// Navbar varian gelap di atas hero gelap (.pl-kenal). Navbar ada di layout, jadi halaman memasang kelasnya dari sini.
import { useEffect } from "react";

export function NavGelap() {
  useEffect(() => {
    const nav = document.querySelector(".navbar");
    nav?.classList.add("navbar-gelap");
    return () => nav?.classList.remove("navbar-gelap");
  }, []);
  return null;
}
