// Sengaja hanya di segmen ini, bukan di root grup (public). loading.tsx memasang batas Suspense
// sehingga Next.js langsung mengirim header respons (HTTP 200) sebelum halaman selesai dirender —
// akibatnya notFound() di halaman detail artikel/e-book tidak lagi bisa mengubah status menjadi
// 404, dan URL yang tidak ada terbaca sebagai halaman valid ("soft 404") oleh mesin pencari.
// /berita tidak punya anak dinamis yang memanggil notFound(), jadi aman di sini.
export default function PublicLoading() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen gap-4">
      <div className="w-12 h-12 border-4 border-slate-200 dark:border-slate-800 border-t-red-600 rounded-full animate-spin"></div>
    </div>
  );
}