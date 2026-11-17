// Tema terang/gelap: kunci localStorage dan skrip <head> yang memasang <html data-theme> sebelum halaman tampil
// (tanpa kedip). Dipakai layout (server) dan ToggleTema (client).
export const KUNCI_TEMA = "akadana_tema";

export const SKRIP_TEMA = `try{var t=localStorage.getItem("${KUNCI_TEMA}");if(t==="light"||t==="dark")document.documentElement.dataset.theme=t}catch(e){}`;
