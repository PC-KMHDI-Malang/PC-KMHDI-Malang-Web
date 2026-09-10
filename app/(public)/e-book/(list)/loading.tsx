// Route group (list) mengisolasi Suspense boundary ini dari saudara segmennya, [slug] —
// tanpa itu, loading.tsx di sini akan ikut membungkus app/(public)/e-book/[slug]/page.tsx dan
// membuat notFound() di sana tidak lagi bisa mengubah status jadi 404 (soft 404), persis
// alasan yang sama seperti di app/(public)/berita/loading.tsx.
import { Wave } from "@/components/loading-ui/wave";

export default function EbookListLoading() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen gap-4">
      <Wave className="h-12 w-16 text-red-600" />
    </div>
  );
}
