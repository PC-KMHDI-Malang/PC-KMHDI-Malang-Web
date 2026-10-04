import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowDownLeft, ArrowUpRight, BookOpenCheck, ChevronLeft, ChevronRight, Landmark, Settings2, Users, Wallet } from "lucide-react";

import { auth } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabase";
import { arrearsPeriods, currentPeriod, formatPeriod, formatRupiah, isKasMember, isTreasurerEmail, ledgerSummary, parseYearParam, type KasSetting } from "@/lib/kas";
import { KasPageHeader } from "@/components/kas/KasPageHeader";
import { CardHeading, KasNotice, StatCard, cardClass } from "@/components/kas/KasUi";
import { IuranMatrix } from "@/components/kas/IuranMatrix";
import { KasTransaksiManager, type Transaksi } from "@/components/kas/KasTransaksiManager";
import { KasSettingForm } from "@/components/kas/KasSettingForm";

export const metadata: Metadata = {
  title: "Kelola Uang Kas",
  robots: { index: false, follow: false },
};

const TABS = [
  { key: "iuran", label: "Iuran Anggota", icon: Users },
  { key: "buku", label: "Buku Kas", icon: BookOpenCheck },
  { key: "pengaturan", label: "Pengaturan", icon: Settings2 },
] as const;
type TabKey = (typeof TABS)[number]["key"];

type IuranRow = { id: string; userId: string; period: string; amount: number; paidAt: string; note: string | null };

// Supabase membatasi satu query maksimal 1.000 baris. Iuran (anggota × bulan) bisa melewati itu
// setelah beberapa tahun, jadi diambil per halaman supaya total kas tidak diam-diam terpotong.
async function fetchAll<T>(table: string, columns: string, orderBy: string): Promise<{ data: T[]; error: boolean }> {
  const pageSize = 1000;
  const rows: T[] = [];
  for (let from = 0; ; from += pageSize) {
    const { data, error } = await supabaseAdmin
      .from(table)
      .select(columns)
      .order(orderBy, { ascending: false })
      .order("id")
      .range(from, from + pageSize - 1);
    if (error) return { data: [], error: true };
    rows.push(...((data ?? []) as T[]));
    if (!data || data.length < pageSize) return { data: rows, error: false };
  }
}

