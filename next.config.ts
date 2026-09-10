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

const nextConfig: NextConfig = {
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
    ],
  },
};

export default nextConfig;
