"use client";

import { useRouter, useSearchParams } from "next/navigation";

interface EbookFiltersProps {
  genres: string[];
  basePath: string;
}

export function EbookFilters({ genres, basePath }: EbookFiltersProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const sortFilter = searchParams.get("sort") || "newest";
  const activeGenres = searchParams.getAll("genre");
  const query = searchParams.get("q") || "";

  const pushParams = (mutate: (params: URLSearchParams) => void) => {
    const params = new URLSearchParams(searchParams.toString());
    mutate(params);
    router.push(`${basePath}?${params.toString()}`);
  };

  const handleSortChange = (value: string) => {
    pushParams((params) => params.set("sort", value));
  };

  const handleGenreToggle = (genre: string, checked: boolean) => {
    pushParams((params) => {
      params.delete("genre");
      const next = checked ? [...activeGenres, genre] : activeGenres.filter((g) => g !== genre);
      next.forEach((g) => params.append("genre", g));
    });
  };

  return (
    <div className="rounded-3xl bg-white dark:bg-[#121215] border border-neutral-200 dark:border-white/10 p-6 shadow-sm transition-colors">
      <div className="mb-6">
        <label className="block text-sm font-bold text-zinc-800 dark:text-white mb-2">Sortir :</label>
        <select
          value={sortFilter}
          onChange={(e) => handleSortChange(e.target.value)}
          className="w-full bg-neutral-50 dark:bg-[#18181c] border border-neutral-200 dark:border-white/10 text-zinc-900 dark:text-white rounded-xl px-3 py-2.5 text-sm outline-none cursor-pointer focus:border-red-500 transition-colors"
        >
          <option value="newest">Terbaru</option>
          <option value="oldest">Terlama</option>
          <option value="az">A-Z</option>
          <option value="za">Z-A</option>
        </select>
      </div>

      <div>
        <p className="text-sm font-bold text-zinc-800 dark:text-white mb-3">Kategori :</p>
        <div className="space-y-2.5">
          {genres.map((genre) => (
            <label key={genre} className="flex items-center gap-2.5 text-sm text-neutral-600 dark:text-neutral-400 hover:text-zinc-900 dark:hover:text-white cursor-pointer transition-colors">
              <input
                type="checkbox"
                checked={activeGenres.includes(genre)}
                onChange={(e) => handleGenreToggle(genre, e.target.checked)}
                className="w-4 h-4 rounded border-neutral-300 dark:border-neutral-700 accent-red-600 text-red-600 focus:ring-red-500/30 cursor-pointer"
              />
              <span className="uppercase font-medium text-xs sm:text-sm">{genre}</span>
            </label>
          ))}
          {genres.length === 0 && <p className="text-xs text-neutral-400">Belum ada kategori.</p>}
        </div>
      </div>

      {(activeGenres.length > 0 || sortFilter !== "newest" || query) && (
        <button
          type="button"
          onClick={() => router.push(basePath)}
          className="mt-6 w-full text-center text-xs font-bold text-red-600 dark:text-red-400 hover:underline cursor-pointer"
        >
          Reset Filter
        </button>
      )}
    </div>
  );
}
