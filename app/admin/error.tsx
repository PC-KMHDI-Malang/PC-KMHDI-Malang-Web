"use client";

import { useEffect } from "react";
import { AlertCircle } from "lucide-react";

export default function AdminError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4 bg-white/50 dark:bg-slate-900/50 rounded-3xl border border-red-100 dark:border-red-900/30 p-8 text-center max-w-lg mx-auto">
      <div className="w-16 h-16 bg-red-100 dark:bg-red-900/20 rounded-full flex items-center justify-center text-red-600 dark:text-red-500 mb-2">
        <AlertCircle size={32} />
      </div>
      <h2 className="text-2xl font-bold text-slate-800 dark:text-white">Terjadi Kesalahan</h2>
      <p className="text-slate-500 dark:text-slate-400 mb-4">
        Maaf, sistem mengalami kendala saat memuat halaman ini.
      </p>
      <button
        onClick={() => reset()}
        className="px-6 py-2.5 bg-red-600 hover:bg-red-700 text-white font-semibold rounded-xl transition-colors shadow-sm"
      >
        Coba Muat Ulang
      </button>
    </div>
  );
}