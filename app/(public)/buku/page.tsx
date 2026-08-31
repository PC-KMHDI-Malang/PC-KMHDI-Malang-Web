import { Suspense } from "react";
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
    <div className="bg-slate-50 dark:bg-slate-950 py-16 transition-colors">
      <div className="mx-auto max-w-7xl px-5 sm:px-6 lg:px-8">
        <div className="mb-10">
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-slate-900 dark:text-white mb-2">Kumpulan Buku KMHDI</h1>
          <p className="text-slate-500 dark:text-slate-400 text-lg">Daftar buku yang ditampilkan secara publik.</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-8">
          <aside className="lg:sticky lg:top-6 lg:self-start">
            <Suspense fallback={null}>
              <EbookFilters genres={genres} basePath="/buku" />
            </Suspense>
          </aside>

          <div>
            <form className="flex items-center gap-3 bg-white dark:bg-[#111111] border border-slate-100 dark:border-white/5 rounded-2xl p-3 mb-8">
              <div className="flex items-center gap-2 flex-1 px-3">
                <Search size={18} className="text-slate-400" />
                <input
                  type="text"
                  name="q"
                  defaultValue={query}
                  placeholder="Pencarian buku ..."
                  className="w-full bg-transparent outline-none text-sm dark:text-white placeholder:text-slate-400"
                />
              </div>
              <button type="submit" className="bg-red-600 hover:bg-red-700 text-white px-6 py-2.5 rounded-xl text-sm font-bold transition-colors">
                Cari
              </button>
            </form>

            {ebooks && ebooks.length > 0 ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-5">
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
            ) : (
              <div className="py-24 flex flex-col items-center justify-center text-slate-400 dark:text-slate-500 bg-white dark:bg-[#111111] border border-slate-100 dark:border-white/5 rounded-3xl">
                <BookOpen size={40} className="mb-4 opacity-30" />
                <p className="text-lg">Tidak ada buku yang ditemukan.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
