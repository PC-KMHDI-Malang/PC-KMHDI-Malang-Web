import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";

import { AGENDA_KIND_LABEL, DAY_SHORT, formatMonthParam, groupAgendaByDate, monthGrid, monthParamToParts, shiftMonthParam, type Agenda, type AgendaKind } from "@/lib/agenda";
import { timeInJakarta } from "@/lib/date";

// Kalender bulanan tanpa dependency dan tanpa JavaScript klien: navigasi bulan hanyalah <Link>
// ke ?bulan=YYYY-MM, dan seluruh grid dirender di server dari monthGrid() (lib/agenda.ts).
//
// Satu grid yang sama untuk semua ukuran layar. Di HP kotaknya hanya ±48 px, jadi judul agenda
// dibiarkan turun ke bawah (maksimal 2 baris) dengan huruf kecil, bukan dipotong satu baris:
// supaya namanya tetap terbaca. Jamnya baru ditampilkan di layar lebar.

export const KIND_CLASS: Record<AgendaKind, string> = {
  RAPAT: "bg-amber-50 dark:bg-amber-950/30 border-amber-200 dark:border-amber-900/50 text-amber-800 dark:text-amber-300",
  KEGIATAN: "bg-red-50 dark:bg-rose-950/30 border-red-200 dark:border-rose-900/50 text-red-700 dark:text-rose-300",
  DEADLINE: "bg-slate-100 dark:bg-white/10 border-slate-300 dark:border-white/20 text-slate-700 dark:text-slate-200",
  LAINNYA: "bg-emerald-50 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-900/50 text-emerald-800 dark:text-emerald-300",
};

// Cukup field yang dipakai grid.
type CalendarItem = Pick<Agenda, "id" | "slug" | "title" | "kind" | "startAt" | "allDay">;

const MAX_CHIPS = 3;

const navButton =
  "w-10 h-10 sm:w-9 sm:h-9 flex items-center justify-center rounded-xl bg-slate-50 dark:bg-white/5 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/10 active:bg-slate-200 dark:active:bg-white/15 transition-colors";

export function AgendaCalendar({ month, items, today, basePath = "/agenda" }: { month: string; items: CalendarItem[]; today: string; basePath?: string }) {
  const { year, month: m } = monthParamToParts(month);
  const cells = monthGrid(year, m);
  const byDate = groupAgendaByDate(items);

  const prev = `${basePath}?bulan=${shiftMonthParam(month, -1)}`;
  const next = `${basePath}?bulan=${shiftMonthParam(month, 1)}`;

  return (
    <div>
      <div className="flex items-center justify-between gap-3 mb-3 sm:mb-5 px-1.5 sm:px-0">
        <h2 className="text-lg sm:text-2xl font-extrabold tracking-tight whitespace-nowrap text-slate-900 dark:text-white">{formatMonthParam(month)}</h2>
        <div className="flex items-center gap-1.5 sm:gap-2">
          <Link href={basePath} className="h-10 sm:h-auto px-3 sm:py-2 inline-flex items-center whitespace-nowrap rounded-xl text-xs font-bold text-slate-600 dark:text-slate-300 bg-slate-50 dark:bg-white/5 hover:bg-slate-100 dark:hover:bg-white/10 active:bg-slate-200 dark:active:bg-white/15 transition-colors">
            Hari ini
          </Link>
          <Link href={prev} aria-label="Bulan sebelumnya" className={navButton}>
            <ChevronLeft size={18} />
          </Link>
          <Link href={next} aria-label="Bulan berikutnya" className={navButton}>
            <ChevronRight size={18} />
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-7 gap-px rounded-2xl overflow-hidden border border-slate-200 dark:border-white/10 bg-slate-200 dark:bg-white/10">
        {DAY_SHORT.map((day) => (
          <div key={day} className="bg-slate-50 dark:bg-[#17171b] py-1.5 sm:py-2 text-center text-[10px] sm:text-xs font-bold uppercase tracking-wide sm:tracking-wider text-slate-500 dark:text-neutral-400">
            {day}
          </div>
        ))}

        {cells.map((cell) => {
          const dayItems = byDate.get(cell.date) ?? [];
          const isToday = cell.date === today;
          const visible = dayItems.slice(0, MAX_CHIPS);
          const extra = dayItems.length - visible.length;

          return (
            <div key={cell.date} className={`min-h-20 sm:min-h-26 p-0.5 sm:p-1.5 ${cell.inMonth ? "bg-white dark:bg-[#121215]" : "bg-slate-50/70 dark:bg-[#0e0e11]"}`}>
              <span
                className={`inline-flex items-center justify-center w-5 h-5 sm:w-7 sm:h-7 rounded-full text-[10px] sm:text-xs font-bold ${
                  isToday ? "bg-red-600 dark:bg-rose-600 text-white" : cell.inMonth ? "text-slate-800 dark:text-slate-200" : "text-slate-300 dark:text-neutral-600"
                }`}
              >
                {cell.day}
              </span>

              <div className="mt-0.5 sm:mt-1 space-y-0.5 sm:space-y-1">
                {visible.map((item) => (
                  <Link
                    key={item.id}
                    href={`/agenda/${item.slug}`}
                    title={`${AGENDA_KIND_LABEL[item.kind]}: ${item.title}`}
                    className={`rounded sm:rounded-lg border px-0.5 sm:px-1.5 py-0.5 text-[9px] sm:text-[11px] font-semibold leading-[1.15] sm:leading-tight wrap-break-word line-clamp-3 sm:line-clamp-1 hover:opacity-80 active:opacity-70 transition-opacity ${KIND_CLASS[item.kind]}`}
                  >
                    {!item.allDay && <span className="hidden sm:inline opacity-70">{timeInJakarta(item.startAt)} </span>}
                    {item.title}
                  </Link>
                ))}
                {extra > 0 && <p className="px-0.5 sm:px-1 text-[9px] sm:text-[11px] font-semibold text-slate-500 dark:text-neutral-400">+{extra} lagi</p>}
              </div>
            </div>
          );
        })}
      </div>

      <div className="mt-4 flex flex-wrap gap-x-4 gap-y-2 px-1.5 sm:px-0">
        {(Object.keys(AGENDA_KIND_LABEL) as AgendaKind[]).map((kind) => (
          <span key={kind} className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 dark:text-neutral-400">
            <span className={`w-2.5 h-2.5 rounded-full border ${KIND_CLASS[kind]}`} />
            {AGENDA_KIND_LABEL[kind]}
          </span>
        ))}
      </div>
    </div>
  );
}
