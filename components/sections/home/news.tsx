import Image from "next/image";
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
    <section id="berita" className="bg-slate-50 dark:bg-[#0a0a0a] py-16 md:py-24 lg:py-32 transition-colors">
      <div className="mx-auto max-w-7xl px-5 sm:px-6 lg:px-8">
        {/* Header */}

        <div className="mx-auto max-w-3xl text-center">
          <span className="inline-flex rounded-full bg-red-100 dark:bg-red-950/40 px-4 py-2 text-sm font-semibold text-red-700 dark:text-red-400">
            {fallbackData.badge}
          </span>

          <h2 className="mt-6 text-3xl font-bold text-slate-900 dark:text-white sm:text-4xl lg:text-5xl">
            {fallbackData.title}
          </h2>

          <p className="mt-6 text-base leading-8 text-slate-600 dark:text-slate-400 md:text-lg">
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
            className="inline-flex items-center gap-2 rounded-2xl bg-red-700 px-7 py-4 font-semibold text-white transition duration-300 hover:bg-red-800"
          >
            {fallbackData.button.label}

            <ArrowRight size={18} />
          </Link>
        </div>
      </div>
    </section>
  );
}