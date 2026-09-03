import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { supabaseAdmin } from "@/lib/supabase";

import { newsData as fallbackData } from "@/data/news";
import { NewsCarousel } from "@/components/ui/NewsCarousel";

export default async function News() {
  const { data: latestNews } = await supabaseAdmin
    .from("News")
    .select("*, Category(name)")
    .eq("status", "PUBLISHED")
    .order("createdAt", { ascending: false }); // No limit, fetch all for carousel

  const displayNews = latestNews && latestNews.length > 0 ? latestNews.map(n => ({
    id: n.id,
    title: n.title,
    image: n.coverImage,
    category: n.Category?.name || "UMUM",
    date: new Date(n.createdAt).toLocaleDateString("id-ID", { day: 'numeric', month: 'long', year: 'numeric' }),
    href: `/berita/${n.slug}`,
  })) : fallbackData.news;

  return (
    <section id="berita" className="relative overflow-hidden bg-white py-20 md:py-28">
      {/* Subtle Background Glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-[500px] w-[500px] rounded-full bg-rose-500/5 blur-[140px] pointer-events-none" />

      <div className="relative mx-auto max-w-7xl px-5 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mx-auto max-w-3xl text-center">
          <span className="inline-flex items-center gap-2 rounded-full bg-red-50 border border-red-200 px-4 py-2 text-sm font-semibold text-red-700 shadow-sm">
            {fallbackData.badge}
          </span>

          <h2 className="mt-6 text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl lg:text-5xl">
            {fallbackData.title}
          </h2>

          <p className="mt-6 text-base leading-8 text-slate-600 md:text-lg">
            {fallbackData.description}
          </p>
        </div>

        {/* Cards */}
        <div className="mt-16">
          <NewsCarousel items={displayNews} />
        </div>

        {/* Button */}
        <div className="mt-16 flex justify-center">
          <Link
            href={fallbackData.button.href}
            className="inline-flex items-center gap-2 rounded-2xl bg-gradient-to-r from-red-600 to-rose-500 px-7 py-4 font-semibold text-white shadow-lg shadow-red-600/20 transition-all duration-300 hover:shadow-xl hover:shadow-red-600/30 hover:scale-[1.02]"
          >
            {fallbackData.button.label}
            <ArrowRight size={18} />
          </Link>
        </div>
      </div>
    </section>
  );
}
