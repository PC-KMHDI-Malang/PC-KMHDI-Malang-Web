import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { CalendarDays, Clock, MapPin, Settings2 } from "lucide-react";

import { auth } from "@/lib/auth";
import { todayInJakarta } from "@/lib/date";
import { AGENDA_KIND_LABEL, agendaStatus, canViewAgenda, formatAgendaRange, isSecretaryEmail, resolveMonthParam } from "@/lib/agenda";
import { getPublishedAgendaForMonth, getUpcomingAgenda } from "@/lib/agendaQueries";
import { KasPageHeader } from "@/components/kas/KasPageHeader";
import { CardHeading, KasNotice, cardClass } from "@/components/kas/KasUi";
import { AgendaCalendar, KIND_CLASS } from "@/components/agenda/AgendaCalendar";

export const metadata: Metadata = {
  title: "Kalender Kegiatan",
  description: "Kalender kegiatan anggota PC KMHDI Malang.",
  robots: { index: false, follow: false },
};

// Agenda KHUSUS ANGGOTA — tidak dibuka ke publik dan tidak masuk sitemap. Dijaga dua lapis:
// authorized() di lib/auth.ts (middleware) dan pengecekan sesi di bawah ini; keduanya sengaja
// diulang supaya aturannya tidak bergantung pada satu lapis saja (sama seperti /kas).
export default async function AgendaPage({ searchParams }: { searchParams: Promise<{ bulan?: string }> }) {
  const session = await auth();
  if (!session?.user?.id) redirect("/login?callbackUrl=/agenda");
  // Akun Umum (VIEWER) tidak termasuk anggota.
  if (!canViewAgenda(session)) redirect("/profile");

  const month = resolveMonthParam((await searchParams).bulan);
  const today = todayInJakarta();

  const [monthResult, upcomingResult] = await Promise.all([getPublishedAgendaForMonth(month), getUpcomingAgenda(5)]);
  const tableMissing = monthResult.tableMissing || upcomingResult.tableMissing;
  const upcoming = upcomingResult.data;

  return (
    <div className="-mt-32 bg-slate-50/70 dark:bg-[#0a0a0c] transition-colors min-h-screen pb-20">
      <KasPageHeader
        badge="Akun Kader"
        title="Kalender Kegiatan"
        description="Jadwal rapat, kegiatan, dan tenggat penting PC KMHDI Malang."
        backHref="/profile"
        backLabel="Kembali ke Profil"
        action={
          isSecretaryEmail(session.user.email) && (
            <Link href="/agenda/kelola" className="self-start sm:self-auto inline-flex items-center gap-2 bg-white text-red-900 px-5 py-2.5 rounded-2xl text-xs sm:text-sm font-bold shadow-lg hover:bg-neutral-100 transition hover:scale-105">
              <Settings2 size={16} />
              Kelola Kalender
            </Link>
          )
        }
      />

      <div className="relative z-10 mx-auto max-w-5xl px-5 sm:px-6 lg:px-8 -mt-8 space-y-8">
        {tableMissing ? (
          <div className={cardClass}>
            <KasNotice title="Fitur kalender kegiatan belum siap.">Data agenda belum tersedia. Silakan coba lagi nanti atau hubungi pengurus.</KasNotice>
          </div>
        ) : (
          <>
            <div className={cardClass}>
              <AgendaCalendar month={month} items={monthResult.data} today={today} />
            </div>

            <div className={cardClass}>
              <CardHeading icon={CalendarDays} title="Akan Datang" description="Agenda yang sedang berlangsung dan yang terdekat." />

              {upcoming.length === 0 ? (
                <p className="text-sm text-slate-500 dark:text-neutral-400">Belum ada agenda yang dijadwalkan.</p>
              ) : (
                <ul className="space-y-3">
                  {upcoming.map((agenda) => {
                    const status = agendaStatus(agenda);
                    return (
                      <li key={agenda.id}>
                        <Link href={`/agenda/${agenda.slug}`} className="block rounded-2xl border border-slate-200/80 dark:border-white/10 p-4 hover:bg-slate-50 dark:hover:bg-white/5 transition-colors">
                          <div className="flex flex-wrap items-center gap-2 mb-2">
                            <span className={`inline-flex rounded-full border px-2.5 py-0.5 text-[11px] font-bold ${KIND_CLASS[agenda.kind]}`}>{AGENDA_KIND_LABEL[agenda.kind]}</span>
                            {status === "BERLANGSUNG" && <span className="inline-flex rounded-full border border-emerald-200 dark:border-emerald-900/50 bg-emerald-50 dark:bg-emerald-950/30 px-2.5 py-0.5 text-[11px] font-bold text-emerald-700 dark:text-emerald-400">Sedang berlangsung</span>}
                          </div>
                          <h3 className="font-bold text-slate-900 dark:text-white">{agenda.title}</h3>
                          <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-500 dark:text-neutral-400">
                            <span className="inline-flex items-center gap-1.5">
                              <Clock size={13} /> {formatAgendaRange(agenda)}
                            </span>
                            {agenda.location && (
                              <span className="inline-flex items-center gap-1.5">
                                <MapPin size={13} /> {agenda.location}
                              </span>
                            )}
                          </div>
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
