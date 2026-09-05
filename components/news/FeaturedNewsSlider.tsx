"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { ArrowRight, CalendarDays, User as UserIcon } from "lucide-react";
import { SafeImage } from "@/components/ui/SafeImage";
import { stripHtml } from "@/lib/richText";

type FeaturedNews = {
  id: string;
  slug: string;
  title: string;
  content: string;
  coverImage: string;
  publishedAt: string | null;
  createdAt: string;
  authorName: string | null;
  Category?: { name: string } | null;
  author?: { name: string } | null;
};

export function FeaturedNewsSlider({ items }: { items: FeaturedNews[] }) {
  const [currentIndex, setCurrentIndex] = useState(0);

  // Jika jumlah items berubah (misal pindah tab), pastikan index kembali ke 0 atau tetap valid
  const safeIndex = currentIndex >= items.length ? 0 : currentIndex;

  // Auto-slide setiap 4 detik (4000 ms)
  useEffect(() => {
    if (items.length <= 1) return;
    const timer = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % items.length);
    }, 4000);
    return () => clearInterval(timer);
  }, [items.length]);

  const formatDate = (dateStr: string) => new Date(dateStr).toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" });

  if (!items.length) {
    return (
      <div className="relative w-full rounded-3xl overflow-hidden bg-white dark:bg-[#1A1A1A] border border-slate-200/80 dark:border-white/5 shadow-xl mb-10 flex flex-col items-center justify-center min-h-[400px] transition-all duration-300">
        <div className="flex flex-col items-center opacity-50">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="48"
            height="48"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="mb-4 text-slate-400 dark:text-neutral-500"
          >
            <path d="M4 22h16a2 2 0 0 0 2-2V4a2 2 0 0 0-2-2H8a2 2 0 0 0-2 2v16a2 2 0 0 1-2 2Zm0 0a2 2 0 0 1-2-2v-9c0-1.1.9-2 2-2h2" />
            <path d="M18 14h-8" />
            <path d="M15 18h-5" />
            <path d="M10 6h8v4h-8V6Z" />
          </svg>
          <h3 className="text-xl font-bold text-slate-700 dark:text-neutral-300">Belum Ada Artikel</h3>
          <p className="text-slate-500 dark:text-neutral-400 mt-2">Belum ada berita yang dipublikasikan untuk kategori ini.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative w-full rounded-3xl overflow-hidden bg-white dark:bg-[#1A1A1A] border border-slate-200/80 dark:border-white/5 shadow-xl mb-10 hover:shadow-2xl transition-all duration-300">
      <div className="relative flex min-h-[400px]">
        {items.map((item, index) => {
          const isActive = index === safeIndex;
          return (
            <div key={item.id} className={`w-full shrink-0 transition-opacity duration-1000 ease-in-out ${isActive ? "opacity-100 relative z-10" : "opacity-0 absolute inset-0 z-0 pointer-events-none"}`}>
              <Link href={`/${item.slug}`} className="group block h-full">
                <div className="grid grid-cols-1 lg:grid-cols-2 h-full">
                  <div className="relative h-64 lg:h-full lg:min-h-[380px] overflow-hidden bg-neutral-100 dark:bg-neutral-800">
                    <SafeImage src={item.coverImage} alt={item.title} fill className={`object-cover transition-transform duration-1000 ${isActive ? "scale-105" : "scale-100"}`} />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent lg:hidden" />
                  </div>
                  <div className="p-8 lg:p-10 flex flex-col justify-center h-full bg-white dark:bg-[#1A1A1A]">
                    <span className="inline-flex self-start rounded-full bg-red-100 dark:bg-red-900/30 px-3 py-1 text-xs font-bold text-red-700 dark:text-red-400 uppercase tracking-wide mb-4">{item.Category?.name || "UMUM"}</span>
                    <h2 className="text-2xl lg:text-3xl font-extrabold text-slate-900 dark:text-white leading-snug group-hover:text-red-600 dark:group-hover:text-red-400 transition-colors line-clamp-3">{item.title}</h2>
                    {item.content && <p className="mt-4 text-slate-600 dark:text-neutral-400 leading-relaxed line-clamp-3 text-sm lg:text-base">{stripHtml(item.content)}</p>}
                    <div className="mt-6 flex items-center gap-5 text-sm text-slate-500 dark:text-neutral-500">
                      <span className="inline-flex items-center gap-1.5">
                        <UserIcon size={14} />
                        {item.authorName || item.author?.name || "Admin KMHDI"}
                      </span>
                      <span className="inline-flex items-center gap-1.5">
                        <CalendarDays size={14} />
                        {formatDate(item.publishedAt || item.createdAt)}
                      </span>
                    </div>
                    <div className="mt-6">
                      <span className="inline-flex items-center gap-2 text-sm font-bold text-red-600 dark:text-red-500 group-hover:gap-3 transition-all">
                        Baca Selengkapnya
                        <ArrowRight size={16} />
                      </span>
                    </div>
                  </div>
                </div>
              </Link>
            </div>
          );
        })}
      </div>

      {/* Slide Indicators */}
      {items.length > 1 && (
        <div className="absolute bottom-4 right-4 z-20 flex gap-1.5 bg-black/10 dark:bg-white/10 backdrop-blur-md px-3 py-1.5 rounded-full border border-white/10 dark:border-white/5">
          {items.map((_, idx) => (
            <button
              key={idx}
              type="button"
              aria-label={`Slide ${idx + 1}`}
              onClick={(e) => {
                e.preventDefault();
                setCurrentIndex(idx);
              }}
              className={`h-2 rounded-full transition-all duration-300 ${idx === safeIndex ? "w-6 bg-red-600 dark:bg-red-500" : "w-2 bg-neutral-300 dark:bg-neutral-600 hover:bg-neutral-400 dark:hover:bg-neutral-500"}`}
            />
          ))}
        </div>
      )}
    </div>
  );
}
