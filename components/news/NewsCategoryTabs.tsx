"use client";

import { useRouter, useSearchParams } from "next/navigation";

interface NewsCategoryTabsProps {
  categories: string[];
}

export function NewsCategoryTabs({ categories }: NewsCategoryTabsProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const activeCategory = searchParams.get("category") || "";

  const handleClick = (category: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (category === activeCategory) {
      params.delete("category");
    } else {
      params.set("category", category);
    }
    router.push(`/berita?${params.toString()}`);
  };

  const handleReset = () => {
    router.push("/berita");
  };

  return (
    <div className="flex flex-wrap justify-center gap-2">
      <button
        type="button"
        onClick={handleReset}
        className={`px-5 py-2.5 rounded-full text-sm font-semibold transition-all duration-300 ${
          !activeCategory
            ? "bg-white text-red-900 shadow-xl"
            : "border border-white/20 bg-white/10 text-red-100 backdrop-blur-xl hover:bg-white/20"
        }`}
      >
        Semua
      </button>
      {categories.map((cat) => (
        <button
          key={cat}
          type="button"
          onClick={() => handleClick(cat)}
          className={`px-5 py-2.5 rounded-full text-sm font-semibold transition-all duration-300 ${
            activeCategory === cat
              ? "bg-white text-red-900 shadow-xl"
              : "border border-white/20 bg-white/10 text-red-100 backdrop-blur-xl hover:bg-white/20"
          }`}
        >
          {cat}
        </button>
      ))}
    </div>
  );
}
