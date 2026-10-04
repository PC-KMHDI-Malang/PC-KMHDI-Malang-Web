import { supabaseAdmin } from "@/lib/supabase";

// Artikel berita hidup di root ("/nama-artikel", bukan "/berita/nama-artikel") supaya URL-nya
// pendek dan gampang dibagikan — lihat app/(public)/[slug]/page.tsx. Konsekuensinya: slug artikel
// bisa bentrok dengan nama folder rute statis lain di level yang sama. Next.js selalu memenangkan
// rute statis atas rute dinamis ([slug]) kalau namanya sama persis, jadi artikel dengan slug ini
// akan "hilang" secara diam-diam (tidak error, cuma tidak pernah bisa dibuka) — makanya dicegah
// dari awal saat slug dibuat, bukan dibiarkan baru ketahuan setelah admin publish.
const RESERVED_SLUGS = new Set(["admin", "api", "login", "berita", "e-book", "galeri", "mitra", "profil", "profile", "program", "informasi-akun", "sitemap.xml", "robots.txt", "opengraph-image", "favicon.ico"]);

// Setiap rangkaian spasi/tanda baca jadi SATU tanda hubung, dan tanda hubung di awal/akhir
// dibuang. Versi sebelumnya cuma mengganti spasi lalu menghapus tanda baca, jadi judul seperti
// "BPO 1 - Perubahan 4" atau "KMHDI : Pemetaan" berakhir sebagai "bpo-1---perubahan-4" dan
// "kmhdi--pemetaan". Huruf beraksen (mis. "é") disederhanakan ke huruf dasarnya dulu.
// Slug yang sudah tersimpan di database tidak berubah — fungsi ini hanya dipakai saat membuat
// slug baru (slug e-book/artikel tidak dibuat ulang saat diedit).
export function slugify(text: string): string {
  return text
    .normalize("NFKD")
    .replace(/\p{M}/gu, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

// Membuat slug dari judul artikel, dijamin unik (dicek ke tabel News) dan tidak bentrok dengan
// nama rute statis manapun. Kalau bentrok, ditambah -2, -3, dst — bukan timestamp, supaya URL-nya
// tetap pendek dan enak dibaca/dibagikan.
export async function generateUniqueNewsSlug(title: string, excludeId?: string): Promise<string> {
  const base = slugify(title) || "artikel";
  let candidate = base;
  let suffix = 2;

  while (true) {
    if (!RESERVED_SLUGS.has(candidate)) {
      let query = supabaseAdmin.from("News").select("id").eq("slug", candidate);
      if (excludeId) query = query.neq("id", excludeId);
      const { data } = await query.maybeSingle();
      if (!data) return candidate;
    }
    candidate = `${base}-${suffix}`;
    suffix++;
  }
}

// e-Book hidup di bawah "/e-book/nama-buku" (bukan root), jadi tidak perlu dicek terhadap
// RESERVED_SLUGS di atas — cukup unik di dalam tabel Ebook sendiri.
export async function generateUniqueEbookSlug(title: string, excludeId?: string): Promise<string> {
  const base = slugify(title) || "ebook";
  let candidate = base;
  let suffix = 2;

  while (true) {
    let query = supabaseAdmin.from("Ebook").select("id").eq("slug", candidate);
    if (excludeId) query = query.neq("id", excludeId);
    const { data } = await query.maybeSingle();
    if (!data) return candidate;
    candidate = `${base}-${suffix}`;
    suffix++;
  }
}
