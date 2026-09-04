export { auth as middleware } from "@/lib/auth";

export const config = {
  // /informasi-akun sengaja tidak dicantumkan: halaman itu menahan datanya sendiri di server
  // dan menampilkan popup login di tempat, bukan dialihkan ke /login.
  matcher: ["/profile", "/profile/:path*", "/dashboard/:path*", "/admin/:path*"],
};
