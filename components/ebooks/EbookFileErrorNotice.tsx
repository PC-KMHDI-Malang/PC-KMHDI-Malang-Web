"use client";

import { useSearchParams } from "next/navigation";

// Dibaca di client (bukan lewat searchParams di server) supaya halaman e-book tetap bisa
// di-cache statis — mengakses searchParams di server memaksa Next.js merender halaman secara
// dinamis, yang gagal (DYNAMIC_SERVER_USAGE) karena halaman ini dikonfigurasi untuk di-cache
// lewat generateStaticParams + revalidate. Lihat catatan yang sama di app/(public)/e-book/[slug]/page.tsx.
export function EbookFileErrorNotice() {
  const searchParams = useSearchParams();
  const fileError = searchParams.get("fileError");

  if (!fileError) return null;

  return (
    <p className="mt-3 text-sm font-semibold text-amber-600 dark:text-amber-400">
      File PDF tidak bisa dibuka saat ini. Silakan coba lagi beberapa saat lagi.
    </p>
  );
}
