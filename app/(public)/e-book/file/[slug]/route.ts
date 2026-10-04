import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabase";
import { isProtectedAccountEmail } from "@/lib/protectedAccounts";
import { STORAGE_BUCKETS, getSignedFileUrl } from "@/lib/storage";

// Tombol "Baca Online"/"Download PDF" di halaman detail e-book selalu mengarah ke sini
// (/e-book/file/<slug-e-book>), bukan langsung ke signed URL storage. Signed URL tetap
// kedaluwarsa seperti biasa (itu bagian dari proteksinya) — tapi kalau langsung ditaut ke sana,
// kegagalannya berupa error mentah dari server storage yang tampilan/domain-nya di luar kendali
// kita. Route ini mengambil filenya di server (bukan redirect ke storage), lalu meneruskan isinya
// ke browser — kalau gagal/kedaluwarsa, yang muncul adalah halaman e-book kita sendiri dengan
// pesan yang wajar.
//
// URL-nya sengaja memakai slug e-book yang sama dengan halaman detailnya (tanpa ID), supaya
// rapi dan mudah dikenali; Chrome dkk. memakai potongan terakhir URL ini sebagai judul tab saat
// menampilkan PDF inline. Nama file saat diunduh diambil dari header Content-Disposition.
// Link lama /api/ebook/[id]/file/[filename] dialihkan ke sini (lihat route di sana).
export async function GET(request: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const { data: ebook } = await supabaseAdmin.from("Ebook").select("slug, pdfUrl, title").eq("slug", slug).maybeSingle();
  const ebookHref = ebook ? `/e-book/${ebook.slug}` : "/e-book";

  const session = await auth();
  const isLoggedIn = !!session?.user && !isProtectedAccountEmail(session.user.email);

  if (!isLoggedIn) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("callbackUrl", ebookHref);
    return NextResponse.redirect(loginUrl);
  }

  if (!ebook) {
    return NextResponse.redirect(new URL("/e-book", request.url));
  }

  const fallback = new URL(ebookHref, request.url);
  fallback.searchParams.set("fileError", "1");

  if (!ebook.pdfUrl) {
    return NextResponse.redirect(fallback);
  }

  const signedUrl = await getSignedFileUrl(STORAGE_BUCKETS.ebookFiles, ebook.pdfUrl, 300);
  if (!signedUrl) {
    return NextResponse.redirect(fallback);
  }

  const upstream = await fetch(signedUrl).catch(() => null);
  if (!upstream || !upstream.ok || !upstream.body) {
    return NextResponse.redirect(fallback);
  }

  const disposition = request.nextUrl.searchParams.get("download") ? "attachment" : "inline";
  const safeName = ebook.title.replace(/[^\w\s.-]/g, "").trim() || "ebook";

  return new NextResponse(upstream.body, {
    headers: {
      "Content-Type": upstream.headers.get("content-type") || "application/pdf",
      "Content-Disposition": `${disposition}; filename="${safeName}.pdf"`,
      "Cache-Control": "private, no-store",
    },
  });
}
