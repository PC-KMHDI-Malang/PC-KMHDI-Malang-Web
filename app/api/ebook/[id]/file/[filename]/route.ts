import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabase";
import { isProtectedAccountEmail } from "@/lib/protectedAccounts";
import { STORAGE_BUCKETS, getSignedFileUrl } from "@/lib/storage";

// Tombol "Baca Online"/"Download PDF" di halaman detail e-book selalu mengarah ke sini,
// bukan langsung ke signed URL Supabase. Signed URL Supabase tetap kedaluwarsa seperti biasa
// (itu bagian dari proteksinya) — tapi kalau langsung ditaut ke sana, kegagalannya berupa
// JSON error mentah dari server Supabase ("InvalidJWT") yang tampilan/domain-nya di luar
// kendali kita. Route ini mengambil filenya di server (bukan redirect ke Supabase), lalu
// meneruskan isinya ke browser — kalau gagal/kedaluwarsa, yang muncul adalah halaman e-book
// kita sendiri dengan pesan yang wajar, bukan JSON dari Supabase.
//
// Segmen [filename] di URL sengaja tidak dipakai untuk logika apa pun — cuma supaya URL-nya
// berakhir dengan "...pdf", karena Chrome (dan browser lain) memakai potongan terakhir URL
// sebagai judul tab saat menampilkan PDF inline, bukan header Content-Disposition di bawah.
export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await auth();
  const isLoggedIn = !!session?.user && !isProtectedAccountEmail(session.user.email);

  if (!isLoggedIn) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("callbackUrl", `/buku/${id}`);
    return NextResponse.redirect(loginUrl);
  }

  const { data: ebook } = await supabaseAdmin.from("Ebook").select("pdfUrl, title").eq("id", id).maybeSingle();

  const fallback = new URL(`/buku/${id}`, request.url);
  fallback.searchParams.set("fileError", "1");

  if (!ebook?.pdfUrl) {
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
