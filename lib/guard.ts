import type { Session } from "next-auth";

import { auth } from "@/lib/auth";
import { isAdminPanelRole } from "@/lib/roles";

// Server Action itu endpoint HTTP publik begitu di-build: middleware hanya menjaga URL halaman,
// bukan action-nya, dan action ID bersifat global — sebuah POST yang dibuat di luar UI bisa
// memanggil action milik /admin/* dari path mana pun. Jadi setiap action yang menulis data
// WAJIB memeriksa sesinya sendiri lewat helper di bawah, bukan mengandalkan pengecekan role
// yang ada di badan komponen halaman (itu cuma menentukan apa yang dirender).

type AuthorizedSession = Session & { user: NonNullable<Session["user"]> };

export async function requireAdmin(): Promise<AuthorizedSession> {
  const session = await auth();
  if (!session?.user || session.user.role !== "ADMIN") throw new Error("Unauthorized");
  return session as AuthorizedSession;
}

export async function requireAdminPanel(): Promise<AuthorizedSession> {
  const session = await auth();
  if (!session?.user || !isAdminPanelRole(session.user.role)) throw new Error("Unauthorized");
  return session as AuthorizedSession;
}
