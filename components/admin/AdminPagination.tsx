import Link from "next/link";

interface AdminPaginationProps {
  basePath: string;
  currentPage: number;
  totalPages: number;
  // searchParams lain yang harus tetap dibawa saat pindah halaman (mis. q, sort, genre) —
  // supaya pencarian/filter yang sedang aktif tidak hilang begitu klik halaman berikutnya.
  searchParams: Record<string, string | undefined>;
}

// Server Component murni (cuma <Link>, tidak butuh state client) — dipakai di daftar yang
// memang dipaginasi beneran lewat query database (bukan filter di client seperti UserTable),
// supaya jumlah data yang di-fetch & dirender tiap halaman tetap terbatas.
export function AdminPagination({ basePath, currentPage, totalPages, searchParams }: AdminPaginationProps) {
  if (totalPages <= 1) return null;

  const buildHref = (page: number) => {
    const params = new URLSearchParams();
    for (const [key, value] of Object.entries(searchParams)) {
      if (value && key !== "page") params.set(key, value);
    }
    if (page > 1) params.set("page", String(page));
    const qs = params.toString();
    return qs ? `${basePath}?${qs}` : basePath;
  };

  const pages = Array.from({ length: totalPages }, (_, i) => i + 1);

  return (
    <div className="mt-6 sm:mt-8 flex flex-wrap justify-center items-center gap-1.5 sm:gap-2">
      <Link
        href={buildHref(Math.max(1, currentPage - 1))}
        className={`px-3 sm:px-4 py-2 rounded-xl text-xs sm:text-sm font-bold bg-white dark:bg-white/5 text-slate-700 dark:text-slate-300 shadow-sm border border-slate-200 dark:border-white/10 transition-colors ${
          currentPage === 1 ? "pointer-events-none opacity-40" : "hover:bg-slate-50 dark:hover:bg-white/10"
        }`}
      >
        Sebelumnya
      </Link>

      <div className="flex items-center gap-1 flex-wrap">
        {pages.map((pageNum) => (
          <Link
            key={pageNum}
            href={buildHref(pageNum)}
            className={`w-8 h-8 sm:w-10 sm:h-10 flex items-center justify-center rounded-xl text-xs sm:text-sm font-bold transition-colors ${
              currentPage === pageNum
                ? "bg-red-600 dark:bg-rose-600 text-white shadow-md shadow-red-600/20"
                : "bg-white dark:bg-white/5 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-white/10 hover:bg-slate-50 dark:hover:bg-white/10"
            }`}
          >
            {pageNum}
          </Link>
        ))}
      </div>

      <Link
        href={buildHref(Math.min(totalPages, currentPage + 1))}
        className={`px-3 sm:px-4 py-2 rounded-xl text-xs sm:text-sm font-bold bg-white dark:bg-white/5 text-slate-700 dark:text-slate-300 shadow-sm border border-slate-200 dark:border-white/10 transition-colors ${
          currentPage === totalPages ? "pointer-events-none opacity-40" : "hover:bg-slate-50 dark:hover:bg-white/10"
        }`}
      >
        Berikutnya
      </Link>
    </div>
  );
}
