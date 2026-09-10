"use server";

import { incrementViewCount } from "@/lib/views";

// Dipanggil dari client (ViewCounter.tsx) setelah halaman artikel di-cache statis — server
// component halaman itu sendiri tidak lagi menambah hitungan "dilihat" sendiri, karena kalau
// begitu, angkanya cuma bertambah sekali per render-ulang cache, bukan sekali per kunjungan.
export async function incrementViewCountAction(table: "News" | "Ebook", id: string) {
  if (table !== "News" && table !== "Ebook") return null;
  if (!id || typeof id !== "string") return null;
  return incrementViewCount(table, id);
}
