import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { AlertTriangle, CalendarCheck, ChevronLeft, ChevronRight, ClipboardCheck, Clock, FileSpreadsheet, FileText, History, Landmark, Settings2, Users, Wallet } from "lucide-react";

import { auth } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabase";
import { arrearsPeriods, currentPeriod, formatPeriod, formatRupiah, isKasMember, isSettled, isTreasurerEmail, memberSetting, parseYearParam, periodEnd, toKasSetting, toMemberPeriod, type MemberPeriod, type IuranStatus, type KasSetting } from "@/lib/kas";
import { KasPageHeader } from "@/components/kas/KasPageHeader";
import { CardHeading, KasNotice, StatCard, cardClass } from "@/components/kas/KasUi";
import { IuranMatrix, type MemberPeriodState } from "@/components/kas/IuranMatrix";
import { KasSettingForm } from "@/components/kas/KasSettingForm";
import { KasPaymentForm } from "@/components/kas/KasPaymentForm";
import { KonfirmasiList, type PendingProof } from "@/components/kas/KonfirmasiList";
import { KasLogList, type KasLogAction, type KasLogItem } from "@/components/kas/KasLogList";

export const metadata: Metadata = {
  title: "Kelola Uang Kas",
  robots: { index: false, follow: false },
};

const TABS = [
  { key: "iuran", label: "Iuran Anggota", icon: Users },
  { key: "konfirmasi", label: "Konfirmasi", icon: ClipboardCheck },
  { key: "log", label: "Log Transaksi", icon: History },
  { key: "pengaturan", label: "Pengaturan", icon: Settings2 },
] as const;
type TabKey = (typeof TABS)[number]["key"];

