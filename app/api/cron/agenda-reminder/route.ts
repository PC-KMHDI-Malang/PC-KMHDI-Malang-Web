import { timingSafeEqual } from "node:crypto";
import { NextResponse } from "next/server";

import { supabaseAdmin } from "@/lib/supabase";
import { jakartaDayRange, tomorrowInJakarta } from "@/lib/date";
import type { Agenda } from "@/lib/agenda";
import { dispatchAgendaNotification, type DispatchSummary } from "@/lib/notify/dispatch";

// Pengingat H-1: dipanggil Vercel Cron tiap hari (lihat vercel.json), mencari agenda terbit yang
// mulai BESOK menurut WIB, lalu mengirim notifikasi "Besok: …" lewat dispatcher yang sama dengan
// pengumuman agenda baru. Aman dipanggil berulang: dispatcher mengklaim tiap pengiriman di tabel
// NotificationDelivery, jadi panggilan kedua di hari yang sama melaporkan claimed = 0.
//
// Endpoint ini publik secara URL (/api tidak lewat middleware), jadi WAJIB diautentikasi sendiri.
// Vercel otomatis mengirim "Authorization: Bearer <CRON_SECRET>" kalau env CRON_SECRET diatur.

export const dynamic = "force-dynamic";

function isAuthorized(request: Request, secret: string): boolean {
  const header = request.headers.get("authorization") ?? "";
  const expected = `Bearer ${secret}`;
  const a = Buffer.from(header);
  const b = Buffer.from(expected);
  // timingSafeEqual melempar kalau panjangnya beda, jadi cek panjang dulu.
  return a.length === b.length && timingSafeEqual(a, b);
}

export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET;
  // Tanpa secret, endpoint ditutup total — jangan pernah "terbuka kalau env lupa diisi".
  if (!secret) return NextResponse.json({ error: "CRON_SECRET belum diatur di server." }, { status: 503 });
  if (!isAuthorized(request, secret)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const date = tomorrowInJakarta();
  const range = jakartaDayRange(date);

  const { data, error } = await supabaseAdmin
    .from("Agenda")
    .select("*")
    .eq("status", "PUBLISHED")
    // Pengingat berdiri sendiri dari pengumuman: cukup remindH1 menyala, sudah diumumkan atau belum.
    .eq("remindH1", true)
    .gte("startAt", range.start)
    .lte("startAt", range.end)
    .order("startAt", { ascending: true });

  if (error) {
    console.error("[cron:agenda-reminder] gagal membaca agenda:", error.message);
    return NextResponse.json({ error: "Gagal membaca agenda." }, { status: 500 });
  }

  const agenda = (data ?? []) as Agenda[];
  const results: DispatchSummary[] = [];
  // Berurutan, bukan paralel: jumlah agenda per hari kecil, dan ini menjaga laju kirim ke Resend.
  for (const item of agenda) results.push(await dispatchAgendaNotification(item, "REMINDER_H1"));

  return NextResponse.json({ date, agenda: agenda.length, results });
}
