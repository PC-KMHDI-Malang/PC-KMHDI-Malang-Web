import type { MetadataRoute } from "next";
import { siteConfig } from "@/lib/site";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: `${siteConfig.name} — ${siteConfig.legalName}`,
    short_name: siteConfig.name,
    description: siteConfig.description,
    start_url: "/",
    display: "standalone",
    background_color: "#0a0a0a",
    theme_color: "#0a0a0a",
    lang: "id",
    icons: [
      { src: "/image/logo-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/image/logo-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
    ],
  };
}
