// Tujuan setelah login: hanya URL lokal, supaya link login tidak bisa dipakai mengarahkan ke situs lain
export function tujuanAman(returnUrl: string | undefined | null): string {
  return returnUrl && returnUrl.startsWith("/") && !returnUrl.startsWith("//") && !returnUrl.startsWith("/\\") ? returnUrl : "/";
}
