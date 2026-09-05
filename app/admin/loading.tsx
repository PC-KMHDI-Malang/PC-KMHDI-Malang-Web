export default function AdminLoading() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
      <div className="w-10 h-10 border-4 border-slate-200 dark:border-slate-800 border-t-red-600 rounded-full animate-spin"></div>
      <p className="text-slate-500 dark:text-slate-400 font-medium animate-pulse">Memuat data...</p>
    </div>
  );
}