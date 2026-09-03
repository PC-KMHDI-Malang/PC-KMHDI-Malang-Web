"use server";

import { supabaseAdmin } from "@/lib/supabase";
import { auth, update } from "@/lib/auth";
import bcrypt from "bcryptjs";
import { revalidatePath } from "next/cache";

export async function updateNameAction(prevState: unknown, formData: FormData) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { error: "Silakan login terlebih dahulu.", success: false };
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

    if (!currentPassword || !newPassword || newPassword.length < 6) {
      return { error: "Data tidak valid atau password kurang dari 6 karakter.", success: false };
    }

    const { data: user } = await supabaseAdmin.from("User").select("password").eq("id", session.user.id).single();

    if (!user) return { error: "User tidak ditemukan.", success: false };

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
