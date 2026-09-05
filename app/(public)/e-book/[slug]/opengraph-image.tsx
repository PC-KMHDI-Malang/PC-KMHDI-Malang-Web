import { ImageResponse } from "next/og";
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { supabaseAdmin } from "@/lib/supabase";

export const alt = "Cover e-Book PC KMHDI Malang";
export const size = { width: 1080, height: 1080 };
export const contentType = "image/png";

// Sama seperti berita/[slug]/opengraph-image.tsx: cover e-book biasanya portrait (rasio buku),
// bukan persegi — kalau ditaut langsung sebagai og:image, WhatsApp menampilkannya sebagai
// thumbnail kecil di link preview, bukan kartu besar penuh lebar. Route ini men-generate versi
// persegi (crop tengah) khusus untuk og:image, tanpa mengubah cover asli di halaman e-book itu sendiri.
export default async function BukuOpengraphImage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const { data: ebook } = await supabaseAdmin.from("Ebook").select("title, coverImage").eq("slug", slug).maybeSingle();

  if (!ebook?.coverImage) {
    const logo = await readFile(join(process.cwd(), "public", "image", "logo-512.png"));
    const logoSrc = `data:image/png;base64,${logo.toString("base64")}`;
    return new ImageResponse(
      (
        <div
          style={{
            width: "100%",
            height: "100%",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            backgroundColor: "#0a0a0a",
            backgroundImage: "radial-gradient(ellipse 70% 60% at 50% 40%, rgba(153,27,27,0.65), transparent 70%)",
          }}
        >
          <img src={logoSrc} width={420} height={420} alt="" style={{ objectFit: "contain" }} />
        </div>
      ),
      size,
    );
  }

  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", position: "relative", backgroundColor: "#0a0a0a" }}>
        {/* Cover buku portrait di-blur & diperbesar sebagai latar, supaya sisi kiri-kanan yang
            kosong (akibat crop persegi dari gambar portrait) tidak polos kosong. */}
        <img src={ebook.coverImage} alt="" style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover", filter: "blur(40px) brightness(0.5)", transform: "scale(1.2)" }} />
        <img src={ebook.coverImage} alt="" style={{ position: "relative", margin: "auto", height: "92%", objectFit: "contain", boxShadow: "0 30px 80px rgba(0,0,0,0.6)", borderRadius: 12 }} />
      </div>
    ),
    size,
  );
}
