import { NextRequest, NextResponse } from "next/server";

// Koleksi e-Book dipindah dari "/buku" ke "/e-book" — lihat app/(public)/e-book/page.tsx.
// Route ini sengaja dibiarkan sebagai redirect permanen, supaya tautan lama yang sudah pernah
// dibagikan tidak berakhir 404.
export async function GET(request: NextRequest) {
  return NextResponse.redirect(new URL("/e-book", request.url), 308);
}
