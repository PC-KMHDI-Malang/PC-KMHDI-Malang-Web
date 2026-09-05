import { NextRequest, NextResponse } from "next/server";

// Halaman artikel dipindah ke root (/nama-artikel, tanpa "/berita/" dan tanpa akhiran angka
// timestamp) — lihat app/(public)/[slug]/page.tsx. Route ini sengaja dibiarkan sebagai
// redirect permanen, supaya tautan lama yang sudah pernah dibagikan (WhatsApp, Google, dst.)
// dengan format /berita/nama-artikel tidak berakhir 404.
export async function GET(request: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  return NextResponse.redirect(new URL(`/${slug}`, request.url), 308);
}
