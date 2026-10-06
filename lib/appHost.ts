import { siteConfig } from "@/lib/site";

// Website memakai dua domain dari SATU project/kode yang sama:
//   kmhdimalang.org       → halaman publik (beranda, berita, e-book, galeri, mitra, profil, ...)
//   apps.kmhdimalang.org  → sistem (login, panel admin, uang kas, profil & sandi akun, info akun)
// middleware.ts memindahkan pengunjung ke domain yang tepat, dan link di navbar langsung menuju
// domain sistem lewat appUrl() di bawah.
//
// Diaktifkan lewat env NEXT_PUBLIC_APP_URL (mis. "https://apps.kmhdimalang.org"). Kalau kosong
// (mis. di laptop / localhost / preview Vercel), semuanya tetap di satu domain seperti biasa.

// Nonaktif di deployment Preview Vercel (*.vercel.app): di sana semuanya tetap satu domain,
// supaya link tidak melompat ke apps.kmhdimalang.org milik produksi.
const isPreview = (process.env.NEXT_PUBLIC_VERCEL_ENV ?? process.env.VERCEL_ENV) === "preview";
export const APP_URL = isPreview ? "" : (process.env.NEXT_PUBLIC_APP_URL ?? "").replace(/\/+$/, "");

// Halaman yang tinggal di domain sistem. "/api" sengaja tidak termasuk: route API (login,
// sesi, file e-book, dll.) harus bisa dipanggil dari kedua domain.
const APP_PATH_PREFIXES = ["/admin", "/kas", "/login", "/profile", "/informasi-akun", "/dashboard"];

export function isAppPath(pathname: string): boolean {
  return APP_PATH_PREFIXES.some((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`));
}

function hostOf(url: string): string | null {
  try {
    return url ? new URL(url).hostname : null;
  } catch {
    return null;
  }
}

export const APP_HOST = hostOf(APP_URL);
const SITE_HOST = hostOf(siteConfig.url)?.replace(/^www\./, "") ?? null;

// Domain publik: domain utama dan versi www-nya.
export function isSiteHost(hostname: string): boolean {
  return !!SITE_HOST && (hostname === SITE_HOST || hostname === `www.${SITE_HOST}`);
}

export function isAppHost(hostname: string): boolean {
  return !!APP_HOST && hostname === APP_HOST;
}

// Link absolut ke halaman sistem (untuk dipakai dari domain publik). Tanpa NEXT_PUBLIC_APP_URL,
// tetap path relatif biasa.
export function appUrl(path: string): string {
  return APP_URL ? `${APP_URL}${path}` : path;
}

// Link absolut ke halaman publik (untuk dipakai dari domain sistem).
export function siteUrl(path: string): string {
  return APP_URL ? `${siteConfig.url}${path}` : path;
}
