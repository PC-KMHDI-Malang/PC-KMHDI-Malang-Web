"use server";

import { supabaseAdmin } from "@/lib/supabase";
import { auth } from "@/lib/auth";
import bcrypt from "bcryptjs";
import { revalidatePath } from "next/cache";

export async function updatePasswordAction(prevState: any, formData: FormData) {
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

    const { data: user } = await supabaseAdmin
      .from("User")
      .select("password")
      .eq("id", session.user.id)
      .single();

    if (!user) return { error: "User tidak ditemukan.", success: false };

    const isPasswordValid = await bcrypt.compare(currentPassword, user.password);
    if (!isPasswordValid) {
      return { error: "Password saat ini salah.", success: false };
    }

    const hashedNewPassword = await bcrypt.hash(newPassword, 10);
    
    await supabaseAdmin
      .from("User")
      .update({ password: hashedNewPassword })
      .eq("id", session.user.id);

    revalidatePath("/admin/profile");
    revalidatePath("/dashboard/profile");
    
    return { error: null, success: true };
  } catch (error) {
    return { error: "Terjadi kesalahan sistem.", success: false };
  }
}
