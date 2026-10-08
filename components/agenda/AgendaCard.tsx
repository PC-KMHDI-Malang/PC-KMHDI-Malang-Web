import Link from "next/link";
import { ArrowRight, Clock, MapPin } from "lucide-react";

import { AGENDA_KIND_LABEL, agendaStatus, formatAgendaRange, type Agenda } from "@/lib/agenda";
import { KIND_CLASS } from "@/components/agenda/AgendaCalendar";

// Satu kartu agenda untuk daftar "Akan Datang". Seluruh kartu adalah satu tautan ke halaman detail;
// tombol "Detail acara" di bawahnya hanya penanda yang terlihat (bukan tautan kedua, karena tautan
// tidak boleh bersarang di dalam tautan).
export function AgendaCard({ agenda }: { agenda: Agenda }) {
  const status = agendaStatus(agenda);

  return (
    <Link href={`/agenda/${agenda.slug}`} className="group block rounded-2xl border border-slate-200/80 dark:border-white/10 p-4 active:bg-slate-100 dark:active:bg-white/10 hover:bg-slate-50 dark:hover:bg-white/5 transition-colors">
      <div className="flex flex-wrap items-center gap-2 mb-2">
        <span className={`inline-flex rounded-full border px-2.5 py-0.5 text-[11px] font-bold ${KIND_CLASS[agenda.kind]}`}>{AGENDA_KIND_LABEL[agenda.kind]}</span>
        {status === "BERLANGSUNG" && (
          <span className="inline-flex rounded-full border border-emerald-200 dark:border-emerald-900/50 bg-emerald-50 dark:bg-emerald-950/30 px-2.5 py-0.5 text-[11px] font-bold text-emerald-700 dark:text-emerald-400">Sedang berlangsung</span>
        )}
      </div>
      <h3 className="font-bold leading-snug text-slate-900 dark:text-white">{agenda.title}</h3>
      <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-[13px] sm:text-xs text-slate-500 dark:text-neutral-400">
        <span className="inline-flex items-center gap-1.5">
          <Clock size={14} className="shrink-0" /> {formatAgendaRange(agenda)}
        </span>
        {agenda.location && (
          <span className="inline-flex items-center gap-1.5 min-w-0">
            <MapPin size={14} className="shrink-0" /> <span className="truncate">{agenda.location}</span>
          </span>
        )}
      </div>
      <span className="mt-4 inline-flex items-center gap-1.5 rounded-xl bg-red-600 dark:bg-rose-600 px-4 py-2 text-xs font-bold text-white shadow-sm transition-colors group-hover:bg-red-700 dark:group-hover:bg-rose-700">
        Detail acara <ArrowRight size={14} />
      </span>
    </Link>
  );
}
