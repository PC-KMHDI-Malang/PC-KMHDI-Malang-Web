import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, CalendarDays, User as UserIcon, Tag, Share2, Eye } from "lucide-react";
import { supabaseAdmin } from "@/lib/supabase";
import { EbookShareBar } from "@/components/ui/EbookShareBar";
import { SafeImage } from "@/components/ui/SafeImage";
import { JsonLd } from "@/components/seo/JsonLd";
import { absoluteUrl } from "@/lib/site";
import { looksLikeHtml, stripHtml } from "@/lib/richText";
import { incrementViewCount, formatViewCount } from "@/lib/views";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const { data: news } = await supabaseAdmin.from("News").select("title, excerpt, coverImage, authorName, Category(name)").eq("slug", slug).eq("status", "PUBLISHED").single();

  if (!news) {
    return { title: "Berita Tidak Ditemukan" };
  }

  const desc = news.excerpt || "Ikuti berita dan informasi terbaru dari PC KMHDI Malang.";

  return {
    // The "| PC KMHDI Malang" suffix comes from the title template in the root layout.
    title: news.title,
    description: desc,
    alternates: { canonical: `/${slug}` },
    openGraph: {
      title: news.title,
      // Prefix dateline cuma di sini (kartu preview link WA/FB/dll saat link di-paste) — bukan
      // di teks pesan tombol "Bagikan" (lihat EbookShareBar di bawah), karena itu dua konteks
      // yang beda: yang ini otomatis dari metadata halaman, yang itu teks manual yang diketik user.
      description: `Malang, kmhdimalang.org — ${desc}`,
      url: `/${slug}`,
      siteName: "PC KMHDI Malang",
      // Gambarnya sengaja tidak dideklarasikan di sini — opengraph-image.tsx di folder yang
      // sama meng-generate versi persegi (crop tengah) dari cover asli secara otomatis, dan
      // Next.js sudah menyuntikkan tag og:image/twitter:image yang mengarah ke situ sendiri.
      type: "article",
    },
    twitter: {
      card: "summary_large_image",
      title: news.title,
      description: desc,
    },
  };
}

