/**
 * Central site metadata, shared by the root layout, sitemap, robots, and JSON-LD.
 *
 * The canonical origin comes from NEXT_PUBLIC_SITE_URL so a domain change only needs an
 * environment variable update (e.g. in the Vercel dashboard), never a code change.
 */
const rawUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://pc-kmhdi-malang-web.vercel.app";

export const siteConfig = {
  name: "PC KMHDI Malang",
  legalName: "Pimpinan Cabang Kesatuan Mahasiswa Hindu Dharma Indonesia Malang",
  url: rawUrl.replace(/\/+$/, ""),
  locale: "id_ID",
  description:
    "Website resmi PC KMHDI Malang — pusat informasi, berita, e-Book, dan dokumentasi kegiatan Kesatuan Mahasiswa Hindu Dharma Indonesia se-Malang Raya.",
  instagram: "https://www.instagram.com/pc.kmhdimalang",
  address: {
    street: "Asrama Mahasiswa Bali Gunung Agung, Jalan Kartini No. 30",
    locality: "Klojen, Kota Malang",
    region: "Jawa Timur",
    country: "ID",
  },
} as const;

/** Builds an absolute URL, required by sitemap.xml, robots.txt, and JSON-LD. */
export function absoluteUrl(path = "/") {
  return `${siteConfig.url}${path.startsWith("/") ? path : `/${path}`}`;
}
