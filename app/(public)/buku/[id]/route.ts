import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";

// Halaman detail e-Book dipindah ke "/e-book/nama-buku" (slug, bukan UUID) — lihat
// app/(public)/e-book/[slug]/page.tsx. Route ini sengaja dibiarkan sebagai redirect permanen,
// supaya tautan lama berformat "/buku/<uuid>" yang sudah pernah dibagikan tidak berakhir 404.
export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { data: ebook } = await supabaseAdmin.from("Ebook").select("slug").eq("id", id).maybeSingle();
  return NextResponse.redirect(new URL(`/e-book/${ebook?.slug || id}`, request.url), 308);
}
