import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabase";
import { isTreasurerEmail } from "@/lib/kas";
import { getSignedFileUrl } from "@/lib/storage";
import { KAS_PROOF_BUCKET } from "@/lib/uploadLimits";

// Menampilkan foto bukti pembayaran iuran (/kas/bukti/<id baris KasIuran>). Bukti tersimpan di
// bucket privat; route ini memeriksa sesi lalu mengambilkan filenya di server — pola yang sama
// dengan PDF e-book (app/(public)/e-book/file/[slug]/route.ts), jadi alamat storage tidak pernah
// terlihat. Yang boleh membuka hanya pemilik iuran itu sendiri dan akun bendahara.
export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const session = await auth();
  if (!session?.user?.id) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("callbackUrl", "/kas");
    return NextResponse.redirect(loginUrl);
  }

  const { data: row } = await supabaseAdmin.from("KasIuran").select("userId, proofUrl").eq("id", id).maybeSingle();
  const allowed = !!row && (row.userId === session.user.id || isTreasurerEmail(session.user.email));
  if (!allowed || !row?.proofUrl) {
    return new NextResponse("Bukti pembayaran tidak ditemukan.", { status: 404, headers: { "Cache-Control": "private, no-store" } });
  }

  const signedUrl = await getSignedFileUrl(KAS_PROOF_BUCKET, row.proofUrl, 300);
  const upstream = signedUrl ? await fetch(signedUrl).catch(() => null) : null;
  if (!upstream || !upstream.ok || !upstream.body) {
    return new NextResponse("Bukti pembayaran tidak dapat dibuka. Coba lagi nanti.", { status: 502, headers: { "Cache-Control": "private, no-store" } });
  }

  return new NextResponse(upstream.body, {
    headers: {
      "Content-Type": upstream.headers.get("content-type") || "image/jpeg",
      "Content-Disposition": "inline",
      "Cache-Control": "private, no-store",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
