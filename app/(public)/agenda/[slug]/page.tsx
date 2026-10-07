import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { CalendarDays, Clock, Link2, MapPin, StickyNote, Users } from "lucide-react";

import { auth } from "@/lib/auth";
import { AGENDA_KIND_LABEL, AGENDA_STATUS_LABEL, agendaStatus, canViewAgenda, describeAudience, formatAgendaRange } from "@/lib/agenda";
import { getAgendaBySlug } from "@/lib/agendaQueries";
import { KasPageHeader } from "@/components/kas/KasPageHeader";
import { KasNotice, cardClass } from "@/components/kas/KasUi";
import { KIND_CLASS } from "@/components/agenda/AgendaCalendar";

type Params = { slug: string };

// Agenda khusus anggota: halaman ini tidak boleh diindeks, dan metadata sengaja generik —
// judul agenda tidak ikut ke pratinjau tautan atau mesin pencari.
export const metadata: Metadata = {
  title: "Detail Agenda",
  robots: { index: false, follow: false },
};

export default async function AgendaDetailPage({ params }: { params: Promise<Params> }) {
  const { slug } = await params;
  const session = await auth();
  if (!session?.user?.id) redirect(`/login?callbackUrl=/agenda/${encodeURIComponent(slug)}`);
  if (!canViewAgenda(session)) redirect("/profile");

  const { data: agenda, tableMissing } = await getAgendaBySlug(slug);

  if (tableMissing) {
    return (
      <div className="-mt-32 bg-slate-50/70 dark:bg-[#0a0a0c] min-h-screen pb-20">
        <KasPageHeader badge="Akun Kader" title="Kalender Kegiatan" description="Detail agenda PC KMHDI Malang." backHref="/agenda" backLabel="Kembali ke Kalender" />
        <div className="relative z-10 mx-auto max-w-3xl px-5 sm:px-6 lg:px-8 -mt-8">
          <div className={cardClass}>
            <KasNotice title="Fitur kalender kegiatan belum siap.">Data agenda belum tersedia. Silakan coba lagi nanti atau hubungi pengurus.</KasNotice>
          </div>
        </div>
      </div>
    );
  }

  // Draft dan agenda yang tidak ada diperlakukan sama: 404 — keberadaan draft tidak boleh bocor,
  // bahkan ke anggota (draft hanya terlihat di halaman sekretaris).
  if (!agenda || agenda.status !== "PUBLISHED") notFound();

  const status = agendaStatus(agenda);

  return (
    <div className="-mt-32 bg-slate-50/70 dark:bg-[#0a0a0c] transition-colors min-h-screen pb-20">
      <KasPageHeader badge={AGENDA_KIND_LABEL[agenda.kind]} title={agenda.title} description={formatAgendaRange(agenda)} backHref="/agenda" backLabel="Kembali ke Kalender" />

      <div className="relative z-10 mx-auto max-w-3xl px-5 sm:px-6 lg:px-8 -mt-8 space-y-6">
        <div className={cardClass}>
          <div className="flex flex-wrap items-center gap-2 mb-6">
            <span className={`inline-flex rounded-full border px-3 py-1 text-xs font-bold ${KIND_CLASS[agenda.kind]}`}>{AGENDA_KIND_LABEL[agenda.kind]}</span>
            <span className="inline-flex rounded-full border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/5 px-3 py-1 text-xs font-bold text-slate-600 dark:text-slate-300">{AGENDA_STATUS_LABEL[status]}</span>
          </div>

          <dl className="space-y-4 text-sm">
            <Row icon={Clock} label="Waktu">
              {formatAgendaRange(agenda)}
            </Row>
            {agenda.location && (
              <Row icon={MapPin} label="Lokasi">
                {agenda.location}
              </Row>
            )}
            {agenda.locationDetail && (
              <Row icon={Link2} label="Tautan / detail lokasi">
                {/^https?:\/\//i.test(agenda.locationDetail) ? (
                  <a href={agenda.locationDetail} target="_blank" rel="noopener noreferrer" className="font-semibold text-red-600 dark:text-rose-400 hover:underline break-all">
                    {agenda.locationDetail}
                  </a>
                ) : (
                  agenda.locationDetail
                )}
              </Row>
            )}
            <Row icon={Users} label="Peserta">
              {describeAudience(agenda)}
            </Row>
          </dl>

          {agenda.description && (
            <div className="mt-6 pt-6 border-t border-slate-100 dark:border-white/10">
              <h2 className="flex items-center gap-2 text-sm font-bold text-slate-900 dark:text-white mb-2">
                <CalendarDays size={16} className="text-red-600 dark:text-rose-400" /> Tentang agenda
              </h2>
              <p className="text-sm text-slate-600 dark:text-neutral-300 leading-relaxed whitespace-pre-line">{agenda.description}</p>
            </div>
          )}

          {agenda.internalNote && (
            <div className="mt-6 pt-6 border-t border-slate-100 dark:border-white/10">
              <h2 className="flex items-center gap-2 text-sm font-bold text-slate-900 dark:text-white mb-2">
                <StickyNote size={16} className="text-amber-600 dark:text-amber-400" /> Catatan
              </h2>
              <p className="text-sm text-slate-600 dark:text-neutral-300 leading-relaxed whitespace-pre-line rounded-2xl border border-amber-200 dark:border-amber-900/50 bg-amber-50 dark:bg-amber-950/25 p-4">{agenda.internalNote}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function Row({ icon: Icon, label, children }: { icon: typeof Clock; label: string; children: React.ReactNode }) {
  return (
    <div className="flex gap-3">
      <div className="w-9 h-9 shrink-0 rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 flex items-center justify-center text-slate-500 dark:text-slate-400">
        <Icon size={16} />
      </div>
      <div className="min-w-0">
        <dt className="text-xs font-semibold text-slate-500 dark:text-neutral-400">{label}</dt>
        <dd className="mt-0.5 font-medium text-slate-800 dark:text-slate-100">{children}</dd>
      </div>
    </div>
  );
}
