import { Wave } from "@/components/loading-ui/wave";

export default function AdminLoading() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
      <Wave className="h-10 w-14 text-red-600" />
      <p className="text-slate-500 dark:text-slate-400 font-medium animate-pulse">Memuat data...</p>
    </div>
  );
}