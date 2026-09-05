import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { supabaseAdmin } from "@/lib/supabase";
import { EbookCard } from "@/components/ebooks/EbookCard";
import { ScrollReveal, ScrollStagger, ScrollStaggerItem } from "@/components/ui/ScrollReveal";

export default async function Ebooks() {
  const { data: ebooks } = await supabaseAdmin.from("Ebook").select("*").order("createdAt", { ascending: false }).limit(4);

  if (!ebooks || ebooks.length === 0) return null;

  return (
    <section
      id="ebooks"
      className="relative overflow-hidden bg-gradient-to-b from-rose-50/50 via-red-50/20 to-rose-50/50 dark:from-[#16080b] dark:via-[#100406] dark:to-[#16080b] border-t border-b border-red-100/80 dark:border-red-950/60 py-20 md:py-28 transition-colors duration-300"
    >
      {/* Subtle Ambient Glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-[500px] w-[500px] rounded-full bg-red-500/5 blur-[140px] pointer-events-none" />

      <div className="relative mx-auto max-w-7xl px-5 sm:px-6 lg:px-8">
        <ScrollReveal direction="up" delay={0.1}>
          <div className="mx-auto max-w-3xl text-center">
            <span className="inline-flex items-center gap-2 rounded-full bg-red-100 dark:bg-red-950/60 border border-red-200 dark:border-red-900/40 px-4 py-2 text-sm font-semibold text-red-700 dark:text-red-400 shadow-sm">
              Perpustakaan Digital
            </span>

            <h2 className="mt-6 text-3xl font-bold tracking-tight text-slate-900 dark:text-white sm:text-4xl lg:text-5xl">Koleksi e-Book KMHDI</h2>

            <p className="mt-6 text-base leading-8 text-slate-600 dark:text-neutral-400 md:text-lg">Jelajahi kajian, hasil forum, dan literatur digital PC KMHDI Malang. Masuk ke akun kader untuk membaca dan mengunduh e-Book.</p>
          </div>
        </ScrollReveal>

        <ScrollStagger staggerDelay={0.12} className="mt-16 flex flex-wrap justify-center gap-5">
          {ebooks.map((ebook) => (
            <ScrollStaggerItem key={ebook.id} className="w-[calc(50%-0.625rem)] lg:w-[calc(25%-0.9375rem)]">
              <EbookCard id={ebook.id} title={ebook.title} genre={ebook.genre} coverImage={ebook.coverImage} pdfUrl={ebook.pdfUrl} createdAt={ebook.createdAt} href={`/buku/${ebook.id}`} />
            </ScrollStaggerItem>
          ))}
        </ScrollStagger>

        <ScrollReveal direction="up" delay={0.35} className="mt-16 flex justify-center">
          <Link
            href="/buku"
            className="inline-flex items-center gap-2 rounded-2xl bg-gradient-to-r from-red-600 to-rose-500 px-7 py-4 font-semibold text-white shadow-lg shadow-red-600/20 transition-all duration-300 hover:shadow-xl hover:shadow-red-600/30 hover:scale-[1.02]"
          >
            Lihat Semua e-Book
            <ArrowRight size={18} />
          </Link>
        </ScrollReveal>
      </div>
    </section>
  );
}
