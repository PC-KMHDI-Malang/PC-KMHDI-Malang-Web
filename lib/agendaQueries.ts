import { unstable_cache } from "next/cache";

import { supabaseAdmin } from "@/lib/supabase";
import { jakartaDayRange, todayInJakarta } from "@/lib/date";
import { monthGrid, monthParamToParts, pickUpcoming, type Agenda } from "@/lib/agenda";

// Query database untuk fitur Agenda. Dipisah dari lib/agenda.ts supaya modul itu tetap murni
// (tanpa Supabase) dan bisa diuji unit. Semua baca/tulis lewat supabaseAdmin: tabelnya RLS tanpa
// policy, jadi fungsi-fungsi di sini TIDAK memeriksa siapa pemanggilnya — setiap halaman yang
// memakainya wajib sudah memastikan sesinya sendiri (canViewAgenda / isSecretaryEmail).
//
// Bacaan untuk kalender anggota (bulan + "Akan Datang") DI-CACHE lintas-request: isinya sama untuk
// semua anggota dan hanya berubah saat sekretaris mengubah agenda, sedangkan tiap bacaan ke
// database memakan ±170–250 ms. Cache dibersihkan seketika lewat updateTag("agenda") di
// app/actions/agenda.ts; revalidate di bawah hanya pengaman kalau data diubah di luar aplikasi.
// Kegagalan SENGAJA tidak ikut di-cache (lihat QueryError): kalau tabel belum dimigrasi lalu
// dimigrasi, halaman langsung normal — bukan menunggu cache kedaluwarsa.

export type AgendaQueryResult<T> = { data: T; tableMissing: boolean };

type DbError = { code?: string; message?: string };

function isMissingTable(error: DbError | null): boolean {
  return !!error && (error.code === "42P01" || /relation .* does not exist|schema cache/i.test(error.message ?? ""));
}

// unstable_cache tidak menyimpan hasil yang melempar. Error dibungkus supaya kode/pesan aslinya
// tetap bisa dibaca pemanggil untuk membedakan "tabel belum ada" dari gangguan sesaat.
class QueryError extends Error {
  code?: string;
  constructor(error: DbError) {
    super(error.message ?? "Query gagal");
    this.code = error.code;
  }
}

async function attempt(read: () => Promise<Agenda[]>): Promise<AgendaQueryResult<Agenda[]>> {
  try {
    return { data: await read(), tableMissing: false };
  } catch (error) {
    return { data: [], tableMissing: isMissingTable(error as DbError) };
  }
}

const fetchMonth = unstable_cache(
  async (from: string, to: string): Promise<Agenda[]> => {
    const { data, error } = await supabaseAdmin.from("Agenda").select("*").eq("status", "PUBLISHED").gte("startAt", from).lte("startAt", to).order("startAt", { ascending: true });
    if (error) throw new QueryError(error);
    return (data ?? []) as Agenda[];
  },
  ["agenda-month"],
  { revalidate: 300, tags: ["agenda"] },
);

// Agenda PUBLISHED yang mulai dalam grid bulan itu (42 sel, termasuk tanggal pengisi bulan
// sebelum/sesudahnya, supaya sel-sel pengisi di kalender pun terisi). Agenda lintas hari hanya
// ditampilkan di tanggal mulainya.
export async function getPublishedAgendaForMonth(month: string): Promise<AgendaQueryResult<Agenda[]>> {
  const { year, month: m } = monthParamToParts(month);
  const grid = monthGrid(year, m);
  const from = jakartaDayRange(grid[0].date).start;
  const to = jakartaDayRange(grid[grid.length - 1].date).end;
  return attempt(() => fetchMonth(from, to));
}

// Kandidat "Akan Datang": ditentukan dari awal hari ini (WIB), jadi kunci cache ikut berganti tiap
// hari. Cache-nya pendek (1 menit) karena filter "endAt >= sekarang" dievaluasi saat cache diisi;
// keputusan akhir (masih berlangsung atau sudah selesai) tetap diambil pickUpcoming() terhadap
// waktu SEKARANG di bawah, jadi agenda yang baru selesai tidak tampil walau kandidatnya masih ada.
//
// Query hanya MENYEMPITKAN kandidat; keputusan akhir ada di pickUpcoming() lewat agendaStatus(),
// supaya sama dengan badge "Sedang berlangsung". Kandidatnya:
//  - mulai sejak awal hari ini (WIB) — mencakup agenda hari ini yang jam mulainya sudah lewat
//    tapi belum punya jam selesai (dianggap berlangsung sampai akhir hari), atau agenda sepanjang
//    hari; dan yang mulai besok dst.
//  - atau jam selesainya masih di depan — agenda lintas hari yang mulai sebelum hari ini.
const fetchUpcomingCandidates = unstable_cache(
  async (startOfToday: string, limit: number): Promise<Agenda[]> => {
    const nowIso = new Date().toISOString();
    const { data, error } = await supabaseAdmin
      .from("Agenda")
      .select("*")
      .eq("status", "PUBLISHED")
      // Batas waktu ditulis dengan toISOString() ("...Z"): tanda "+" pada offset "+07:00" bisa terbaca
      // sebagai spasi di dalam filter or() dan merusak query.
      .or(`startAt.gte.${startOfToday},endAt.gte.${nowIso}`)
      .order("startAt", { ascending: true })
      // Sisakan ruang untuk yang ternyata sudah selesai hari ini dan disaring pickUpcoming().
      .limit(limit * 4);
    if (error) throw new QueryError(error);
    return (data ?? []) as Agenda[];
  },
  ["agenda-upcoming"],
  { revalidate: 60, tags: ["agenda"] },
);

// Agenda PUBLISHED yang sedang berlangsung atau belum mulai, untuk daftar "Akan Datang".
export async function getUpcomingAgenda(limit = 5): Promise<AgendaQueryResult<Agenda[]>> {
  const now = new Date();
  const startOfToday = new Date(jakartaDayRange(todayInJakarta(now)).start).toISOString();
  const result = await attempt(() => fetchUpcomingCandidates(startOfToday, limit));
  return { data: pickUpcoming(result.data, now, limit), tableMissing: result.tableMissing };
}

// Bacaan di bawah ini TIDAK di-cache: dipakai halaman sekretaris dan halaman detail, yang harus
// selalu menampilkan keadaan terbaru (draft, status diumumkan, dst.).

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
