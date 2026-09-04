import type { MetadataRoute } from "next";
import { absoluteUrl, siteConfig } from "@/lib/site";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      // Admin tooling, auth screens, account settings, the kader account directory, and API
      // routes hold nothing worth indexing and should never surface in search results.
      disallow: ["/admin", "/login", "/profile", "/informasi-akun", "/api/"],
    },
    sitemap: absoluteUrl("/sitemap.xml"),
    host: siteConfig.url,
  };
}
