"use client";

import { useRouter, useSearchParams } from "next/navigation";

export function NewsSortSelect() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const sortFilter = searchParams.get("sort") || "newest";

  const handleChange = (value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("sort", value);
    router.push(`/berita?${params.toString()}`);
  };

  return (
    <select
      onChange={(e) => handleChange(e.target.value)}
      defaultValue={sortFilter}
      className="rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-[#1A1A1A] px-4 py-2.5 text-sm font-medium text-slate-700 dark:text-neutral-300 outline-none cursor-pointer shadow-sm transition hover:border-red-300 dark:hover:border-red-500/50 focus:border-red-500 dark:focus:border-red-500"
    >
      <option value="newest">Terbaru</option>
      <option value="oldest">Terlama</option>
    </select>
  );
}
