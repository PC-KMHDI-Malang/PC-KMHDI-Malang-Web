import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { supabaseAdmin } from "@/lib/supabase";
import { EbookCard } from "@/components/ebooks/EbookCard";

export default async function Ebooks() {
  const { data: ebooks } = await supabaseAdmin
    .from("Ebook")
    .select("*")
    .order("createdAt", { ascending: false })
    .limit(4);

  if (!ebooks || ebooks.length === 0) return null;

  return (
    <section id="ebooks" className="bg-white dark:bg-slate-950 py-16 md:py-24 lg:py-32 transition-colors">
      <div className="mx-auto max-w-7xl px-5 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-3xl text-center">
          <span className="inline-flex rounded-full bg-red-100 dark:bg-red-950/40 px-4 py-2 text-sm font-semibold text-red-700 dark:text-red-400">
            Perpustakaan Digital
          </span>

          <h2 className="mt-6 text-3xl font-bold text-slate-900 dark:text-white sm:text-4xl lg:text-5xl">
            Koleksi Buku KMHDI
          </h2>

          <p className="mt-6 text-base leading-8 text-slate-600 dark:text-slate-400 md:text-lg">
            Jelajahi kajian, hasil forum, dan literatur digital PC KMHDI Malang. Masuk ke akun kader untuk membaca dan mengunduh buku.
          </p>
        </div>

        <div className="mt-16 grid grid-cols-2 lg:grid-cols-4 gap-5">
          {ebooks.map((ebook) => (
            <EbookCard
              key={ebook.id}
              id={ebook.id}
              title={ebook.title}
              genre={ebook.genre}
              coverImage={ebook.coverImage}
              createdAt={ebook.createdAt}
              href={`/buku/${ebook.id}`}
            />
          ))}
        </div>

        <div className="mt-16 flex justify-center">
          <Link
            href="/buku"
            className="inline-flex items-center gap-2 rounded-2xl bg-red-700 px-7 py-4 font-semibold text-white transition duration-300 hover:bg-red-800"
          >
            Lihat Semua Buku
            <ArrowRight size={18} />
          </Link>
        </div>
      </div>
    </section>
  );
}
