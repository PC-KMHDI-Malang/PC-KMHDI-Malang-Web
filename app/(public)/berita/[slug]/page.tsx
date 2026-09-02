import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, CalendarDays, User as UserIcon, Tag, Share2, Eye } from "lucide-react";
import { supabaseAdmin } from "@/lib/supabase";
import { EbookShareBar } from "@/components/ui/EbookShareBar";
import { SafeImage } from "@/components/ui/SafeImage";

export default async function NewsDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;

  const { data: news } = await supabaseAdmin.from("News").select("*, Category(name), author:User!authorId(name)").eq("slug", slug).eq("status", "PUBLISHED").single();

  if (!news) {
    notFound();
  }

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

  return (
    <article className="-mt-32 bg-white dark:bg-slate-950 transition-colors">
      {/* Dark header behind navbar */}
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
        <span className="inline-flex rounded-full bg-red-100 dark:bg-red-950/40 px-4 py-2 text-sm font-semibold text-red-700 dark:text-red-400">{categoryName}</span>

        {/* Title */}
        <h1 className="mt-6 text-3xl font-bold text-slate-900 dark:text-white sm:text-4xl lg:text-5xl leading-tight">{news.title}</h1>

        {/* Meta Info */}
        <div className="mt-6 flex flex-wrap items-center gap-x-6 gap-y-3 text-sm text-slate-500 dark:text-slate-400">
          <span className="inline-flex items-center gap-2">
            <span className="w-8 h-8 flex items-center justify-center rounded-full bg-red-100 dark:bg-red-950/40 text-red-600 dark:text-red-400">
              <UserIcon size={14} />
            </span>
            <span className="font-medium text-slate-700 dark:text-slate-300">{authorName}</span>
          </span>
          <span className="inline-flex items-center gap-2">
            <span className="w-8 h-8 flex items-center justify-center rounded-full bg-slate-100 dark:bg-white/5 text-slate-500 dark:text-slate-400">
              <CalendarDays size={14} />
            </span>
            <span className="font-medium text-slate-700 dark:text-slate-300">{publishedDate}</span>
          </span>
        </div>

        {/* Cover Image */}
        {news.coverImage && (
          <div className="relative mt-10 h-64 sm:h-80 lg:h-[28rem] w-full overflow-hidden rounded-3xl shadow-lg dark:shadow-black/30">
            <Image src={news.coverImage} alt={news.title} fill className="object-cover" priority />
          </div>
        )}

        {/* Content Tab */}
        <div className="mt-10">
          <div className="flex items-center gap-6 border-b border-slate-100 dark:border-white/5">
            <span className="pb-3 text-sm font-bold text-red-600 dark:text-rose-500 border-b-2 border-red-600 dark:border-rose-500">Isi Berita</span>
          </div>
          <div className="mt-6 prose prose-slate dark:prose-invert max-w-none">
            <p className="whitespace-pre-line text-base leading-8 text-slate-700 dark:text-slate-300">{news.content}</p>
          </div>
        </div>

        {/* Tag & Share Section */}
        <div className="mt-12 pt-8 border-t border-slate-100 dark:border-white/5 flex flex-col sm:flex-row sm:items-center justify-between gap-6">
          <div>
            <p className="text-sm font-semibold text-slate-500 dark:text-slate-400 mb-2">Kategori :</p>
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 dark:bg-white/5 text-slate-600 dark:text-slate-300 rounded-full text-xs font-semibold">
              <Tag size={12} />
              {categoryName}
            </span>
          </div>

          <div>
            <p className="text-sm font-semibold text-slate-500 dark:text-slate-400 mb-2 flex items-center gap-1.5 sm:justify-end">
              <Share2 size={14} />
              Bagikan:
            </p>
            <EbookShareBar title={news.title} />
          </div>
        </div>

        {/* Related News */}
        {related.length > 0 && (
          <div className="mt-16">
            <div className="text-center mb-10">
              <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white">Berita Terkait</h2>
              <p className="text-slate-500 dark:text-slate-400 mt-2">Berita lainnya dalam kategori {categoryName}</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {related.map((item) => (
                <Link
                  key={item.id}
                  href={`/berita/${item.slug}`}
                  className="group rounded-2xl border border-slate-100 dark:border-white/5 bg-white dark:bg-[#111111] overflow-hidden hover:shadow-xl dark:hover:shadow-black/50 hover:-translate-y-1 transition-all duration-300"
                >
                  <div className="relative h-40 bg-slate-100 dark:bg-slate-800/50 overflow-hidden">
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
                    <span className="absolute bottom-3 left-3 inline-flex items-center px-2.5 py-1 bg-slate-900/70 text-white rounded-md text-[10px] font-semibold">
                      {new Date(item.publishedAt || item.createdAt).toLocaleDateString("id-ID", { day: "2-digit", month: "short", year: "numeric" })}
                    </span>
                  </div>
                  <div className="p-4">
                    <h3 className="font-bold text-sm text-slate-800 dark:text-white leading-snug line-clamp-2 mb-3 min-h-[2.5rem] group-hover:text-red-600 dark:group-hover:text-rose-500 transition-colors">{item.title}</h3>
                    <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400">
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
