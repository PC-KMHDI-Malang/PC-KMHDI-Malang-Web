import type { MetadataRoute } from "next";
import { supabaseAdmin } from "@/lib/supabase";
import { absoluteUrl } from "@/lib/site";

// Regenerate hourly so newly published articles and e-Books get discovered without a redeploy.
export const revalidate = 3600;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date();

  const staticRoutes: MetadataRoute.Sitemap = [
    { url: absoluteUrl("/"), lastModified: now, changeFrequency: "weekly", priority: 1 },
    { url: absoluteUrl("/profil"), lastModified: now, changeFrequency: "monthly", priority: 0.8 },
    { url: absoluteUrl("/berita"), lastModified: now, changeFrequency: "daily", priority: 0.9 },
    { url: absoluteUrl("/buku"), lastModified: now, changeFrequency: "weekly", priority: 0.8 },
    { url: absoluteUrl("/galeri"), lastModified: now, changeFrequency: "weekly", priority: 0.7 },
  ];

  // A sitemap must never break the build, so a failed query just yields the static routes.
  const [newsResult, ebookResult] = await Promise.allSettled([
    supabaseAdmin.from("News").select("slug, updatedAt, publishedAt, createdAt").eq("status", "PUBLISHED"),
    supabaseAdmin.from("Ebook").select("id, updatedAt, createdAt"),
  ]);

  const newsRoutes: MetadataRoute.Sitemap =
    newsResult.status === "fulfilled"
      ? (newsResult.value.data ?? [])
          .filter((item) => item.slug)
          .map((item) => ({
            url: absoluteUrl(`/berita/${item.slug}`),
            lastModified: new Date(item.updatedAt || item.publishedAt || item.createdAt),
            changeFrequency: "monthly" as const,
            priority: 0.7,
          }))
      : [];

  const ebookRoutes: MetadataRoute.Sitemap =
    ebookResult.status === "fulfilled"
      ? (ebookResult.value.data ?? []).map((item) => ({
          url: absoluteUrl(`/buku/${item.id}`),
          lastModified: new Date(item.updatedAt || item.createdAt),
          changeFrequency: "monthly" as const,
          priority: 0.6,
        }))
      : [];

  return [...staticRoutes, ...newsRoutes, ...ebookRoutes];
}
