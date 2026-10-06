import { NextResponse, type NextFetchEvent, type NextRequest } from "next/server";
import { auth } from "@/lib/auth";
import { APP_URL, isAppHost, isAppPath, isSiteHost } from "@/lib/appHost";
import { siteConfig } from "@/lib/site";

// Halaman yang wajib login — pemeriksaannya tetap lewat authorized() di lib/auth.ts, sama seperti
// sebelumnya. /informasi-akun sengaja tidak dicantumkan: halaman itu menahan datanya sendiri di
// server dan menampilkan popup login di tempat, bukan dialihkan ke /login.
const PROTECTED_PREFIXES = ["/profile", "/dashboard", "/admin", "/kas"];
const needsAuth = (pathname: string) => PROTECTED_PREFIXES.some((p) => pathname === p || pathname.startsWith(`${p}/`));

// auth() dari NextAuth bisa dipanggil langsung sebagai middleware (dulu file ini cuma
// `export { auth as middleware }`). Tipenya dibuat eksplisit karena auth() punya banyak bentuk.
const authMiddleware = auth as unknown as (request: NextRequest, event: NextFetchEvent) => Promise<Response | undefined>;

export default async function middleware(request: NextRequest, event: NextFetchEvent) {
  const { pathname, search } = request.nextUrl;
  // Nama domain dibaca dari header (bukan nextUrl): di sebagian lingkungan nextUrl selalu berisi
  // host internal server, sedangkan header Host / x-forwarded-host berisi domain yang dibuka pengunjung.
  const hostname = (request.headers.get("x-forwarded-host") ?? request.headers.get("host") ?? request.nextUrl.hostname).split(",")[0].trim().split(":")[0].toLowerCase();

  // Pemisahan domain (lihat lib/appHost.ts) — hanya aktif kalau NEXT_PUBLIC_APP_URL diisi.
  if (APP_URL) {
    // Domain publik → halaman sistem dipindah ke apps.kmhdimalang.org.
    if (isSiteHost(hostname) && isAppPath(pathname)) {
      return NextResponse.redirect(new URL(`${pathname}${search}`, APP_URL), 307);
    }
    if (isAppHost(hostname)) {
      // apps.kmhdimalang.org tanpa path → halaman login (yang sudah login otomatis diteruskan
      // ke panel admin / profil oleh authorized()).
      if (pathname === "/") return NextResponse.redirect(new URL("/login", APP_URL), 307);
      // Domain sistem → halaman publik dipindah ke kmhdimalang.org.
      if (!isAppPath(pathname)) return NextResponse.redirect(new URL(`${pathname}${search}`, siteConfig.url), 307);
    }
  }

  if (needsAuth(pathname)) return authMiddleware(request, event);
  return NextResponse.next();
}

export const config = {
  // Semua halaman (supaya pemisahan domain berlaku di mana pun), kecuali route API, aset Next.js,
  // dan file statis (robots.txt, sitemap.xml, ads.txt, gambar, dll.).
  // "api(?:/|$)": hanya /api dan /api/... — artikel yang slug-nya kebetulan diawali "api"
  // (mis. /api-kebudayaan-bali) tetap diproses seperti halaman lain.
  matcher: ["/((?!api(?:/|$)|_next/static|_next/image|.*\\..*).*)"],
};
