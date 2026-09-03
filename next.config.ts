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
  },
  images: {
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
