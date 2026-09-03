import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { supabaseAdmin } from "@/lib/supabase";
import { EbookCard } from "@/components/ebooks/EbookCard";

export default async function Ebooks() {
  const { data: ebooks } = await supabaseAdmin.from("Ebook").select("*").order("createdAt", { ascending: false }).limit(4);

  if (!ebooks || ebooks.length === 0) return null;

  return (
    <section id="ebooks" className="relative overflow-hidden bg-white py-20 md:py-28">
      {/* Subtle Ambient Glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-[500px] w-[500px] rounded-full bg-rose-500/5 blur-[140px] pointer-events-none" />

      <div className="relative mx-auto max-w-7xl px-5 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-3xl text-center">
          <span className="inline-flex items-center gap-2 rounded-full bg-red-50 border border-red-200 px-4 py-2 text-sm font-semibold text-red-700 shadow-sm">
            Perpustakaan Digital
          </span>

          <h2 className="mt-6 text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl lg:text-5xl">
            Koleksi e-Book KMHDI
          </h2>

          <p className="mt-6 text-base leading-8 text-slate-600 md:text-lg">
            Jelajahi kajian, hasil forum, dan literatur digital PC KMHDI Malang. Masuk ke akun kader untuk membaca dan mengunduh e-Book.
          </p>
        </div>

        <div className="mt-16 grid grid-cols-2 lg:grid-cols-4 gap-5">
          {ebooks.map((ebook) => (
            <EbookCard key={ebook.id} id={ebook.id} title={ebook.title} genre={ebook.genre} coverImage={ebook.coverImage} createdAt={ebook.createdAt} href={`/buku/${ebook.id}`} />
          ))}
        </div>

        <div className="mt-16 flex justify-center">
          <Link href="/buku" className="inline-flex items-center gap-2 rounded-2xl bg-gradient-to-r from-red-600 to-rose-500 px-7 py-4 font-semibold text-white shadow-lg shadow-red-600/20 transition-all duration-300 hover:shadow-xl hover:shadow-red-600/30 hover:scale-[1.02]">
            Lihat Semua e-Book
            <ArrowRight size={18} />
          </Link>
        </div>
      </div>
    </section>
  );
}
