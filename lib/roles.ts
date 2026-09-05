// Role "KONTRIBUTOR": bisa masuk panel admin, tapi cuma untuk mengelola Artikel & e-Book
// (plus halaman Beranda admin itu sendiri) — tidak bisa ke Statistik, Pengurus, Mitra, Galeri,
// Manajemen User, atau Ganti Password/username (lihat app/admin/profile/page.tsx). Dipusatkan di
// sini supaya middleware (lib/auth.ts), setiap halaman admin, dan menu sidebar (SidebarNav,
// AdminMobileNav) selalu sepakat soal halaman mana yang boleh diakses role ini.
export const ADMIN_PANEL_ROLES = ["ADMIN", "KONTRIBUTOR"] as const;

export function isAdminPanelRole(role: string | null | undefined): boolean {
  return role === "ADMIN" || role === "KONTRIBUTOR";
}

// "/admin" dicek persis (bukan startsWith) supaya tidak otomatis meng-cakup semua sub-halaman
// lain di bawah "/admin" yang memang harus dibatasi.
export function canAccessAdminPath(role: string | null | undefined, pathname: string): boolean {
  if (role === "ADMIN") return true;
  if (role === "KONTRIBUTOR") {
    return pathname === "/admin" || pathname.startsWith("/admin/news") || pathname.startsWith("/admin/ebooks");
  }
  return false;
}
