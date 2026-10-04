import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";

// Alamat lama file PDF e-book (/api/ebook/<id>/file/<nama>.pdf). Sekarang PDF dilayani di
// /e-book/file/<slug-e-book> (lihat app/(public)/e-book/file/[slug]/route.ts) — route ini
// cuma mengalihkan link lama yang sudah terlanjur dibagikan/di-bookmark ke alamat baru,
// termasuk parameter ?download=1. Pemeriksaan login dilakukan di alamat baru.
export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { data: ebook } = await supabaseAdmin.from("Ebook").select("slug").eq("id", id).maybeSingle();

  if (!ebook?.slug) {
    return NextResponse.redirect(new URL("/e-book", request.url));
  }

  const target = new URL(`/e-book/file/${ebook.slug}`, request.url);
  if (request.nextUrl.searchParams.get("download")) target.searchParams.set("download", "1");
  return NextResponse.redirect(target, 308);
}