export default async function KelolaKasPage({ searchParams }: { searchParams: Promise<{ tab?: string; tahun?: string }> }) {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");
  // Middleware sudah mengalihkan non-bendahara, tapi halaman ini tetap memeriksa sendiri —
  // data kas seluruh anggota tidak boleh sampai dirender untuk akun lain.
  if (!isTreasurerEmail(session.user.email)) redirect("/kas");

  const params = await searchParams;
  const tab: TabKey = TABS.some((t) => t.key === params.tab) ? (params.tab as TabKey) : "iuran";
  const nowPeriod = currentPeriod();
  const thisYear = Number(nowPeriod.slice(0, 4));
  const year = parseYearParam(params.tahun, thisYear);

  const [{ data: settingRow, error: settingError }, { data: userRows }, iuranResult, transaksiResult] = await Promise.all([
    supabaseAdmin.from("KasSetting").select("monthlyFee, startPeriod").eq("id", 1).maybeSingle(),
    supabaseAdmin.from("User").select("id, name, email, role, jabatan").order("name", { ascending: true }),
    fetchAll<IuranRow>("KasIuran", "id, userId, period, amount, paidAt, note", "period"),
    fetchAll<Transaksi>("KasTransaksi", "id, type, amount, date, description, category", "date"),
  ]);

  const tableMissing = !!settingError || iuranResult.error || transaksiResult.error;
  const setting: KasSetting = { monthlyFee: settingRow?.monthlyFee ?? 0, startPeriod: settingRow?.startPeriod ?? null };
  const members = (userRows ?? []).filter(isKasMember).map((u) => ({ id: u.id as string, name: (u.name as string) || "Tanpa Nama", jabatan: (u.jabatan as string | null) ?? null }));
  const memberIds = new Set(members.map((m) => m.id));

  const iuran = iuranResult.data;
  const transaksi = transaksiResult.data;
  const summary = ledgerSummary(
    iuran.reduce((s, p) => s + p.amount, 0),
    transaksi,
  );

  const paidByMember = new Map<string, string[]>();
  for (const p of iuran) paidByMember.set(p.userId, [...(paidByMember.get(p.userId) ?? []), p.period]);
  const arrears: Record<string, number> = {};
  for (const m of members) arrears[m.id] = arrearsPeriods(paidByMember.get(m.id) ?? [], setting, nowPeriod).length;
  const totalArrears = Object.values(arrears).reduce((s, n) => s + n, 0);

  const yearPrefix = `${year}-`;
  const yearPayments = iuran.filter((p) => p.period.startsWith(yearPrefix) && memberIds.has(p.userId));
  const yearTransaksi = transaksi.filter((t) => t.date.startsWith(yearPrefix));

  return (
    <div className="-mt-32 bg-slate-50/70 dark:bg-[#0a0a0c] transition-colors min-h-screen pb-20">
      <KasPageHeader
        badge="Bendahara"
        title="Kelola Uang Kas"
        description="Catat iuran bulanan setiap anggota serta pemasukan dan pengeluaran kas organisasi."
        backHref="/kas"
        backLabel="Kembali ke Uang Kas"
      />

      <div className="relative z-10 mx-auto max-w-5xl px-5 sm:px-6 lg:px-8 -mt-8 space-y-8">
        {tableMissing ? (
          <div className={cardClass}>
            <KasNotice title="Tabel database kas belum dibuat di Supabase.">
              Buka <strong>Supabase Dashboard &gt; SQL Editor</strong>, lalu jalankan skrip{" "}
              <code className="px-1.5 py-0.5 rounded bg-amber-100 dark:bg-amber-900/60 font-mono text-[11px]">supabase/migrations/025_create_kas_tables.sql</code>. Setelah itu, muat ulang halaman ini.
            </KasNotice>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
              <StatCard icon={Landmark} label="Saldo Kas" value={formatRupiah(summary.balance)} tone={summary.balance < 0 ? "bad" : "good"} />
              <StatCard icon={Wallet} label="Total Iuran" value={formatRupiah(summary.iuranTotal)} hint={`${iuran.length} pembayaran`} />
              <StatCard icon={ArrowDownLeft} label="Pemasukan Lain" value={formatRupiah(summary.otherIncome)} />
              <StatCard icon={ArrowUpRight} label="Pengeluaran" value={formatRupiah(summary.expense)} tone="bad" />
            </div>

            {!setting.startPeriod && (
              <KasNotice title="Iuran belum diatur.">
                Tetapkan nominal dan bulan mulai iuran di tab{" "}
                <Link href="?tab=pengaturan" className="font-bold underline">
                  Pengaturan
                </Link>{" "}
                agar status lunas/tunggakan anggota bisa dihitung.
              </KasNotice>
            )}

            <nav className="flex gap-1 overflow-x-auto rounded-2xl border border-slate-200/80 dark:border-white/10 bg-white dark:bg-[#121215] p-1.5 shadow-xl">
              {TABS.map(({ key, label, icon: Icon }) => (
                <Link
                  key={key}
                  href={`?tab=${key}&tahun=${year}`}
                  scroll={false}
                  className={`flex flex-1 items-center justify-center gap-2 whitespace-nowrap rounded-xl px-4 py-2.5 text-sm font-semibold transition-colors ${
                    tab === key
                      ? "bg-red-50 dark:bg-[#1a1414] text-red-600 dark:text-rose-400 border border-red-100 dark:border-rose-900/30"
                      : "text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-50 dark:hover:bg-white/5 border border-transparent"
                  }`}
                >
                  <Icon size={16} />
                  {label}
                </Link>
              ))}
            </nav>

            {tab === "iuran" && (
              <div className={cardClass}>
                <CardHeading
                  icon={Users}
                  title={`Iuran Anggota ${year}`}
                  description={`${members.length} anggota · ${totalArrears} bulan tunggakan (${formatRupiah(totalArrears * setting.monthlyFee)}). Klik kotak bulan untuk mencatat atau melihat pembayaran.`}
                  action={<YearNav tab={tab} year={year} />}
                />
                <IuranMatrix members={members} payments={yearPayments} arrears={arrears} setting={setting} year={year} nowPeriod={nowPeriod} />
              </div>
            )}

            {tab === "buku" && (
              <div className={cardClass}>
                <CardHeading icon={BookOpenCheck} title={`Buku Kas ${year}`} description="Pemasukan di luar iuran dan pengeluaran organisasi. Iuran anggota otomatis terhitung di saldo." action={<YearNav tab={tab} year={year} />} />
                <KasTransaksiManager transaksi={yearTransaksi} />
              </div>
            )}

            {tab === "pengaturan" && (
              <div className={cardClass}>
                <CardHeading
                  icon={Settings2}
                  title="Pengaturan Iuran"
                  description={setting.startPeriod ? `Saat ini ${formatRupiah(setting.monthlyFee)} per bulan, berlaku sejak ${formatPeriod(setting.startPeriod)}.` : "Iuran belum diatur."}
                />
                <KasSettingForm setting={setting} />
                <div className="mt-6">
                  <KasNotice title="Catatan:">Mengubah nominal tidak mengubah pembayaran yang sudah tercatat — riwayat tetap menyimpan nominal saat dibayar. Daftar anggota diambil dari akun ber-role USER di Manajemen User (dikelola Admin).</KasNotice>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

function YearNav({ tab, year }: { tab: TabKey; year: number }) {
  const btn = "w-9 h-9 flex items-center justify-center rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/5 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/10 transition-colors";
  return (
    <div className="flex items-center gap-2 self-start sm:self-auto">
      <Link href={`?tab=${tab}&tahun=${year - 1}`} scroll={false} aria-label={`Tahun ${year - 1}`} className={btn}>
        <ChevronLeft size={16} />
      </Link>
      <span className="min-w-16 text-center text-sm font-bold text-slate-800 dark:text-white">{year}</span>
      <Link href={`?tab=${tab}&tahun=${year + 1}`} scroll={false} aria-label={`Tahun ${year + 1}`} className={btn}>
        <ChevronRight size={16} />
      </Link>
    </div>
  );
}
