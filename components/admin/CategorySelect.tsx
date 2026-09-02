"use client";

const PREDEFINED_CATEGORIES = ["Umum", "Kegiatan", "Opini", "Press Release", "Informasi"];

interface CategorySelectProps {
  defaultCategoryName?: string;
  focusColor?: string;
}

export function CategorySelect({ defaultCategoryName, focusColor = "blue" }: CategorySelectProps) {
  const focusClass =
    focusColor === "red" ? "focus:border-red-500 dark:focus:border-rose-500 focus:ring-red-500/10 dark:focus:ring-rose-500/20" : "focus:border-blue-500 dark:focus:border-blue-500 focus:ring-blue-500/10 dark:focus:ring-blue-500/20";

  return (
    <div className="flex flex-col gap-4">
      <div>
        <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1.5">Kategori</label>
        <select
          name="categoryName"
          defaultValue={defaultCategoryName || "Umum"}
          className={`w-full bg-slate-50 dark:bg-[#111111] dark:text-white border border-slate-200 dark:border-white/5 focus:ring-4 rounded-xl p-3 outline-none transition-all cursor-pointer ${focusClass}`}
        >
          {PREDEFINED_CATEGORIES.map((cat) => (
            <option key={cat} value={cat}>
              {cat}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}
