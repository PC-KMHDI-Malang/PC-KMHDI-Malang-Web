"use client";

import React, { useCallback, useEffect, useState } from "react";
import useEmblaCarousel from "embla-carousel-react";
import Link from "next/link";
import { ArrowRight, CalendarDays, ChevronLeft, ChevronRight } from "lucide-react";
import { SafeImage } from "./SafeImage";

interface NewsItem {
  id: string;
  title: string;
  image: string;
  category: string;
  date: string;
  href: string;
}

export function NewsCarousel({ items }: { items: NewsItem[] }) {
  const [emblaRef, emblaApi] = useEmblaCarousel({ loop: true, align: "start", skipSnaps: false });
  const [prevBtnEnabled, setPrevBtnEnabled] = useState(false);
  const [nextBtnEnabled, setNextBtnEnabled] = useState(false);

  const scrollPrev = useCallback(() => emblaApi && emblaApi.scrollPrev(), [emblaApi]);
  const scrollNext = useCallback(() => emblaApi && emblaApi.scrollNext(), [emblaApi]);

  const onSelect = useCallback(() => {
    if (!emblaApi) return;
    setPrevBtnEnabled(emblaApi.canScrollPrev());
    setNextBtnEnabled(emblaApi.canScrollNext());
  }, [emblaApi]);

  useEffect(() => {
    if (!emblaApi) return;
    setTimeout(() => onSelect(), 0);
    emblaApi.on("select", onSelect);
    emblaApi.on("reInit", onSelect);
  }, [emblaApi, onSelect]);

  useEffect(() => {
    if (!emblaApi) return;
    const interval = setInterval(() => {
      emblaApi.scrollNext();
    }, 3000);
    return () => clearInterval(interval);
  }, [emblaApi]);

  return (
    <div className="relative">
      <div className="overflow-hidden" ref={emblaRef}>
        <div className="flex backface-hidden touch-pan-y -ml-4 md:-ml-6 lg:-ml-8 py-4">
          {items.map((item) => (
            <div key={item.id} className="min-w-0 flex-none w-full sm:w-1/2 lg:w-1/3 pl-4 md:pl-6 lg:pl-8">
              <article className="group h-full flex flex-col overflow-hidden rounded-3xl border border-slate-200 dark:border-white/10 bg-white dark:bg-[#141417] shadow-lg transition-all duration-300 hover:-translate-y-2 hover:shadow-2xl">
                <div className="relative h-64 overflow-hidden shrink-0">
                  {/* Kartu ini lebar 1/3 kontainer di desktop, 1/2 di tablet, penuh di HP — tanpa
                      "sizes", Next.js menganggap gambarnya tampil 100vw di semua ukuran layar dan
                      selalu mengirim varian paling besar, padahal di desktop cuma sepertiga itu. */}
                  <SafeImage src={item.image} alt={item.title} fill sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw" className="object-cover transition duration-500 group-hover:scale-110" />
                  <span className="absolute left-5 top-5 rounded-full bg-red-600 px-3 py-1 text-xs font-semibold text-white shadow-lg">{item.category}</span>
                </div>

                <div className="p-6 flex flex-col grow bg-white dark:bg-[#141417]">
                  <div className="mb-4 flex items-center gap-2 text-sm text-slate-500 dark:text-neutral-400">
                    <CalendarDays size={16} />
                    <span>{item.date}</span>
                  </div>

                  <h3 className="text-xl font-bold leading-snug text-slate-900 dark:text-white transition group-hover:text-red-600 dark:group-hover:text-red-400 mb-4 line-clamp-3">{item.title}</h3>

                  <div className="mt-auto pt-4">
                    <Link href={item.href} className="inline-flex items-center gap-2 font-semibold text-red-600 dark:text-red-400 transition hover:gap-3">
                      Baca Selengkapnya
                      <ArrowRight size={18} />
                    </Link>
                  </div>
                </div>
              </article>
            </div>
          ))}
        </div>
      </div>

      {/* Navigation Buttons */}
      <div className="flex justify-center gap-4 mt-8">
        <button
          onClick={scrollPrev}
          disabled={!prevBtnEnabled}
          className={`w-12 h-12 flex items-center justify-center rounded-full border-2 transition-all duration-300 ${
            prevBtnEnabled
              ? "border-red-600 text-red-600 dark:border-rose-500 dark:text-rose-500 hover:bg-red-600 dark:hover:bg-rose-500 hover:text-white"
              : "border-slate-200 dark:border-white/10 text-slate-300 dark:text-slate-600 cursor-not-allowed"
          }`}
          aria-label="Previous slide"
        >
          <ChevronLeft size={24} />
        </button>
        <button
          onClick={scrollNext}
          disabled={!nextBtnEnabled}
          className={`w-12 h-12 flex items-center justify-center rounded-full border-2 transition-all duration-300 ${
            nextBtnEnabled
              ? "border-red-600 text-red-600 dark:border-rose-500 dark:text-rose-500 hover:bg-red-600 dark:hover:bg-rose-500 hover:text-white"
              : "border-slate-200 dark:border-white/10 text-slate-300 dark:text-slate-600 cursor-not-allowed"
          }`}
          aria-label="Next slide"
        >
          <ChevronRight size={24} />
        </button>
      </div>
    </div>
  );
}
