import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { CalendarCheck, CalendarClock, CalendarDays, FileText } from "lucide-react";

import { auth } from "@/lib/auth";
import { agendaStatus, isSecretaryEmail } from "@/lib/agenda";
import { getAllAgendaForManager } from "@/lib/agendaQueries";
import { KasPageHeader } from "@/components/kas/KasPageHeader";
import { CardHeading, KasNotice, StatCard, cardClass } from "@/components/kas/KasUi";
import { AgendaManager } from "@/components/agenda/AgendaManager";

export const metadata: Metadata = {
  title: "Kelola Kalender Kegiatan",
  description: "Kelola kalender kegiatan PC KMHDI Malang.",
  robots: { index: false, follow: false },
};

type Tab = "mendatang" | "arsip" | "draft";
const TABS: { id: Tab; label: string }[] = [
  { id: "mendatang", label: "Mendatang" },
  { id: "draft", label: "Draft" },
  { id: "arsip", label: "Arsip" },
];

// Halaman sekretaris — bentuknya meniru /kas/kelola. Dijaga tiga lapis: authorized() di
// lib/auth.ts (middleware), pengecekan email di bawah ini, dan requireSecretary() di tiap Server
// Action (app/actions/agenda.ts). Lapisan terakhir yang benar-benar menentukan: dua lapis
// pertama cuma mengatur apa yang dirender.
export default async function KelolaAgendaPage({ searchParams }: { searchParams: Promise<{ tab?: string }> }) {
  const session = await auth();
  if (!session?.user?.id) redirect("/login?callbackUrl=/agenda/kelola");
  if (!isSecretaryEmail(session.user.email)) redirect("/agenda");

  const requested = (await searchParams).tab;
  const tab: Tab = TABS.some((t) => t.id === requested) ? (requested as Tab) : "mendatang";

  const { data: all, tableMissing } = await getAllAgendaForManager();
  const now = new Date();

  const published = all.filter((a) => a.status === "PUBLISHED");
  const drafts = all.filter((a) => a.status === "DRAFT");
  const upcoming = published.filter((a) => agendaStatus(a, now) !== "SELESAI");
  const archive = published.filter((a) => agendaStatus(a, now) === "SELESAI");

  // Mendatang: yang terdekat dulu. Arsip & draft: yang terbaru dulu (query sudah menurun).
  const upcomingAsc = [...upcoming].sort((a, b) => new Date(a.startAt).getTime() - new Date(b.startAt).getTime());
  const shown = tab === "mendatang" ? upcomingAsc : tab === "draft" ? drafts : archive;

  return (
    <div className="-mt-32 bg-slate-50/70 dark:bg-[#0a0a0c] transition-colors min-h-screen pb-20">
      <KasPageHeader
        badge="Sekretaris"
        title="Kelola Kalender Kegiatan"
        description="Buat, ubah, dan terbitkan agenda organisasi. Agenda yang terbit tampil di kalender anggota."
        backHref="/agenda"
        backLabel="Lihat Kalender Kegiatan"
      />

      <div className="relative z-10 mx-auto max-w-5xl px-5 sm:px-6 lg:px-8 -mt-8 space-y-8">
        {tableMissing ? (
          <div className={cardClass}>
            <KasNotice title="Tabel agenda belum dibuat.">
              Jalankan migrasi <span className="font-mono">034_create_agenda_table.sql</span> di Supabase SQL Editor, lalu muat ulang halaman ini.
            </KasNotice>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <StatCard icon={CalendarClock} label="Mendatang" value={String(upcoming.length)} hint="Agenda terbit yang belum selesai" tone="good" />
              <StatCard icon={FileText} label="Draft" value={String(drafts.length)} hint="Belum terbit, belum terlihat anggota" />
              <StatCard icon={CalendarCheck} label="Selesai" value={String(archive.length)} hint="Sudah lewat" />
            </div>

            <div className={cardClass}>
              <CardHeading icon={CalendarDays} title="Daftar Agenda" description="Kelola semua agenda organisasi." />

              <div className="flex gap-2 mb-6 overflow-x-auto">
                {TABS.map((t) => (
                  <Link
                    key={t.id}
                    href={`?tab=${t.id}`}
                    className={`shrink-0 rounded-xl px-4 py-2 text-xs font-bold transition-colors ${
                      tab === t.id ? "bg-red-600 dark:bg-rose-600 text-white" : "bg-slate-50 dark:bg-white/5 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/10"
                    }`}
                  >
                    {t.label}
                  </Link>
                ))}
              </div>

              <AgendaManager items={shown} />
            </div>
          </>
        )}
      </div>
    </div>
  );
}