export default async function NewsDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;

  const { data: news } = await supabaseAdmin.from("News").select("*, Category(name), author:User!authorId(name)").eq("slug", slug).eq("status", "PUBLISHED").single();

  if (!news) {
    notFound();
  }

  // Tambah hitungan "dilihat" setiap kali halaman artikel diakses.
  const updatedViews = await incrementViewCount("News", news.id);
  const viewCount = updatedViews ?? news.views ?? 0;

  const publishedDate = new Date(news.publishedAt || news.createdAt).toLocaleDateString("id-ID", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  // Fetch related news (same category, different article)
  let related: (typeof news)[] = [];
  if (news.categoryId) {
    const { data } = await supabaseAdmin.from("News").select("*, Category(name), author:User!authorId(name)").eq("status", "PUBLISHED").eq("categoryId", news.categoryId).neq("id", news.id).order("createdAt", { ascending: false }).limit(3);
    related = data || [];
  }

  const categoryName = news.Category?.name || "UMUM";
  const authorName = news.authorName || news.author?.name || "Admin KMHDI";

  // Makes the article eligible for Google's rich results: headline, publish date, and author
  // can then appear alongside the search listing.
  const articleSchema = {
    "@context": "https://schema.org",
    "@type": "NewsArticle",
    headline: news.title,
    description: news.excerpt || undefined,
    image: news.coverImage ? [news.coverImage] : [absoluteUrl("/opengraph-image")],
    datePublished: new Date(news.publishedAt || news.createdAt).toISOString(),
    dateModified: new Date(news.updatedAt || news.publishedAt || news.createdAt).toISOString(),
    author: { "@type": "Person", name: authorName },
    publisher: { "@id": absoluteUrl("/#organization") },
    articleSection: categoryName,
    inLanguage: "id-ID",
    mainEntityOfPage: { "@type": "WebPage", "@id": absoluteUrl(`/${slug}`) },
  };

  const breadcrumbSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Beranda", item: absoluteUrl("/") },
      { "@type": "ListItem", position: 2, name: "Berita", item: absoluteUrl("/berita") },
      { "@type": "ListItem", position: 3, name: news.title, item: absoluteUrl(`/${slug}`) },
    ],
  };

  return (
    <article className="-mt-32 bg-white dark:bg-[#121212] transition-colors min-h-screen">
      <JsonLd data={articleSchema} />
      <JsonLd data={breadcrumbSchema} />
      {/* Red header behind navbar */}
      <div className="bg-gradient-to-br from-red-800 via-red-900 to-red-950 pt-44 pb-10 relative overflow-hidden">
        <div className="absolute left-0 top-0 h-50 w-50 rounded-full bg-red-500/20 blur-[180px]" />
        <div className="relative mx-auto max-w-4xl px-5 sm:px-6 lg:px-8">
          <Link href="/berita" className="inline-flex items-center gap-2 text-sm font-semibold text-red-100/80 hover:text-white transition-colors">
            <ArrowLeft size={16} />
            Kembali ke Semua Berita
          </Link>
        </div>
      </div>

      <div className="mx-auto max-w-4xl px-5 sm:px-6 lg:px-8 py-10">
        {/* Category Badge */}
        <span className="inline-flex rounded-full bg-red-100 dark:bg-red-900/30 px-4 py-2 text-sm font-semibold text-red-700 dark:text-red-400">{categoryName}</span>

        {/* Title */}
        <h1 className="mt-6 text-3xl font-bold text-slate-900 dark:text-white sm:text-4xl lg:text-5xl leading-tight">{news.title}</h1>

        {/* Meta Info */}
        <div className="mt-6 flex flex-wrap items-center gap-x-6 gap-y-3 text-sm text-slate-600 dark:text-neutral-400">
          <span className="inline-flex items-center gap-2">
            <span className="w-8 h-8 flex items-center justify-center rounded-full bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400">
              <UserIcon size={14} />
            </span>
            <span className="font-medium text-slate-700 dark:text-neutral-300">{authorName}</span>
          </span>
          <span className="inline-flex items-center gap-2">
            <span className="w-8 h-8 flex items-center justify-center rounded-full bg-slate-100 dark:bg-neutral-800 text-slate-500 dark:text-neutral-400">
              <CalendarDays size={14} />
            </span>
            <span className="font-medium text-slate-700 dark:text-neutral-300">{publishedDate}</span>
          </span>
          <span className="inline-flex items-center gap-2">
            <span className="w-8 h-8 flex items-center justify-center rounded-full bg-slate-100 dark:bg-neutral-800 text-slate-500 dark:text-neutral-400">
              <Eye size={14} />
            </span>
            <span className="font-medium text-slate-700 dark:text-neutral-300">{formatViewCount(viewCount)} kali dilihat</span>
          </span>
        </div>

        {/* Cover Image */}
        {news.coverImage && (
          <div className="relative mt-10 h-64 sm:h-80 lg:h-[28rem] w-full overflow-hidden rounded-3xl shadow-xl border border-slate-200/60 dark:border-white/10">
            {/* SafeImage, not a raw next/image: cover URLs can point at hosts outside
                remotePatterns, which makes the optimizer throw and 500s the whole article. */}
            <SafeImage src={news.coverImage} alt={news.title} fill className="object-cover" priority />
          </div>
        )}

        {/* Content Tab */}
        <div className="mt-10">
          <div className="flex items-center gap-6 border-b border-slate-100 dark:border-white/10">
            <span className="pb-3 text-sm font-bold text-red-600 dark:text-red-500 border-b-2 border-red-600 dark:border-red-500">Isi Berita</span>
          </div>
          <div className="mt-6 max-w-none text-base leading-8 text-slate-700 dark:text-neutral-300">
            {/* Dateline ala media massa (kota, domain) di depan paragraf pertama — sama di
                setiap artikel tanpa admin perlu mengetiknya manual. `float-left` (bukan menyisip
                ke string konten) supaya teks paragraf pertama tetap mengalir menyambung di
                baris yang sama, apa pun bentuk konten aslinya (HTML dari editor atau teks polos). */}
            <strong className="float-left mr-1.5 text-slate-900 dark:text-white">Malang, kmhdimalang.org —</strong>
            {news.content && looksLikeHtml(news.content) ? (
              // Konten dari RichTextEditor (hanya bisa ditulis oleh admin lewat toolbar terbatas) — bukan HTML input pengguna umum.
              <div className="rich-content" dangerouslySetInnerHTML={{ __html: news.content }} />
            ) : (
              <p className="whitespace-pre-line">{news.content}</p>
            )}
          </div>
        </div>

        {/* Tag & Share Section */}
        <div className="mt-12 pt-8 border-t border-slate-100 dark:border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-6">
          <div>
            <p className="text-sm font-semibold text-slate-500 dark:text-neutral-400 mb-2">Kategori :</p>
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 dark:bg-neutral-800 text-slate-600 dark:text-neutral-300 rounded-full text-xs font-semibold">
              <Tag size={12} />
              {categoryName}
            </span>
          </div>

          <div>
            <p className="text-sm font-semibold text-slate-500 dark:text-neutral-400 mb-2 flex items-center gap-1.5 sm:justify-end">
              <Share2 size={14} />
              Bagikan:
            </p>
            <EbookShareBar
              title={news.title}
              type="news"
              id={news.id}
              initialLikes={news.likes || 0}
              coverImage={news.coverImage}
              categoryOrGenre={categoryName}
              authorOrPublisher={authorName}
              date={publishedDate}
              description={news.excerpt || stripHtml(news.content).slice(0, 180)}
            />
          </div>
        </div>

        {/* Related News */}
        {related.length > 0 && (
          <div className="mt-16">
            <div className="text-center mb-10">
              <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white">Berita Terkait</h2>
              <p className="text-slate-500 dark:text-neutral-400 mt-2">Berita lainnya dalam kategori {categoryName}</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {related.map((item) => (
                <Link
                  key={item.id}
                  href={`/${item.slug}`}
                  className="group rounded-2xl border border-slate-200/80 dark:border-white/10 bg-white dark:bg-[#1A1A1A] overflow-hidden shadow-sm hover:shadow-xl hover:border-red-200 dark:hover:border-red-500/30 hover:-translate-y-1 transition-all duration-300"
                >
                  <div className="relative h-40 bg-neutral-100 dark:bg-neutral-800 overflow-hidden">
                    <SafeImage src={item.coverImage} alt={item.title} fill className="object-cover group-hover:scale-105 transition-transform duration-500" />
                    <div className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                      <span className="flex flex-col items-center gap-1.5">
                        <span className="w-10 h-10 flex items-center justify-center rounded-full bg-red-600 text-white shadow-lg">
                          <Eye size={18} />
                        </span>
                        <span className="text-white text-xs font-semibold drop-shadow">Baca</span>
                      </span>
                    </div>
                    <span className="absolute top-3 left-3 inline-flex items-center gap-1 px-2.5 py-1 bg-red-600 text-white rounded-md text-[10px] font-bold uppercase tracking-wide">{item.Category?.name || "UMUM"}</span>
                    <span className="absolute bottom-3 left-3 inline-flex items-center px-2.5 py-1 bg-neutral-900/75 text-white rounded-md text-[10px] font-semibold">
                      {new Date(item.publishedAt || item.createdAt).toLocaleDateString("id-ID", { day: "2-digit", month: "short", year: "numeric" })}
                    </span>
                  </div>
                  <div className="p-4 bg-white dark:bg-[#1A1A1A]">
                    <h3 className="font-bold text-sm text-slate-800 dark:text-white leading-snug line-clamp-2 mb-3 min-h-[2.5rem] group-hover:text-red-600 dark:group-hover:text-red-400 transition-colors">{item.title}</h3>
                    <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-neutral-500">
                      <UserIcon size={12} />
                      <span className="font-medium truncate">{item.authorName || item.author?.name || "Admin KMHDI"}</span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>
    </article>
  );
}
