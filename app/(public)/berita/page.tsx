import type { Metadata } from "next";
import { Suspense } from "react";
import Link from "next/link";
import { Search, Newspaper, CalendarDays, User as UserIcon } from "lucide-react";
import { supabaseAdmin } from "@/lib/supabase";
import { SafeImage } from "@/components/ui/SafeImage";
import { NewsCategoryTabs } from "@/components/news/NewsCategoryTabs";
import { NewsSortSelect } from "@/components/news/NewsSortSelect";
import { FeaturedNewsSlider } from "@/components/news/FeaturedNewsSlider";
import { stripHtml } from "@/lib/richText";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Berita & Informasi",
  description:
    "Berita terbaru, siaran pers, opini kader, dan liputan kegiatan PC KMHDI Malang — Kesatuan Mahasiswa Hindu Dharma Indonesia.",
  // Filter and search params (?q, ?sort, ?category) produce the same content in a different
  // order, so they all canonicalise to the clean list URL.
  alternates: { canonical: "/berita" },
  openGraph: {
    type: "website",
    title: "Berita & Informasi | PC KMHDI Malang",
    description: "Berita terbaru, siaran pers, opini kader, dan liputan kegiatan PC KMHDI Malang.",
    url: "/berita",
  },
};

interface BeritaPageProps {
  searchParams: Promise<{ q?: string; sort?: string; category?: string }>;
}

