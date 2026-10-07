import { supabaseAdmin } from "@/lib/supabase";
import { jakartaDayRange } from "@/lib/date";
import { monthGrid, monthParamToParts, type Agenda } from "@/lib/agenda";

// Query database untuk fitur Agenda. Dipisah dari lib/agenda.ts supaya modul itu tetap murni
// (tanpa Supabase) dan bisa diuji unit. Semua baca/tulis lewat supabaseAdmin: tabelnya RLS tanpa
// policy, jadi fungsi-fungsi di sini TIDAK memeriksa siapa pemanggilnya — setiap halaman yang
// memakainya wajib sudah memastikan sesinya sendiri (canViewAgenda / isSecretaryEmail).

export type AgendaQueryResult<T> = { data: T; tableMissing: boolean };

function isMissingTable(error: { code?: string; message?: string } | null): boolean {
  return !!error && (error.code === "42P01" || /relation .* does not exist|schema cache/i.test(error.message ?? ""));
}

// Agenda PUBLISHED yang mulai dalam grid bulan itu (42 sel, termasuk tanggal pengisi bulan
// sebelum/sesudahnya, supaya sel-sel pengisi di kalender pun terisi). Agenda lintas hari hanya
// ditampilkan di tanggal mulainya.
export async function getPublishedAgendaForMonth(month: string): Promise<AgendaQueryResult<Agenda[]>> {
  const { year, month: m } = monthParamToParts(month);
  const grid = monthGrid(year, m);
  const from = jakartaDayRange(grid[0].date).start;
  const to = jakartaDayRange(grid[grid.length - 1].date).end;

  const { data, error } = await supabaseAdmin
    .from("Agenda")
    .select("*")
    .eq("status", "PUBLISHED")
    .gte("startAt", from)
    .lte("startAt", to)
    .order("startAt", { ascending: true });

  if (error) return { data: [], tableMissing: isMissingTable(error) };
  return { data: (data ?? []) as Agenda[], tableMissing: false };
}

// Agenda PUBLISHED berikutnya (dan yang sedang berlangsung hari ini), untuk daftar "Akan datang".
export async function getUpcomingAgenda(limit = 5): Promise<AgendaQueryResult<Agenda[]>> {
  const { data, error } = await supabaseAdmin
    .from("Agenda")
    .select("*")
    .eq("status", "PUBLISHED")
    .or(`startAt.gte.${new Date().toISOString()},endAt.gte.${new Date().toISOString()}`)
    .order("startAt", { ascending: true })
    .limit(limit);

  if (error) return { data: [], tableMissing: isMissingTable(error) };
  return { data: (data ?? []) as Agenda[], tableMissing: false };
}

export async function getAgendaBySlug(slug: string): Promise<AgendaQueryResult<Agenda | null>> {
  const { data, error } = await supabaseAdmin.from("Agenda").select("*").eq("slug", slug).maybeSingle();
  if (error) return { data: null, tableMissing: isMissingTable(error) };
  return { data: (data as Agenda | null) ?? null, tableMissing: false };
}

// Semua agenda (termasuk DRAFT) untuk halaman sekretaris. Dipaging manual karena Supabase
// memotong respons di 1000 baris — daftar agenda organisasi bertahun-tahun bisa melewatinya.
export async function getAllAgendaForManager(): Promise<AgendaQueryResult<Agenda[]>> {
  const PAGE = 1000;
  const all: Agenda[] = [];
  for (let from = 0; ; from += PAGE) {
    const { data, error } = await supabaseAdmin
      .from("Agenda")
      .select("*")
      .order("startAt", { ascending: false })
      .range(from, from + PAGE - 1);

    if (error) return { data: [], tableMissing: isMissingTable(error) };
    all.push(...((data ?? []) as Agenda[]));
    if (!data || data.length < PAGE) break;
  }
  return { data: all, tableMissing: false };
}