type IuranRow = {
  id: string;
  userId: string;
  period: string;
  amount: number;
  paidAt: string;
  note: string | null;
  status: IuranStatus;
  proofUrl: string | null;
  submittedAt: string | null;
  rejectReason: string | null;
};

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
  if (!session?.user?.id) redirect("/login?callbackUrl=/kas/kelola");
  // Middleware sudah mengalihkan non-bendahara, tapi halaman ini tetap memeriksa sendiri —
  // data kas seluruh anggota tidak boleh sampai dirender untuk akun lain.
  if (!isTreasurerEmail(session.user.email)) redirect("/kas");

  const params = await searchParams;
  const tab: TabKey = TABS.some((t) => t.key === params.tab) ? (params.tab as TabKey) : "iuran";
  const nowPeriod = currentPeriod();
  const thisYear = Number(nowPeriod.slice(0, 4));
  const year = parseYearParam(params.tahun, thisYear);

  const [{ data: settingRow, error: settingError }, { data: userRows }, iuranResult, { data: logRows, error: logError }, { data: memberPeriodRows }] = await Promise.all([
    supabaseAdmin.from("KasSetting").select("*").eq("id", 1).maybeSingle(),
    supabaseAdmin.from("User").select("id, name, email, role, jabatan").order("name", { ascending: true }),
    fetchAll<IuranRow>("KasIuran", "id, userId, period, amount, paidAt, note, status, proofUrl, submittedAt, rejectReason", "period"),
    // Log transaksi terbaru (tabel KasLog, migrasi 027). Hanya 300 terakhir — cukup untuk
    // memantau aktivitas; riwayat lengkap tetap ada di export laporan. Cuma diambil saat tab
    // Log dibuka, supaya tab lain tidak ikut menunggu query yang hasilnya tidak ditampilkan.
    tab === "log"
      ? supabaseAdmin.from("KasLog").select("id, createdAt, action, userId, periods, amount, note").order("createdAt", { ascending: false }).limit(300)
      : Promise.resolve({ data: [] as Record<string, unknown>[], error: null }),
    // Periode khusus anggota yang masuk/keluar di tengah periode (migrasi 029). Kalau tabelnya
    // belum ada, hasilnya kosong dan semua anggota mengikuti periode umum.
    supabaseAdmin.from("KasMemberPeriod").select("*"),
  ]);

  const tableMissing = !!settingError || iuranResult.error;
  const setting: KasSetting = toKasSetting(settingRow);
  const members = (userRows ?? []).filter(isKasMember).map((u) => ({ id: u.id as string, name: (u.name as string) || "Tanpa Nama", jabatan: (u.jabatan as string | null) ?? null }));
  const memberIds = new Set(members.map((m) => m.id));

  const iuran = iuranResult.data;
  // Total hanya dari iuran yang sudah dikonfirmasi (LUNAS) — bukti yang masih menunggu atau
  // ditolak belum dianggap uang masuk.
  const lunas = iuran.filter((p) => p.status === "LUNAS");
  const totalIuran = lunas.reduce((s, p) => s + p.amount, 0);
  const yearIuran = lunas.filter((p) => p.period.startsWith(`${year}-`)).reduce((s, p) => s + p.amount, 0);

  // Bulan yang buktinya menunggu konfirmasi tidak dihitung tunggakan; yang ditolak dihitung lagi.
  const paidByMember = new Map<string, string[]>();
  for (const p of iuran) if (isSettled(p.status)) paidByMember.set(p.userId, [...(paidByMember.get(p.userId) ?? []), p.period]);
  const arrears: Record<string, number> = {};
  // Bulan yang sudah beres & yang ditolak per anggota (semua tahun) — dipakai pilihan bulan di
  // form "Catat Pembayaran Iuran", yang mencakup seluruh periode, bukan cuma tahun yang dilihat.
  const periodState: Record<string, MemberPeriodState> = {};
  for (const p of iuran) {
    const state = (periodState[p.userId] ??= { settled: [], rejected: [] });
    if (isSettled(p.status)) state.settled.push(p.period);
    else if (p.status === "DITOLAK") state.rejected.push(p.period);
  }
  const memberPeriods: Record<string, MemberPeriod> = {};
  for (const row of memberPeriodRows ?? []) {
    const period = toMemberPeriod(row);
    if (period) memberPeriods[row.userId as string] = period;
  }
  // Tunggakan tiap anggota dihitung dengan periode efektifnya sendiri (masuk/keluar di tengah periode).
  for (const m of members) arrears[m.id] = arrearsPeriods(paidByMember.get(m.id) ?? [], memberSetting(setting, memberPeriods[m.id]), nowPeriod).length;
  const totalArrears = Object.values(arrears).reduce((s, n) => s + n, 0);

  const yearPrefix = `${year}-`;
  const yearPayments = iuran.filter((p) => p.period.startsWith(yearPrefix) && memberIds.has(p.userId) && p.status !== "DITOLAK");

  // Bukti yang menunggu konfirmasi, dikelompokkan per kiriman (satu file bukti bisa untuk
  // beberapa bulan sekaligus), yang terlama di atas.
  const memberNames = new Map(members.map((m) => [m.id, m.name]));
  const pendingMap = new Map<string, PendingProof>();
  for (const p of iuran) {
    if (p.status !== "MENUNGGU" || !memberIds.has(p.userId)) continue;
    const key = `${p.userId}|${p.proofUrl ?? p.id}`;
    const group = pendingMap.get(key) ?? {
      key,
      ids: [],
      memberName: memberNames.get(p.userId) ?? "Anggota",
      periods: [],
      amountPerMonth: p.amount,
      total: 0,
      paidAt: p.paidAt,
      submittedAt: p.submittedAt,
      note: p.note,
      proofHref: `/kas/bukti/${p.id}`,
    };
    group.ids.push(p.id);
    group.periods.push(p.period);
    group.total += p.amount;
    pendingMap.set(key, group);
  }
  // Nama diambil dari semua akun (bukan cuma anggota aktif), supaya log anggota yang role-nya
  // sudah berubah tetap terbaca namanya.
  const allNames = new Map((userRows ?? []).map((u) => [u.id as string, (u.name as string) || "Tanpa Nama"]));
  const timeFormat = new Intl.DateTimeFormat("id-ID", { timeZone: "Asia/Jakarta", day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });
  const logs: KasLogItem[] = (logRows ?? []).map((l) => ({
    id: l.id as string,
    time: `${timeFormat.format(new Date(l.createdAt as string))} WIB`,
    action: l.action as KasLogAction,
    memberName: allNames.get(l.userId as string) ?? "Anggota",
    periods: (l.periods as string[]) ?? [],
    amount: (l.amount as number) ?? 0,
    note: (l.note as string | null) ?? null,
  }));

  const pending = [...pendingMap.values()]
    .map((g) => ({ ...g, periods: g.periods.sort() }))
    .sort((a, b) => (a.submittedAt ?? "").localeCompare(b.submittedAt ?? ""));

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
              <code className="px-1.5 py-0.5 rounded bg-amber-100 dark:bg-amber-900/60 font-mono text-[11px]">supabase/migrations/025_create_kas_tables.sql</code> dan{" "}
              <code className="px-1.5 py-0.5 rounded bg-amber-100 dark:bg-amber-900/60 font-mono text-[11px]">026_add_kas_iuran_proof_status.sql</code> (berurutan). Setelah itu, muat ulang halaman ini.
            </KasNotice>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
              <StatCard icon={Wallet} label="Total Iuran Masuk" value={formatRupiah(totalIuran)} hint={`${lunas.length} pembayaran`} tone="good" />
              <StatCard icon={CalendarCheck} label={`Iuran ${year}`} value={formatRupiah(yearIuran)} />
              <StatCard icon={Clock} label="Menunggu" value={`${pending.length} bukti`} hint="Perlu dikonfirmasi" />
              <StatCard icon={AlertTriangle} label="Tunggakan" value={formatRupiah(totalArrears * setting.monthlyFee)} hint={`${totalArrears} bulan`} tone={totalArrears > 0 ? "bad" : "good"} />
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
                  {key === "konfirmasi" && pending.length > 0 && (
                    <span className="inline-flex min-w-5 h-5 items-center justify-center rounded-full bg-amber-500 px-1.5 text-[11px] font-bold text-white">{pending.length}</span>
                  )}
                </Link>
              ))}
            </nav>

            {tab === "iuran" && (
              <div className={cardClass}>
                <CardHeading
                  icon={Users}
                  title={`Iuran Anggota ${year}`}
                  description={`${members.length} anggota · ${totalArrears} bulan tunggakan (${formatRupiah(totalArrears * setting.monthlyFee)}). Klik kotak bulan untuk mencatat atau melihat pembayaran.`}
                  action={
                    <div className="flex shrink-0 flex-wrap md:flex-nowrap items-center gap-2 self-start sm:self-auto">
                      <ExportButtons year={year} />
                      <YearNav tab={tab} year={year} />
                    </div>
                  }
                />
                <IuranMatrix members={members} payments={yearPayments} arrears={arrears} setting={setting} memberPeriods={memberPeriods} periodState={periodState} year={year} nowPeriod={nowPeriod} />
              </div>
            )}

            {tab === "konfirmasi" && (
              <div className={cardClass}>
                <CardHeading
                  icon={ClipboardCheck}
                  title="Konfirmasi Pembayaran"
                  description={pending.length ? `${pending.length} bukti pembayaran menunggu diperiksa. Konfirmasi kalau dana sudah diterima, atau tolak dengan alasan.` : "Tidak ada bukti pembayaran yang menunggu konfirmasi."}
                />
                <KonfirmasiList items={pending} />
              </div>
            )}

            {tab === "log" && (
              <div className={cardClass}>
                <CardHeading icon={History} title="Log Transaksi" description="Aktivitas iuran terbaru: siapa yang membayar, mengirim bukti, serta pembayaran yang dikonfirmasi atau ditolak." />
                {logError ? (
                  <KasNotice title="Tabel log belum dibuat di Supabase.">
                    Jalankan skrip{" "}
                    <code className="px-1.5 py-0.5 rounded bg-amber-100 dark:bg-amber-900/60 font-mono text-[11px]">supabase/migrations/027_create_kas_log_table.sql</code> di SQL Editor, lalu muat ulang halaman ini.
                  </KasNotice>
                ) : (
                  <KasLogList items={logs} />
                )}
              </div>
            )}

            {tab === "pengaturan" && (
              <div className={cardClass}>
                <CardHeading
                  icon={Settings2}
                  title="Pengaturan Iuran"
                  description={setting.startPeriod ? `Saat ini ${formatRupiah(setting.monthlyFee)} per bulan, periode ${formatPeriod(setting.startPeriod)} – ${formatPeriod(periodEnd(setting)!)}.` : "Iuran belum diatur."}
                />
                <KasSettingForm setting={setting} />
                <div className="mt-6">
                  <KasNotice title="Catatan:">Mengubah nominal tidak mengubah pembayaran yang sudah tercatat — riwayat tetap menyimpan nominal saat dibayar.</KasNotice>
                </div>
              </div>
            )}

            {/* Kartu terpisah: metode pembayaran (rekening & QRIS) yang ditampilkan ke anggota. */}
            {tab === "pengaturan" && (
              <div className={cardClass}>
                <CardHeading icon={Landmark} title="Metode Pembayaran" description="Rekening tujuan dan QRIS untuk membayar iuran. Ditampilkan ke anggota di halaman Uang Kas." />
                <KasPaymentForm banks={setting.banks ?? []} qrisUrl={setting.qrisUrl ?? null} />
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

// Unduh laporan iuran tahun yang sedang dilihat (app/(public)/kas/kelola/export/route.ts).
// <a download> biasa, bukan <Link>: hasilnya file, bukan halaman yang dinavigasi.
function ExportButtons({ year }: { year: number }) {
  const btn =
    "inline-flex items-center gap-1.5 h-9 px-3.5 rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/5 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-white/10 transition-colors";
  return (
    <>
      <a href={`/kas/kelola/export?format=pdf&tahun=${year}`} download className={btn}>
        <FileText size={15} className="text-red-600 dark:text-rose-400" />
        Export PDF
      </a>
      <a href={`/kas/kelola/export?format=xlsx&tahun=${year}`} download className={btn}>
        <FileSpreadsheet size={15} className="text-emerald-600 dark:text-emerald-400" />
        Export Excel
      </a>
    </>
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
