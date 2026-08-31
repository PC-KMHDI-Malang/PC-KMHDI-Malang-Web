"use server";

import { signIn } from "@/lib/auth";
import { AuthError } from "next-auth";

export async function loginAction(formData: FormData) {
  try {
    const callbackUrl = formData.get("callbackUrl") as string | null;
    const redirectTo = callbackUrl && callbackUrl.startsWith("/") ? callbackUrl : "/admin";

    await signIn("credentials", {
      email: formData.get("email"),
      password: formData.get("password"),
      redirectTo,
    });
  } catch (error) {
    if (error instanceof AuthError) {
      return { error: "Email atau password salah." };
    }

    throw error;
  }
}