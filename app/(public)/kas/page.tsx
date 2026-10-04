import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { CalendarCheck, CalendarDays, ChevronLeft, ChevronRight, History, Settings2, Wallet, AlertTriangle, CheckCircle2 } from "lucide-react";

import { auth } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabase";
import { currentPeriod, formatDate, formatPeriod, formatRupiah, isKasMember, isTreasurerEmail, memberYearStatus, MONTH_NAMES, parseYearParam, type IuranPayment, type KasSetting } from "@/lib/kas";
import { KasPageHeader } from "@/components/kas/KasPageHeader";
import { CardHeading, KasNotice, StatCard, STATUS_CLASS, STATUS_LABEL, cardClass } from "@/components/kas/KasUi";

export const metadata: Metadata = {
  title: "Uang Kas",
  description: "Catatan iuran kas bulanan akun kader PC KMHDI Malang.",
  robots: { index: false, follow: false },
};

// Halaman ini SENGAJA murni baca: tidak ada form, tombol aksi, atau Server Action sama sekali.
// Datanya juga cuma diambil untuk session.user.id — anggota tidak bisa melihat iuran anggota
// lain maupun saldo kas organisasi. Semua perubahan data kas lewat /kas/kelola (bendahara).
export default async function KasPage({ searchParams }: { searchParams: Promise<{ tahun?: string }> }) {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const isTreasurer = isTreasurerEmail(session.user.email);
  const nowPeriod = currentPeriod();
  const thisYear = Number(nowPeriod.slice(0, 4));
  const year = parseYearParam((await searchParams).tahun, thisYear);

  const [{ data: settingRow, error: settingError }, { data: paymentRows, error: paymentError }] = await Promise.all([
    supabaseAdmin.from("KasSetting").select("monthlyFee, startPeriod").eq("id", 1).maybeSingle(),
    supabaseAdmin.from("KasIuran").select("id, period, amount, paidAt, note").eq("userId", session.user.id).order("period", { ascending: false }),
  ]);

  const tableMissing = !!settingError || !!paymentError;
  const setting: KasSetting = { monthlyFee: settingRow?.monthlyFee ?? 0, startPeriod: settingRow?.startPeriod ?? null };
  const payments: IuranPayment[] = paymentRows ?? [];
  const summary = memberYearStatus(payments, year, setting, nowPeriod);
  const isMember = isKasMember({ email: session.user.email, role: session.user.role });

  // Navigasi tahun dibatasi dari tahun iuran mulai (atau pembayaran tertua) sampai tahun depan.
  const firstYear = Math.min(thisYear, Number((setting.startPeriod ?? nowPeriod).slice(0, 4)), ...payments.map((p) => Number(p.period.slice(0, 4))));
  const lastYear = thisYear + 1;

  return (
    <div className="-mt-32 bg-slate-50/70 dark:bg-[#0a0a0c] transition-colors min-h-screen pb-20">
      <KasPageHeader
        badge="Akun Kader"
        title="Uang Kas Saya"
        description="Pantau status iuran kas bulanan Anda. Data ini dicatat langsung oleh Bendahara PC KMHDI Malang."
        backHref="/profile"
        backLabel="Kembali ke Profil"
        action={
          isTreasurer && (
            <Link href="/kas/kelola" className="self-start sm:self-auto inline-flex items-center gap-2 bg-white text-red-900 px-5 py-2.5 rounded-2xl text-xs sm:text-sm font-bold shadow-lg hover:bg-neutral-100 transition hover:scale-105">
              <Settings2 size={16} />
              Kelola Kas
            </Link>
          )
        }
      />

      <div className="relative z-10 mx-auto max-w-5xl px-5 sm:px-6 lg:px-8 -mt-8 space-y-8">
        {tableMissing ? (
          <div className={cardClass}>
            <KasNotice title="Fitur kas belum siap.">Data uang kas belum tersedia. Silakan coba lagi nanti atau hubungi pengurus.</KasNotice>
          </div>
        ) : !isMember ? (
          <div className={cardClass}>
            <KasNotice title="Akun ini bukan akun anggota.">
              Iuran kas hanya berlaku untuk akun anggota (role User), bukan akun pengurus/admin, kontributor, atau akun bersama.{" "}
              {isTreasurer && (
                <>
                  Buka{" "}
                  <Link href="/kas/kelola" className="font-bold underline">
                    Kelola Kas
                  </Link>{" "}
                  untuk mencatat keuangan.
                </>
              )}
            </KasNotice>
          </div>
        ) : (
          <>
            {/* Ringkasan */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6">
              <StatCard icon={Wallet} label="Iuran per Bulan" value={setting.startPeriod ? formatRupiah(setting.monthlyFee) : "-"} hint={setting.startPeriod ? `Berlaku sejak ${formatPeriod(setting.startPeriod)}` : "Belum diatur bendahara"} />
              <StatCard icon={CalendarCheck} label={`Dibayar ${year}`} value={formatRupiah(summary.yearPaid)} hint={`${summary.months.filter((m) => m.status === "LUNAS").length} bulan lunas`} tone="good" />
              <StatCard
                icon={summary.arrearsCount > 0 ? AlertTriangle : CheckCircle2}
                label="Tunggakan"
                value={summary.arrearsCount > 0 ? formatRupiah(summary.arrearsAmount) : "Tidak ada"}
                hint={summary.arrearsCount > 0 ? `${summary.arrearsCount} bulan belum dibayar` : "Semua iuran sudah lunas"}
                tone={summary.arrearsCount > 0 ? "bad" : "good"}
              />
            </div>

            {!setting.startPeriod && <KasNotice title="Iuran belum diatur.">Bendahara belum menetapkan nominal dan bulan mulai iuran kas.</KasNotice>}

            {/* Status per bulan */}
            <div className={cardClass}>
              <CardHeading
                icon={CalendarDays}
                title={`Status Iuran ${year}`}
                description="Status pembayaran iuran untuk setiap bulan."
                action={
                  <div className="flex items-center gap-2 self-start sm:self-auto">
                    <YearLink year={year - 1} disabled={year - 1 < firstYear} direction="prev" />
                    <span className="min-w-16 text-center text-sm font-bold text-slate-800 dark:text-white">{year}</span>
                    <YearLink year={year + 1} disabled={year + 1 > lastYear} direction="next" />
                  </div>
                }
              />

              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                {summary.months.map((m, i) => (
                  <div key={m.period} className={`rounded-2xl border p-4 transition-colors ${STATUS_CLASS[m.status]}`}>
                    <p className="text-sm font-bold text-slate-800 dark:text-white">{MONTH_NAMES[i]}</p>
                    <p className="text-[11px] font-bold uppercase tracking-wider mt-1">{STATUS_LABEL[m.status]}</p>
                    {m.payment ? (
                      <p className="text-[11px] text-slate-500 dark:text-neutral-400 mt-2 leading-snug">
                        {formatRupiah(m.payment.amount)}
                        <br />
                        {formatDate(m.payment.paidAt)}
                      </p>
                    ) : m.status === "BELUM" ? (
                      <p className="text-[11px] text-slate-500 dark:text-neutral-400 mt-2">{formatRupiah(setting.monthlyFee)}</p>
                    ) : null}
                  </div>
                ))}
              </div>
            </div>

            {/* Riwayat */}
            <div className={cardClass}>
              <CardHeading icon={History} title="Riwayat Pembayaran" description="Seluruh iuran yang sudah tercatat atas nama Anda." />

              {payments.length === 0 ? (
                <p className="text-sm text-slate-500 dark:text-neutral-400 text-center py-6">Belum ada pembayaran iuran yang tercatat.</p>
              ) : (
                <div className="divide-y divide-slate-100 dark:divide-white/10">
                  {payments.map((p) => (
                    <div key={p.id} className="flex items-start justify-between gap-4 py-3.5 first:pt-0 last:pb-0">
                      <div className="min-w-0">
                        <p className="text-sm font-bold text-slate-800 dark:text-white">Iuran {formatPeriod(p.period)}</p>
                        <p className="text-xs text-slate-500 dark:text-neutral-400 mt-0.5">
                          Dibayar {formatDate(p.paidAt)}
                          {p.note ? ` · ${p.note}` : ""}
                        </p>
                      </div>
                      <p className="shrink-0 text-sm font-bold text-emerald-600 dark:text-emerald-400">{formatRupiah(p.amount)}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function YearLink({ year, disabled, direction }: { year: number; disabled: boolean; direction: "prev" | "next" }) {
  const Icon = direction === "prev" ? ChevronLeft : ChevronRight;
  const className = "w-9 h-9 flex items-center justify-center rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/5 text-slate-600 dark:text-slate-300 transition-colors";
  if (disabled) {
    return (
      <span className={`${className} opacity-40 cursor-not-allowed`} aria-hidden>
        <Icon size={16} />
      </span>
    );
  }
  return (
    <Link href={`?tahun=${year}`} scroll={false} aria-label={`Tahun ${year}`} className={`${className} hover:bg-slate-100 dark:hover:bg-white/10`}>
      <Icon size={16} />
    </Link>
  );
}
