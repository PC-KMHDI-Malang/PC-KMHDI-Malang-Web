import type { NextConfig } from "next";
import dns from "node:dns";

// On networks that resolve hosts via NAT64 (64:ff9b::/96 synthesized IPv6), Next's image
// optimizer SSRF guard (next/dist/server/is-private-ip.js) misclassifies those addresses as
// private and rejects every remote image, even our own Supabase-hosted ones. All affected
// hosts also have real IPv4 addresses, so forcing IPv4-only DNS lookups avoids the bogus
// NAT64 records entirely.
const originalDnsLookup = dns.promises.lookup;
dns.promises.lookup = ((hostname: string, options?: unknown) => {
  const opts = typeof options === "object" && options !== null ? options : {};
  return originalDnsLookup(hostname, { ...opts, family: 4 });
}) as typeof dns.promises.lookup;

// Domain publik bucket gambar Cloudflare R2 (lihat lib/r2.ts). Dibaca saat build, jadi setelah
// env ini diisi/diubah di Vercel perlu deploy ulang supaya next/image mau memuat gambarnya.
const r2PublicHost = (() => {
  try {
    return process.env.NEXT_PUBLIC_R2_PUBLIC_URL ? new URL(process.env.NEXT_PUBLIC_R2_PUBLIC_URL).hostname : null;
  } catch {
    return null;
  }
})();

// Domain sistem (NEXT_PUBLIC_APP_URL, mis. apps.kmhdimalang.org) — lihat lib/appHost.ts.
const appHost = (() => {
  try {
    return process.env.NEXT_PUBLIC_APP_URL ? new URL(process.env.NEXT_PUBLIC_APP_URL).hostname : null;
  } catch {
    return null;
  }
})();

const nextConfig: NextConfig = {
  // Library pembuat laporan PDF/Excel kas (lib/kasExport.ts) dipakai apa adanya dari node_modules,
  // tidak di-bundle: jspdf punya build khusus Node yang hanya terpilih kalau di-require langsung.
  serverExternalPackages: ["jspdf", "jspdf-autotable", "exceljs"],
  experimental: {
    serverActions: {
      bodySizeLimit: "10mb",
    },
    // Tanpa ini, import bernama dari paket-paket ini (mis. `import { X } from "lucide-react"`)
    // ikut menyeret seluruh modul ke bundle client walau cuma beberapa ikon/komponen yang
    // dipakai — Next.js men-transform importnya jadi per-file di build supaya tree-shaking
    // benar-benar memangkas yang tidak dipakai.
    optimizePackageImports: ["lucide-react", "react-icons", "framer-motion"],
  },
  images: {
    // Default Next.js cuma 60 detik, jadi tiap pengunjung baru dalam semenit bisa memicu
    // resize ulang di server untuk gambar yang sama. Aman dibuat panjang di sini karena setiap
    // upload (lib/storage.ts) memberi nama file baru lewat randomUUID() — URL gambar tidak pernah
    // dipakai ulang untuk konten yang berbeda, jadi tidak ada risiko menyajikan versi basi.
    minimumCacheTTL: 2592000,
    remotePatterns: [
      {
        protocol: "https",
        hostname: "**.supabase.co",
      },
      {
        protocol: "https",
        hostname: "fhyojbidfovudztlqjbp.supabase.co",
      },
      {
        protocol: "https",
        hostname: "images.unsplash.com",
      },
      ...(r2PublicHost ? [{ protocol: "https" as const, hostname: r2PublicHost }] : []),
    ],
  },
  // Domain sistem (apps.kmhdimalang.org, lihat lib/appHost.ts) tidak boleh muncul di mesin
  // pencari — semua halamannya diberi X-Robots-Tag noindex. Domain publik tidak terpengaruh.
  async headers() {
    if (!appHost) return [];
    return [{ source: "/:path*", has: [{ type: "host", value: appHost }], headers: [{ key: "X-Robots-Tag", value: "noindex, nofollow" }] }];
  },
};

export default nextConfig;
