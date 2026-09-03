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
      className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 outline-none cursor-pointer shadow-sm transition hover:border-red-300 focus:border-red-500"
    >
      <option value="newest">Terbaru</option>
      <option value="oldest">Terlama</option>
    </select>
  );
}
