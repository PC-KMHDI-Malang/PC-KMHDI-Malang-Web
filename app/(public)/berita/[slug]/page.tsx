import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, CalendarDays, User as UserIcon } from "lucide-react";
import { supabaseAdmin } from "@/lib/supabase";

export default async function NewsDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;

  const { data: news } = await supabaseAdmin
    .from("News")
    .select("*, Category(name), author:User!authorId(name)")
    .eq("slug", slug)
    .eq("status", "PUBLISHED")
    .single();

  if (!news) {
    notFound();
  }

  const publishedDate = new Date(news.publishedAt || news.createdAt).toLocaleDateString("id-ID", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  return (
    <article className="bg-white dark:bg-slate-950 py-16 md:py-24 transition-colors">
      <div className="mx-auto max-w-3xl px-5 sm:px-6 lg:px-8">
        <Link
          href="/#berita"
          className="inline-flex items-center gap-2 text-sm font-semibold text-slate-500 dark:text-slate-400 hover:text-red-700 dark:hover:text-red-500 transition-colors mb-8"
        >
          <ArrowLeft size={16} />
          Kembali ke Beranda
        </Link>

        <span className="inline-flex rounded-full bg-red-100 dark:bg-red-950/40 px-4 py-2 text-sm font-semibold text-red-700 dark:text-red-400">
          {news.Category?.name || "UMUM"}
        </span>

        <h1 className="mt-6 text-3xl font-bold text-slate-900 dark:text-white sm:text-4xl lg:text-5xl leading-tight">
          {news.title}
        </h1>

        <div className="mt-6 flex flex-wrap items-center gap-x-6 gap-y-2 text-sm text-slate-500 dark:text-slate-400">
          <span className="inline-flex items-center gap-2">
            <UserIcon size={16} />
            {news.authorName || news.author?.name || "Admin KMHDI"}
          </span>
          <span className="inline-flex items-center gap-2">
            <CalendarDays size={16} />
            {publishedDate}
          </span>
        </div>

        {news.coverImage && (
          <div className="relative mt-10 h-64 sm:h-80 lg:h-96 w-full overflow-hidden rounded-3xl">
            <Image src={news.coverImage} alt={news.title} fill className="object-cover" priority />
          </div>
        )}

        <div className="mt-10 whitespace-pre-line text-base leading-8 text-slate-700 dark:text-slate-300">
          {news.content}
        </div>
      </div>
    </article>
  );
}
