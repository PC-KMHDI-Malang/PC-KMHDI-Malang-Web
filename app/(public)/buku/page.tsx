import { Suspense } from "react";
import Link from "next/link";
import { Search, BookOpen } from "lucide-react";
import { supabaseAdmin } from "@/lib/supabase";
import { EbookCard } from "@/components/ebooks/EbookCard";
import { EbookFilters } from "@/components/ebooks/EbookFilters";

export const dynamic = "force-dynamic";

interface BukuPageProps {
  searchParams: Promise<{ q?: string; sort?: string; genre?: string | string[] }>;
}

export default async function BukuPage({ searchParams: searchParamsPromise }: BukuPageProps) {
  const searchParams = await searchParamsPromise;
  const query = searchParams?.q || "";
  const sortFilter = searchParams?.sort || "newest";
  const genreFilter = searchParams?.genre ? (Array.isArray(searchParams.genre) ? searchParams.genre : [searchParams.genre]) : [];

  const { data: allEbooks } = await supabaseAdmin.from("Ebook").select("genre");
  const genres = Array.from(new Set((allEbooks || []).map((e) => e.genre))).sort();

  let dbQuery = supabaseAdmin.from("Ebook").select("*");

  if (query) {
    dbQuery = dbQuery.ilike("title", `%${query}%`);
  }

  if (genreFilter.length > 0) {
    dbQuery = dbQuery.in("genre", genreFilter);
  }

  if (sortFilter === "oldest") {
    dbQuery = dbQuery.order("createdAt", { ascending: true });
  } else if (sortFilter === "az") {
    dbQuery = dbQuery.order("title", { ascending: true });
  } else if (sortFilter === "za") {
    dbQuery = dbQuery.order("title", { ascending: false });
  } else {
    dbQuery = dbQuery.order("createdAt", { ascending: false });
  }

  const { data: ebooks } = await dbQuery;

  return (
    <div className="-mt-32 bg-white dark:bg-[#0a0a0c] transition-colors min-h-screen">
      {/* Header */}
      <div className="bg-gradient-to-br from-red-800 via-red-900 to-red-950 pt-44 pb-16 relative overflow-hidden">
        <div className="absolute left-0 top-0 h-50 w-50 rounded-full bg-red-500/20 blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 right-0 h-96 w-96 rounded-full bg-red-400/10 blur-3xl pointer-events-none" />
        <div className="relative mx-auto max-w-7xl px-5 sm:px-6 lg:px-8">
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-white mb-2">Koleksi e-Book KMHDI</h1>
          <p className="text-red-100/80 text-lg">Daftar e-Book yang ditampilkan secara publik.</p>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-5 sm:px-6 lg:px-8 py-10">
        <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-8">
          <aside className="lg:sticky lg:top-32 lg:self-start transition-all">
            <Suspense fallback={null}>
              <EbookFilters genres={genres} basePath="/buku" />
            </Suspense>
          </aside>

          <div>
            <form className="flex items-center gap-3 bg-white dark:bg-[#121215] border border-neutral-200 dark:border-white/10 rounded-2xl p-3 mb-8 shadow-sm">
              <div className="flex items-center gap-2 flex-1 px-3">
                <Search size={18} className="text-neutral-400" />
                <input type="text" name="q" defaultValue={query} placeholder="Pencarian e-Book ..." className="w-full bg-transparent outline-none text-sm text-zinc-900 dark:text-white placeholder:text-neutral-400" />
              </div>
              <button type="submit" className="bg-red-600 hover:bg-red-700 text-white px-6 py-2.5 rounded-xl text-sm font-bold transition-colors">
                Cari
              </button>
            </form>

            {query && (
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                <h3 className="text-xl font-bold text-zinc-900">Hasil pencarian &quot;{query}&quot;</h3>
                <Link
                  href={`/buku${genreFilter.length > 0 ? "?" + genreFilter.map((g) => `genre=${encodeURIComponent(g)}`).join("&") : ""}`}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-red-100 text-red-700 rounded-full hover:bg-red-200 transition-colors"
                >
                  Bersihkan Pencarian
                </Link>
              </div>
            )}

            {ebooks && ebooks.length > 0 ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-5">
                {ebooks.map((ebook) => (
                  <EbookCard key={ebook.id} id={ebook.id} title={ebook.title} genre={ebook.genre} coverImage={ebook.coverImage} pdfUrl={ebook.pdfUrl} createdAt={ebook.createdAt} href={`/buku/${ebook.id}`} />
                ))}
              </div>
            ) : (
              <div className="py-24 flex flex-col items-center justify-center text-neutral-400 bg-white border border-neutral-200 rounded-3xl text-center px-5">
                <BookOpen size={40} className="mb-4 opacity-30" />
                <p className="text-lg mb-4">{query ? `Tidak ada e-Book yang cocok dengan kata kunci "${query}".` : "Belum ada e-Book untuk filter ini."}</p>
                {query && (
                  <Link
                    href={`/buku${genreFilter.length > 0 ? "?" + genreFilter.map((g) => `genre=${encodeURIComponent(g)}`).join("&") : ""}`}
                    className="inline-flex items-center gap-1.5 px-5 py-2.5 text-sm font-semibold bg-red-600 text-white rounded-full hover:bg-red-700 transition-colors"
                  >
                    Bersihkan Pencarian
                  </Link>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
