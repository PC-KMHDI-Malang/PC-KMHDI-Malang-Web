import { formatBytes } from "@/lib/storage";

export function StorageUsage({ usedBytes, quotaBytes, label }: { usedBytes: number; quotaBytes: number; label: string }) {
  const percent = Math.min(100, (usedBytes / quotaBytes) * 100);
  const remaining = Math.max(0, quotaBytes - usedBytes);
  const barColor = percent > 90 ? "bg-red-500" : percent > 70 ? "bg-amber-500" : "bg-emerald-500";

  return (
    <div className="mb-10 p-5 rounded-2xl border border-slate-200/80 dark:border-white/10 bg-white dark:bg-[#111114]">
      <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
        <span className="text-sm font-bold text-slate-700 dark:text-slate-300">{label}</span>
        <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
          {formatBytes(usedBytes)} terpakai &middot; {formatBytes(remaining)} tersisa dari {formatBytes(quotaBytes)}
        </span>
      </div>
      <div className="w-full h-2 rounded-full bg-slate-200 dark:bg-white/10 overflow-hidden">
        <div className={`h-full rounded-full transition-all ${barColor}`} style={{ width: `${percent}%` }} />
      </div>
    </div>
  );
}
