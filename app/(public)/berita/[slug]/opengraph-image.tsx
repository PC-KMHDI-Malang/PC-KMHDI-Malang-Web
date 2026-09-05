import { ImageResponse } from "next/og";
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { supabaseAdmin } from "@/lib/supabase";

export const alt = "Cover Berita PC KMHDI Malang";
export const size = { width: 1080, height: 1080 };
export const contentType = "image/png";

// Admin mengunggah cover berita sebagai landscape (pas untuk banner di halaman artikel —
// lihat gambar cover di page.tsx), tapi WhatsApp menampilkan link preview sebagai kartu besar
// penuh lebar hanya kalau gambarnya mendekati persegi; landscape cuma jadi thumbnail kecil.
// Route ini men-generate versi cover persegi (crop tengah, seperti object-fit: cover) khusus
// untuk og:image — cover asli yang landscape di halaman artikel tidak berubah sama sekali.
export default async function BeritaOpengraphImage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const { data: news } = await supabaseAdmin.from("News").select("title, coverImage").eq("slug", slug).eq("status", "PUBLISHED").maybeSingle();

  if (!news?.coverImage) {
    // Tidak ada cover — pakai og-image default situs (logo + wordmark) sebagai fallback,
    // sama seperti yang dipakai halaman lain yang tidak punya gambarnya sendiri.
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
        {/* Crop tengah otomatis oleh objectFit: "cover" di kanvas persegi — sama seperti CSS object-cover. */}
        <img src={news.coverImage} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
      </div>
    ),
    size,
  );
}
