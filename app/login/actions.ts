"use server";

import { signIn } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabase";
import { isAdminPanelRole } from "@/lib/roles";
import { AuthError } from "next-auth";

export async function loginAction(formData: FormData) {
  try {
    const callbackPath = safeCallbackPath(formData.get("callbackUrl"));

    // redirect: false — tujuan dikembalikan ke halaman login, lalu browser memuat ulang penuh ke
    // sana (lihat app/login/page.tsx). Kalau redirect dilakukan di sini, Next.js berpindah halaman
    // tanpa memuat ulang: cookie sesi yang baru dibuat belum ikut terbaca, sehingga pengguna bisa
    // mendarat di halaman lain (mis. /admin berisi halaman profil) dan navbar masih "Login".
    await signIn("credentials", {
      email: formData.get("email"),
      password: formData.get("password"),
      redirect: false,
    });
    if (callbackPath) return { url: callbackPath };

    // Tanpa tujuan khusus: admin/kontributor ke panel admin, anggota biasa ke halaman profil
    // (sebelumnya semua ke /admin, lalu anggota dilempar lagi ke /profile).
    const { data: user } = await supabaseAdmin.from("User").select("role").eq("email", String(formData.get("email"))).maybeSingle();
    return { url: isAdminPanelRole(user?.role) ? "/admin" : "/profile" };
  } catch (error) {
    if (error instanceof AuthError) {
      return { error: "Email atau password salah." };
    }

    throw error;
  }
}

// Middleware (authorized() di lib/auth.ts) menambahkan callbackUrl dalam bentuk URL LENGKAP,
// mis. "https://kmhdimalang.org/kas" — dulu cuma path "/..." yang diterima, jadi tujuan itu
// terbuang dan semua orang dilempar ke /admin (lalu anggota biasa ke /profile). Sekarang yang
// diambil hanya path + query-nya: domain dari callbackUrl sengaja diabaikan, jadi tidak bisa
// dipakai untuk mengalihkan pengguna ke situs lain setelah login.
function safeCallbackPath(value: FormDataEntryValue | null): string | null {
  if (typeof value !== "string" || !value) return null;
  if (value.startsWith("/") && !value.startsWith("//") && !value.startsWith("/\\")) return value;
  try {
    const url = new URL(value);
    if (url.protocol !== "https:" && url.protocol !== "http:") return null;
    if (url.pathname === "/login" || url.pathname.startsWith("//")) return null;
    return `${url.pathname}${url.search}${url.hash}`;
  } catch {
    return null;
  }
}
