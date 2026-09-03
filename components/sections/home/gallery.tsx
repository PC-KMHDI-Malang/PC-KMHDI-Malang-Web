import Image from "next/image";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { supabaseAdmin } from "@/lib/supabase";

import { galleryData as fallbackData } from "@/data/gallery";
import { ScrollReveal } from "@/components/ui/ScrollReveal";

export default async function Gallery() {
  const { data: galleries } = await supabaseAdmin.from("Gallery").select("coverImage").order("createdAt", { ascending: false }).limit(10);

  const images = galleries && galleries.length > 0 ? galleries.map((g) => g.coverImage) : fallbackData.images;

  // Jika gambar kurang dari 4, fallback ke data statis agar animasi marquee tidak kosong melompong
  const displayImages = images.length >= 4 ? images : fallbackData.images;

  const firstRow = displayImages.slice(0, Math.ceil(displayImages.length / 2));
  const secondRow = displayImages.slice(Math.ceil(displayImages.length / 2));

  return (
    <section id="galeri" className="relative overflow-hidden bg-white dark:bg-[#0c0c0e] py-20 md:py-28 transition-colors duration-300">
      {/* Subtle Background Glow */}
      <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 h-[450px] w-[450px] rounded-full bg-rose-500/5 blur-[140px] pointer-events-none" />

      <div className="relative mx-auto max-w-7xl px-5 sm:px-6 lg:px-8">
        {/* Header */}
        <ScrollReveal direction="up" delay={0.1}>
          <div className="mx-auto max-w-3xl text-center">
            <span className="inline-flex rounded-full bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/40 px-4 py-2 text-sm font-semibold text-red-700 dark:text-red-400 shadow-sm">{fallbackData.badge}</span>

            <h2 className="mt-6 text-3xl font-bold tracking-tight text-slate-900 dark:text-white sm:text-4xl lg:text-5xl">{fallbackData.title}</h2>

            <p className="mt-6 text-base leading-8 text-slate-600 dark:text-neutral-400 md:text-lg">{fallbackData.description}</p>
          </div>
        </ScrollReveal>
      </div>

      {/* ROW 1 */}
      <ScrollReveal direction="left" delay={0.15} className="relative mt-16">
        {/* Left & right fade masks */}
        <div className="pointer-events-none absolute left-0 top-0 bottom-0 z-10 w-24 sm:w-40 bg-gradient-to-r from-white dark:from-[#0c0c0e] to-transparent transition-colors duration-300" />
        <div className="pointer-events-none absolute right-0 top-0 bottom-0 z-10 w-24 sm:w-40 bg-gradient-to-l from-white dark:from-[#0c0c0e] to-transparent transition-colors duration-300" />
        <div className="flex w-max animate-marquee gap-6">
          {[...firstRow, ...firstRow].map((image, index) => (
            <div key={index} className="relative h-64 sm:h-72 w-[280px] sm:w-[320px] overflow-hidden rounded-3xl shadow-xl ring-1 ring-black/5 dark:ring-white/10">
              <Image src={image} alt={`Gallery ${index + 1}`} fill sizes="(max-width: 768px) 260px, 320px" className="object-cover transition duration-500 hover:scale-110" />
            </div>
          ))}
        </div>
      </ScrollReveal>

      {/* ROW 2 */}
      <ScrollReveal direction="right" delay={0.25} className="relative mt-6">
        {/* Left & right fade masks */}
        <div className="pointer-events-none absolute left-0 top-0 bottom-0 z-10 w-24 sm:w-40 bg-gradient-to-r from-white dark:from-[#0c0c0e] to-transparent transition-colors duration-300" />
        <div className="pointer-events-none absolute right-0 top-0 bottom-0 z-10 w-24 sm:w-40 bg-gradient-to-l from-white dark:from-[#0c0c0e] to-transparent transition-colors duration-300" />
        <div className="flex w-max animate-marquee-reverse gap-6">
          {[...secondRow, ...secondRow].map((image, index) => (
            <div key={index} className="relative h-64 sm:h-72 w-[280px] sm:w-[320px] overflow-hidden rounded-3xl shadow-xl ring-1 ring-black/5 dark:ring-white/10">
              <Image src={image} alt={`Gallery ${index + 5}`} fill sizes="(max-width: 768px) 260px, 320px" className="object-cover transition duration-500 hover:scale-110" />
            </div>
          ))}
        </div>
      </ScrollReveal>

      {/* Button */}
      <ScrollReveal direction="up" delay={0.35} className="mt-16 flex justify-center">
        <Link href={fallbackData.button.href} className="inline-flex items-center gap-2 rounded-2xl bg-gradient-to-r from-red-600 to-rose-500 px-7 py-4 font-semibold text-white shadow-lg shadow-red-600/20 transition-all duration-300 hover:shadow-xl hover:shadow-red-600/30 hover:scale-[1.02]">
          {fallbackData.button.label}
          <ArrowRight size={18} />
        </Link>
      </ScrollReveal>
    </section>
  );
}
