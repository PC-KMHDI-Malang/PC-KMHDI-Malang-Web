"use server";

import { signOut } from "@/lib/auth";

// Dipakai juga oleh panel admin (Sidebar.tsx/AdminMobileNav.tsx via SubmitWithConfirm), yang
// bergantung pada redirect() di sini untuk berpindah halaman setelah logout (lihat komentar
// unstable_rethrow di SubmitWithConfirm.tsx) — jangan diubah ke redirect: false di sini.
// Navbar publik (yang butuh sinkronisasi ulang sesi sisi client) logout lewat signOut() dari
// next-auth/react secara langsung, bukan lewat action ini — lihat Navbar.tsx.
export async function logoutAction() {
  await signOut({ redirectTo: "/" });
}
