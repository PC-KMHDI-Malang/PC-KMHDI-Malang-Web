// Segmen ini tidak punya anak dinamis yang memanggil notFound(), jadi aman memasang loading.tsx
// di sini — lihat catatan yang sama di app/(public)/berita/loading.tsx.
import { Wave } from "@/components/loading-ui/wave";

export default function ProfilLoading() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen gap-4">
      <Wave className="h-12 w-16 text-red-600" />
    </div>
  );
}
