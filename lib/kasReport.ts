import { supabaseAdmin } from "@/lib/supabase";
import { arrearsPeriods, currentPeriod, isKasMember, isSettled, monthStatus, memberSetting, periodsOfYear, toKasSetting, toMemberPeriod, type IuranStatus, type KasSetting, type MonthStatus } from "@/lib/kas";

// Data laporan iuran satu tahun untuk export PDF/Excel bendahara (app/(public)/kas/kelola/export).
// Aturan status & tunggakannya sama persis dengan halaman /kas/kelola: hanya LUNAS yang dihitung
// uang masuk, MENUNGGU bukan tunggakan, DITOLAK kembali jadi tunggakan.

export type ReportRow = {
  id: string;
  userId: string;
  period: string;
  amount: number;
  paidAt: string;
  note: string | null;
  status: IuranStatus;
};

export type ReportMember = {
  name: string;
  jabatan: string | null;
  months: { period: string; status: MonthStatus; amount: number | null }[];
  yearPaid: number;
  arrearsCount: number;
  arrearsAmount: number;
};

export type KasReport = {
  year: number;
  generatedAt: string;
  setting: KasSetting;
  members: ReportMember[];
  payments: (ReportRow & { memberName: string })[];
  totals: { yearPaid: number; pendingCount: number; arrearsCount: number; arrearsAmount: number };
};

async function fetchAllIuran(): Promise<ReportRow[]> {
  const rows: ReportRow[] = [];
  for (let from = 0; ; from += 1000) {
    const { data, error } = await supabaseAdmin
      .from("KasIuran")
      .select("id, userId, period, amount, paidAt, note, status")
      .order("period", { ascending: true })
      .order("id")
      .range(from, from + 999);
    if (error) throw new Error("Gagal membaca data iuran.");
    rows.push(...((data ?? []) as ReportRow[]));
    if (!data || data.length < 1000) return rows;
  }
}

export async function loadKasReport(year: number): Promise<KasReport> {
  const nowPeriod = currentPeriod();
  const [{ data: settingRow }, { data: userRows }, iuran, { data: memberPeriodRows }] = await Promise.all([
    supabaseAdmin.from("KasSetting").select("*").eq("id", 1).maybeSingle(),
    supabaseAdmin.from("User").select("id, name, email, role, jabatan").order("name", { ascending: true }),
    fetchAllIuran(),
    supabaseAdmin.from("KasMemberPeriod").select("*"),
  ]);
  const memberPeriods = new Map((memberPeriodRows ?? []).map((r) => [r.userId as string, toMemberPeriod(r)]));

  const setting: KasSetting = toKasSetting(settingRow);
  const users = (userRows ?? []).filter(isKasMember).map((u) => ({ id: u.id as string, name: (u.name as string) || "Tanpa Nama", jabatan: (u.jabatan as string | null) ?? null }));
  const names = new Map(users.map((u) => [u.id, u.name]));
  const periods = periodsOfYear(year);

  const byMember = new Map<string, ReportRow[]>();
  for (const row of iuran) if (names.has(row.userId)) byMember.set(row.userId, [...(byMember.get(row.userId) ?? []), row]);

  const members: ReportMember[] = users.map((u) => {
    const rows = byMember.get(u.id) ?? [];
    // Periode efektif anggota ini (masuk/keluar di tengah periode).
    const own = memberSetting(setting, memberPeriods.get(u.id));
    const byPeriod = new Map(rows.filter((r) => r.status !== "DITOLAK").map((r) => [r.period, r]));
    const months = periods.map((period) => {
      const row = byPeriod.get(period);
      return { period, status: monthStatus(period, row?.status ?? null, own, nowPeriod), amount: row ? row.amount : null };
    });
    const arrears = arrearsPeriods(
      rows.filter((r) => isSettled(r.status)).map((r) => r.period),
      own,
      nowPeriod,
    );
    return {
      name: u.name,
      jabatan: u.jabatan,
      months,
      yearPaid: months.reduce((s, m) => s + (m.status === "LUNAS" && m.amount ? m.amount : 0), 0),
      arrearsCount: arrears.length,
      arrearsAmount: arrears.length * setting.monthlyFee,
    };
  });

  const prefix = `${year}-`;
  const payments = iuran
    .filter((r) => r.period.startsWith(prefix) && names.has(r.userId))
    .map((r) => ({ ...r, memberName: names.get(r.userId)! }))
    .sort((a, b) => a.memberName.localeCompare(b.memberName, "id") || a.period.localeCompare(b.period));

  return {
    year,
    generatedAt: new Date().toISOString(),
    setting,
    members,
    payments,
    totals: {
      yearPaid: members.reduce((s, m) => s + m.yearPaid, 0),
      pendingCount: payments.filter((p) => p.status === "MENUNGGU").length,
      arrearsCount: members.reduce((s, m) => s + m.arrearsCount, 0),
      arrearsAmount: members.reduce((s, m) => s + m.arrearsAmount, 0),
    },
  };
}
