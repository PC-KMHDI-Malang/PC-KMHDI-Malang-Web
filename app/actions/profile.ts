"use server";

import { supabaseAdmin } from "@/lib/supabase";
import { auth, update } from "@/lib/auth";
import bcrypt from "bcryptjs";
import { isPasswordLongEnough, PASSWORD_RULE_TEXT } from "@/lib/password";
import { revalidatePath } from "next/cache";
import { isProtectedAccountEmail } from "@/lib/protectedAccounts";
import { isViewerRole } from "@/lib/roles";
import { parseNotifyEmail } from "@/lib/notifyEmail";

// Satu jalur simpan untuk form profil: nama dan email notifikasi sekaligus, supaya halamannya
// cukup punya satu tombol. Keduanya punya aturan izin BERBEDA, dan masing-masing hanya diproses
// kalau kolomnya memang dikirim form (input yang disabled tidak ikut terkirim):
//  - nama: ditolak untuk akun bersama dan Akun Umum (VIEWER). Akun KONTRIBUTOR dikunci lewat UI
//    (kolom namanya disabled), bukan lewat action ini;
//  - email notifikasi (kolom notifyEmail, migrasi 037): ditolak untuk akun bersama dan Akun
//    Umum, karena keduanya memang tidak menerima notifikasi (lihat isAgendaRecipient di
//    lib/agenda.ts). Akun KONTRIBUTOR (mis. sekretaris) BOLEH: halaman admin tempat mengisinya
//    khusus ADMIN, jadi tanpa ini sekretaris tidak punya cara mengisi emailnya.
// Kalau salah satu tidak valid, TIDAK ada yang disimpan — tidak ada simpan setengah jalan.
export async function updateProfileAction(prevState: unknown, formData: FormData) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { error: "Silakan login terlebih dahulu.", success: false };
    }

    // Akun bersama (mis. pcmalang@kmhdi.info) tidak boleh diganti namanya sendiri — sama seperti
    // password, supaya identitas akun bersama ini tetap konsisten untuk semua kader. Akun Umum
    // (VIEWER) juga dikunci. Role dibaca dari database, bukan sesi, supaya perubahan role oleh
    // Admin langsung berlaku.
    const { data: me } = await supabaseAdmin.from("User").select("email, role").eq("id", session.user.id).maybeSingle();
    if (!me) return { error: "User tidak ditemukan.", success: false };
    if (isProtectedAccountEmail(me.email) || isViewerRole(me.role)) {
      return { error: "Profil akun ini dikelola langsung oleh pengurus dan tidak bisa diganti sendiri.", success: false };
    }

    const updateData: Record<string, unknown> = {};
    let newName: string | null = null;

    if (formData.has("name")) {
      const name = formData.get("name");
      if (typeof name !== "string" || name.trim().length < 2) {
        return { error: "Nama lengkap minimal 2 karakter.", success: false };
      }
      newName = name.trim();
      updateData.name = newName;
    }

    if (formData.has("notifyEmail")) {
      const parsed = parseNotifyEmail(formData.get("notifyEmail"));
      if (!parsed.ok) return { error: parsed.error, success: false };
      updateData.notifyEmail = parsed.value;
    }

    if (Object.keys(updateData).length === 0) return { error: null, success: true };

    const { error } = await supabaseAdmin.from("User").update(updateData).eq("id", session.user.id);
    if (error?.code === "42703") return { error: "Fitur email notifikasi belum siap. Hubungi pengurus.", success: false };
    if (error) return { error: "Gagal memperbarui profil.", success: false };

    // Perbarui session cookie NextAuth, hanya kalau namanya memang berubah.
    if (newName) await update({ user: { name: newName } });

    revalidatePath("/", "layout");

    return { error: null, success: true };
  } catch {
    return { error: "Terjadi kesalahan sistem.", success: false };
  }
}

export async function updatePasswordAction(prevState: unknown, formData: FormData) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { error: "Silakan login terlebih dahulu.", success: false };
    }

    const currentPassword = formData.get("currentPassword") as string;
    const newPassword = formData.get("newPassword") as string;

    if (!currentPassword || !newPassword || !isPasswordLongEnough(newPassword)) {
      return { error: `Data tidak valid atau password terlalu pendek. ${PASSWORD_RULE_TEXT}`, success: false };
    }

    const { data: user } = await supabaseAdmin.from("User").select("email, password, role").eq("id", session.user.id).single();

    if (!user) return { error: "User tidak ditemukan.", success: false };

    // Akun bersama (mis. dipakai banyak kader untuk /informasi-akun) tidak boleh diganti
    // password-nya lewat form ini — kalau boleh, satu kader saja bisa mengunci semua yang lain.
    if (isProtectedAccountEmail(user.email) || isViewerRole(user.role)) {
      return { error: "Password akun ini dikelola langsung oleh pengurus dan tidak bisa diganti sendiri.", success: false };
    }

    const isPasswordValid = await bcrypt.compare(currentPassword, user.password);
    if (!isPasswordValid) {
      return { error: "Password saat ini salah.", success: false };
    }

    const hashedNewPassword = await bcrypt.hash(newPassword, 10);

    await supabaseAdmin.from("User").update({ password: hashedNewPassword }).eq("id", session.user.id);

    revalidatePath("/profile");
    revalidatePath("/admin/profile");

    return { error: null, success: true };
  } catch {
    return { error: "Terjadi kesalahan sistem.", success: false };
  }
}
