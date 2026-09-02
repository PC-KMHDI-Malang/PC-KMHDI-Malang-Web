"use client";

import { useRouter, useSearchParams } from "next/navigation";

interface NewsFiltersProps {
  categories: string[];
  basePath: string;
}

export function NewsFilters({ categories, basePath }: NewsFiltersProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const sortFilter = searchParams.get("sort") || "newest";
  const activeCategories = searchParams.getAll("category");
  const query = searchParams.get("q") || "";

  const pushParams = (mutate: (params: URLSearchParams) => void) => {
    const params = new URLSearchParams(searchParams.toString());
    mutate(params);
    router.push(`${basePath}?${params.toString()}`);
  };

  const handleSortChange = (value: string) => {
    pushParams((params) => params.set("sort", value));
  };

  const handleCategoryToggle = (category: string, checked: boolean) => {
    pushParams((params) => {
      params.delete("category");
      const next = checked ? [...activeCategories, category] : activeCategories.filter((c) => c !== category);
      next.forEach((c) => params.append("category", c));
    });
  };

  return (
    <div className="rounded-3xl bg-white dark:bg-[#111111] border border-slate-100 dark:border-white/5 p-6">
      <div className="mb-6">
        <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">Sortir :</label>
        <select
          value={sortFilter}
          onChange={(e) => handleSortChange(e.target.value)}
          className="w-full bg-slate-50 dark:bg-black/30 border border-slate-200 dark:border-white/10 dark:text-white rounded-xl px-3 py-2.5 text-sm outline-none cursor-pointer"
        >
          <option value="newest">Terbaru</option>
          <option value="oldest">Terlama</option>
          <option value="az">A-Z</option>
          <option value="za">Z-A</option>
        </select>
      </div>

      <div>
        <p className="text-sm font-bold text-slate-700 dark:text-slate-300 mb-3">Kategori :</p>
        <div className="space-y-2.5">
          {categories.map((category) => (
            <label key={category} className="flex items-center gap-2.5 text-sm text-slate-600 dark:text-slate-300 cursor-pointer">
              <input
                type="checkbox"
                checked={activeCategories.includes(category)}
                onChange={(e) => handleCategoryToggle(category, e.target.checked)}
                className="w-4 h-4 rounded border-slate-300 dark:border-white/20 text-red-600 focus:ring-red-500/30 cursor-pointer"
              />
              <span className="font-medium">{category}</span>
            </label>
          ))}
          {categories.length === 0 && <p className="text-xs text-slate-400">Belum ada kategori.</p>}
        </div>
      </div>

      {(activeCategories.length > 0 || sortFilter !== "newest" || query) && (
        <button type="button" onClick={() => router.push(basePath)} className="mt-6 w-full text-center text-xs font-bold text-red-600 dark:text-rose-500 hover:underline">
          Reset Filter
        </button>
      )}
    </div>
  );
}