export default async function BeritaPage({ searchParams: searchParamsPromise }: BeritaPageProps) {
  const searchParams = await searchParamsPromise;
  const query = searchParams?.q || "";
  const sortFilter = searchParams?.sort || "newest";
  const categoryFilter = searchParams?.category || "";

  // Fetch all categories
  const { data: allCategories } = await supabaseAdmin.from("Category").select("*").order("name");
  const categories = (allCategories || []).map((c) => c.name);

  // Build query
  let dbQuery = supabaseAdmin.from("News").select("*, Category(name), author:User!authorId(name)").eq("status", "PUBLISHED");

  if (query) {
    dbQuery = dbQuery.ilike("title", `%${query}%`);
  }

  if (categoryFilter) {
    const { data: matchingCat } = await supabaseAdmin.from("Category").select("id").eq("name", categoryFilter).single();
    if (matchingCat) {
      dbQuery = dbQuery.eq("categoryId", matchingCat.id);
    }
  }

  if (sortFilter === "oldest") {
    dbQuery = dbQuery.order("createdAt", { ascending: true });
  } else {
    dbQuery = dbQuery.order("createdAt", { ascending: false });
  }

  const { data: news } = await dbQuery;

  // Selalu tampilkan slider di semua tab kategori, KECUALI jika sedang melakukan pencarian (query)
  const showSlider = !query;

  // Ambil 3 teratas untuk slider jika showSlider true
  const featuredItems = showSlider && news && news.length > 0 ? news.slice(0, 3) : [];

  // Sisanya untuk grid. Jika sedang pencarian, tampilkan semua di grid.
  let displayGridNews = showSlider ? (news && news.length > 3 ? news.slice(3) : []) : news || [];
  let fallbackUsed = false;

  // Jika grid kosong (karena kategori ini hanya punya sedikit berita), ambil berita terbaru secara acak agar bagian "Berita Lainnya" tetap terisi
  if (displayGridNews.length === 0 && !query) {
    let fallbackQuery = supabaseAdmin.from("News").select("*, Category(name), author:User!authorId(name)").eq("status", "PUBLISHED");
    if (featuredItems.length > 0) {
      const ids = featuredItems.map((i) => i.id);
      fallbackQuery = fallbackQuery.not("id", "in", `(${ids.join(",")})`);
    }
    fallbackQuery = fallbackQuery.order("createdAt", { ascending: false }).limit(6);

    const { data: fallbackNews } = await fallbackQuery;
    if (fallbackNews && fallbackNews.length > 0) {
      displayGridNews = fallbackNews;
      fallbackUsed = true;
    }
  }

  const formatDate = (dateStr: string) => new Date(dateStr).toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" });

  return (
    <div className="-mt-32 bg-white dark:bg-[#121212] transition-colors min-h-screen pb-12">
      {/* Hero Header */}
      <div className={`bg-gradient-to-br from-red-800 via-red-900 to-red-950 pt-44 relative overflow-hidden ${showSlider ? "pb-28" : "pb-12"}`}>
        {/* Background Glow */}
        <div className="absolute left-0 top-0 h-50 w-50 rounded-full bg-red-500/20 blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 right-0 h-96 w-96 rounded-full bg-red-400/10 blur-3xl pointer-events-none" />

        <div className="relative mx-auto max-w-7xl px-5 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-6 mb-12">
            <div>
              <span className="inline-flex rounded-full border border-white/20 bg-white/10 px-4 py-2 text-sm font-semibold text-red-100 backdrop-blur-xl mb-4">Publikasi</span>
              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-white">Berita & Informasi</h1>
              <p className="text-red-100/80 text-lg mt-4 max-w-xl">Ikuti berbagai informasi, kegiatan, dan perkembangan terbaru dari PC KMHDI Malang.</p>
            </div>
            <form className="flex items-center gap-2 border border-white/20 bg-white/10 backdrop-blur-xl rounded-2xl p-2 w-full sm:w-auto sm:min-w-[320px]">
              <div className="flex items-center gap-2 flex-1 px-3">
                <Search size={16} className="text-red-200" />
                <input type="text" name="q" defaultValue={query} placeholder="Cari berita ..." className="w-full bg-transparent outline-none text-sm text-white placeholder:text-red-200/50" />
              </div>
              <button type="submit" className="bg-white text-red-900 px-5 py-2 rounded-xl text-sm font-bold transition hover:scale-105 shrink-0 shadow-sm">
                Cari
              </button>
            </form>
          </div>

          {/* Category Tabs */}
          <Suspense fallback={null}>
            <NewsCategoryTabs categories={categories} />
          </Suspense>
        </div>
      </div>

      <div className={`relative z-10 mx-auto max-w-7xl px-5 sm:px-6 lg:px-8 ${showSlider ? "-mt-16" : "mt-8"}`}>
        {/* Featured Article Slider */}
        {showSlider && <FeaturedNewsSlider items={featuredItems} />}

        {/* Articles Grid */}
        {displayGridNews.length > 0 ? (
          <>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8 mt-6">
              <div className="flex flex-wrap items-center gap-4">
                <h3 className="text-xl font-bold text-slate-900 dark:text-white">
                  {query ? `Hasil pencarian "${query}"` : categoryFilter ? (fallbackUsed ? "Berita Terbaru Lainnya" : `Berita ${categoryFilter} Lainnya`) : "Berita Lainnya"}
                </h3>
                {query && (
                  <Link
                    href={`/berita${categoryFilter ? `?category=${categoryFilter}` : ""}`}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 rounded-full hover:bg-red-200 dark:hover:bg-red-900/50 transition-colors"
                  >
                    Bersihkan Pencarian
                  </Link>
                )}
              </div>
              <Suspense fallback={null}>
                <NewsSortSelect />
              </Suspense>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pb-20">
              {displayGridNews.map((item) => (
                <Link
                  key={item.id}
                  href={`/berita/${item.slug}`}
                  className="group flex flex-col sm:flex-row rounded-2xl overflow-hidden bg-white dark:bg-[#1A1A1A] border border-slate-200/80 dark:border-white/5 shadow-md hover:shadow-xl hover:border-red-200 dark:hover:border-red-500/30 hover:-translate-y-1 transition-all duration-300"
                >
                  <div className="relative w-full sm:w-48 h-44 sm:h-auto shrink-0 overflow-hidden bg-neutral-100 dark:bg-neutral-800">
                    <SafeImage src={item.coverImage} alt={item.title} fill className="object-cover group-hover:scale-105 transition-transform duration-500" />
                    <span className="absolute top-3 left-3 sm:top-2 sm:left-2 inline-flex items-center px-2.5 py-1 bg-red-600 text-white rounded-full text-[10px] font-bold uppercase tracking-wide shadow">
                      {item.Category?.name || "UMUM"}
                    </span>
                  </div>
                  <div className="p-5 flex flex-col justify-center flex-1 min-w-0 bg-white dark:bg-[#1A1A1A]">
                    <h3 className="text-base font-bold text-slate-900 dark:text-white leading-snug line-clamp-2 group-hover:text-red-600 dark:group-hover:text-red-400 transition-colors">{item.title}</h3>
                    {item.content && <p className="mt-2 text-sm text-slate-600 dark:text-neutral-400 line-clamp-2 leading-relaxed">{stripHtml(item.content)}</p>}
                    <div className="mt-3 flex items-center gap-4 text-xs text-slate-500 dark:text-neutral-500">
                      <span className="inline-flex items-center gap-1">
                        <UserIcon size={12} />
                        {item.authorName || item.author?.name || "Admin KMHDI"}
                      </span>
                      <span className="inline-flex items-center gap-1">
                        <CalendarDays size={12} />
                        {formatDate(item.publishedAt || item.createdAt)}
                      </span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </>
        ) : (!showSlider && displayGridNews.length === 0) || (showSlider && featuredItems.length === 0 && displayGridNews.length === 0) ? (
          <div className="py-24 flex flex-col items-center justify-center text-slate-500 dark:text-neutral-500 bg-white dark:bg-[#1A1A1A] border border-slate-200/80 dark:border-white/5 rounded-3xl shadow-sm mb-16 px-5 text-center">
            <Newspaper size={40} className="mb-4 text-slate-400 dark:text-neutral-600 opacity-60" />
            <p className="text-lg font-medium text-slate-700 dark:text-neutral-300 mb-4">{query ? `Tidak ada berita yang cocok dengan kata kunci "${query}".` : "Belum ada berita untuk kategori ini."}</p>
            {query && (
              <Link
                href={`/berita${categoryFilter ? `?category=${categoryFilter}` : ""}`}
                className="inline-flex items-center gap-1.5 px-5 py-2.5 text-sm font-semibold bg-red-600 text-white rounded-full hover:bg-red-700 transition-colors shadow-sm"
              >
                Bersihkan Pencarian
              </Link>
            )}
          </div>
        ) : null}
      </div>
    </div>
  );
}
