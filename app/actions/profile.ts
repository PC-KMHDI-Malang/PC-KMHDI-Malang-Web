"use server";

import { supabaseAdmin } from "@/lib/supabase";
import { auth, update } from "@/lib/auth";
import bcrypt from "bcryptjs";
import { isPasswordLongEnough, PASSWORD_RULE_TEXT } from "@/lib/password";
import { revalidatePath } from "next/cache";
import { isProtectedAccountEmail } from "@/lib/protectedAccounts";
import { isViewerRole } from "@/lib/roles";
import { parseNotifyEmail } from "@/lib/notifyEmail";

export async function updateNameAction(prevState: unknown, formData: FormData) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { error: "Silakan login terlebih dahulu.", success: false };
    }

    // Akun bersama (mis. pcmalang@kmhdi.info) juga tidak boleh diganti namanya sendiri —
    // sama seperti password, supaya identitas akun bersama ini tetap konsisten untuk semua kader.
    // Akun Umum (VIEWER) juga dikunci. Role dibaca dari database, bukan sesi, supaya perubahan
    // role oleh Admin langsung berlaku.
    const { data: me } = await supabaseAdmin.from("User").select("role").eq("id", session.user.id).maybeSingle();
    if (isProtectedAccountEmail(session.user.email) || isViewerRole(me?.role)) {
      return { error: "Profil akun ini dikelola langsung oleh pengurus dan tidak bisa diganti sendiri.", success: false };
    }

    const name = formData.get("name") as string;
    if (!name || name.trim().length < 2) {
      return { error: "Nama lengkap minimal 2 karakter.", success: false };
    }

    const newName = name.trim();
    const { error } = await supabaseAdmin.from("User").update({ name: newName }).eq("id", session.user.id);

    if (error) {
      return { error: "Gagal memperbarui profil.", success: false };
    }

    // Perbarui session cookie NextAuth
    await update({ user: { name: newName } });

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

// Email asli untuk menerima notifikasi Kalender Kegiatan (kolom notifyEmail, migrasi 037). Sengaja
// TERPISAH dari updateNameAction dan lebih longgar: akun KONTRIBUTOR (mis. sekretaris) dikunci dari
// ganti nama/password, tapi alamat kontaknya tetap harus bisa diisi sendiri — lagipula halaman
// admin tempat mengisinya khusus ADMIN. Yang tetap ditolak: akun bersama dan Akun Umum (VIEWER),
// karena keduanya memang tidak menerima notifikasi (lihat isAgendaRecipient di lib/agenda.ts).
export async function updateNotifyEmailAction(prevState: unknown, formData: FormData) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { error: "Silakan login terlebih dahulu.", success: false };
    }

    // Role dibaca dari database (bukan sesi) supaya perubahan role oleh Admin langsung berlaku.
    const { data: me } = await supabaseAdmin.from("User").select("email, role").eq("id", session.user.id).maybeSingle();
    if (!me) return { error: "User tidak ditemukan.", success: false };
    if (isProtectedAccountEmail(me.email) || isViewerRole(me.role)) {
      return { error: "Akun ini tidak menerima notifikasi email.", success: false };
    }

    const parsed = parseNotifyEmail(formData.get("notifyEmail"));
    if (!parsed.ok) return { error: parsed.error, success: false };

    const { error } = await supabaseAdmin.from("User").update({ notifyEmail: parsed.value }).eq("id", session.user.id);
    if (error?.code === "42703") return { error: "Fitur email notifikasi belum siap. Hubungi pengurus.", success: false };
    if (error) return { error: "Gagal menyimpan email notifikasi.", success: false };

    revalidatePath("/profile");
    return { error: null, success: true };
  } catch {
    return { error: "Terjadi kesalahan sistem.", success: false };
  }
}
