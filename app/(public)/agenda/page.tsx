import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { CalendarDays, Settings2 } from "lucide-react";

import { auth } from "@/lib/auth";
import { todayInJakarta } from "@/lib/date";
import { canViewAgenda, isSecretaryEmail, resolveMonthParam } from "@/lib/agenda";
import { getPublishedAgendaForMonth, getUpcomingAgenda } from "@/lib/agendaQueries";
import { KasPageHeader } from "@/components/kas/KasPageHeader";
import { CardHeading, KasNotice, cardClass } from "@/components/kas/KasUi";
import { AgendaCalendar } from "@/components/agenda/AgendaCalendar";
import { AgendaCard } from "@/components/agenda/AgendaCard";

export const metadata: Metadata = {
  title: "Kalender Kegiatan",
  description: "Kalender kegiatan anggota PC KMHDI Malang.",
  robots: { index: false, follow: false },
};

// Kartu kalender memakai padding lebih kecil di HP: kisi 7 kolom di dalam padding 24 px hanya
// menyisakan ±44 px per tanggal, terlalu sempit untuk judul agenda.
const calendarCardClass = cardClass.replace("p-6 sm:p-8", "p-2 sm:p-8");

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

      <div className="relative z-10 mx-auto max-w-5xl px-3 sm:px-6 lg:px-8 -mt-8 space-y-6 sm:space-y-8">
        {tableMissing ? (
          <div className={cardClass}>
            <KasNotice title="Fitur kalender kegiatan belum siap.">Data agenda belum tersedia. Silakan coba lagi nanti atau hubungi pengurus.</KasNotice>
          </div>
        ) : (
          <>
            <div className={calendarCardClass}>
              <AgendaCalendar month={month} items={monthResult.data} today={today} />
            </div>

            <div className={cardClass}>
              <CardHeading icon={CalendarDays} title="Akan Datang" description="Agenda yang sedang berlangsung dan yang terdekat." />

              {upcoming.length === 0 ? (
                <p className="text-sm text-slate-500 dark:text-neutral-400">Belum ada agenda yang dijadwalkan.</p>
              ) : (
                <ul className="space-y-3">
                  {upcoming.map((agenda) => (
                    <li key={agenda.id}>
                      <AgendaCard agenda={agenda} />
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
