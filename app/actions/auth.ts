"use server";

import { signOut } from "@/lib/auth";

export async function logoutAction(formData?: FormData) {
  await signOut({ redirectTo: "/login" });
}
