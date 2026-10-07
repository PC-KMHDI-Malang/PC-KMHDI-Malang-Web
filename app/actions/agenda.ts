"use server";

import { revalidatePath, updateTag } from "next/cache";
import { after } from "next/server";

import { requireSecretary } from "@/lib/guard";
import { supabaseAdmin } from "@/lib/supabase";
import { canAnnounceAgenda, parseAgendaInput, slugifyAgenda, takeSnapshot, type Agenda, type AgendaInput } from "@/lib/agenda";
import { hasPendingChange, type NotifyReason } from "@/lib/notify/content";
import { dispatchAgendaNotification } from "@/lib/notify/dispatch";

// Satu-satunya jalur tulis untuk data agenda. Server Action adalah endpoint HTTP publik (lihat
// catatan di lib/guard.ts), jadi SETIAP action di sini wajib memeriksa sesinya sendiri lewat
// guard() → requireSecretary(). Input form dianggap tidak tepercaya dan selalu diparse ulang di
// server (parseAgendaInput), bukan mengandalkan validasi di komponen klien.
//
// Alur notifikasi (dipisah dari penerbitan):
//  - menerbitkan / mengubah / menarik agenda TIDAK mengumumkan apa pun;
//  - sekretaris menekan "Kirim notifikasi" -> announceAgendaAction (pengumuman, sekali per agenda);
//  - agenda yang SUDAH diumumkan lalu berubah jadwal/tempatnya TIDAK dikabarkan otomatis: daftar
//    menandainya "Ada perubahan" (hasPendingChange), dan sekretaris menekan "Kirim pembaruan" ->
//    sendAgendaUpdateAction;
//  - pengingat H-1 berjalan sendiri lewat cron, mengikuti kolom remindH1.

type ActionResult = { success: boolean; error: string | null };

const ok: ActionResult = { success: true, error: null };
const fail = (error: string): ActionResult => ({ success: false, error });

function revalidateAgenda(slug?: string | null) {
  // Bacaan kalender anggota di-cache lintas-request (lib/agendaQueries.ts): bersihkan seketika supaya
  // perubahan sekretaris langsung terlihat, bukan menunggu pengaman 1–5 menit.
  updateTag("agenda");
  revalidatePath("/agenda");
  revalidatePath("/agenda/kelola");
  if (slug) revalidatePath(`/agenda/${slug}`);
}

async function guard(): Promise<{ error: ActionResult } | { userId: string | null }> {
  try {
    const session = await requireSecretary();
    return { userId: session.user.id ?? null };
  } catch {
    return { error: fail("Hanya akun sekretaris yang dapat mengelola agenda.") };
  }
}

// Kirim notifikasi SESUDAH respons dikirim ke browser (after): sekretaris tidak perlu menunggu
// puluhan email terkirim, dan kegagalan pengiriman tidak pernah membuat penyimpanan agenda
// terlihat gagal. dispatchAgendaNotification sendiri tidak melempar; try/catch ini hanya jaring
// pengaman kalau after() dipanggil di luar konteks request.
function notifyAfter(agenda: Agenda, reason: NotifyReason, before?: Agenda) {
  try {
    after(async () => {
      await dispatchAgendaNotification(agenda, reason, undefined, { before });
    });
  } catch (error) {
    console.error("[agenda] gagal menjadwalkan notifikasi:", error);
  }
}

// Beberapa agenda sekaligus, dikirim BERURUTAN (bukan paralel) supaya laju kirim ke penyedia
// email tetap wajar.
function notifyManyAfter(agendas: Agenda[], reason: NotifyReason) {
  try {
    after(async () => {
      for (const agenda of agendas) await dispatchAgendaNotification(agenda, reason);
    });
  } catch (error) {
    console.error("[agenda] gagal menjadwalkan notifikasi:", error);
  }
}

// Judul → slug unik. Akhiran acak selalu ditambahkan (bukan hanya saat bentrok) supaya dua agenda
// berjudul sama — "Rapat Pleno" tiap bulan — tidak pernah berebut slug dan URL-nya tidak bisa
// ditebak. Kolom slug UNIQUE di database tetap jadi pengaman terakhir.
function buildSlug(title: string): string {
  const base = slugifyAgenda(title) || "agenda";
  const suffix = Math.random().toString(36).slice(2, 7);
  return `${base}-${suffix}`;
}

function isUniqueViolation(error: { code?: string } | null): boolean {
  return error?.code === "23505";
}

function isMissingTable(error: { code?: string; message?: string } | null): boolean {
  return !!error && (error.code === "42P01" || /relation .* does not exist|schema cache/i.test(error.message ?? ""));
}

// Kolom remindH1 / announcedAt baru ada setelah migrasi 039.
function isMissingColumn(error: { code?: string } | null): boolean {
  return error?.code === "42703";
}

const MISSING_COLUMN = "Kolom pengumuman/pengingat belum ada. Jalankan migrasi 039_add_announce_and_reminder_to_agenda.sql di Supabase terlebih dahulu.";

const MISSING_TABLE = "Tabel agenda belum dibuat. Jalankan migrasi 034_create_agenda_table.sql di Supabase terlebih dahulu.";

export async function createAgendaAction(input: AgendaInput, publish: boolean): Promise<ActionResult & { id?: string }> {
  const g = await guard();
  if ("error" in g) return g.error;

  const parsed = parseAgendaInput(input);
  if (!parsed.ok) return fail(parsed.error);

  // Satu kali ulang kalau akhiran acaknya kebetulan bentrok.
  for (let attempt = 0; attempt < 2; attempt += 1) {
    const { data, error } = await supabaseAdmin
      .from("Agenda")
      .insert([{ ...parsed.value, slug: buildSlug(parsed.value.title), status: publish ? "PUBLISHED" : "DRAFT", createdBy: g.userId }])
      .select("*")
      .single();

    if (!error && data) {
      const created = data as Agenda;
      revalidateAgenda(created.slug);
      // Menerbitkan TIDAK mengumumkan: kalender saja yang terisi. Pengumuman lewat tombol "Kirim notifikasi".
      return { ...ok, id: created.id };
    }
    if (isMissingTable(error)) return fail(MISSING_TABLE);
    if (isMissingColumn(error)) return fail(MISSING_COLUMN);
    if (!isUniqueViolation(error)) return fail("Gagal menyimpan agenda. Silakan coba lagi.");
  }
  return fail("Gagal membuat alamat agenda yang unik. Silakan coba lagi.");
}

export async function updateAgendaAction(id: string, input: AgendaInput): Promise<ActionResult> {
  const g = await guard();
  if ("error" in g) return g.error;
  if (typeof id !== "string" || !id) return fail("Agenda tidak valid.");

  const parsed = parseAgendaInput(input);
  if (!parsed.ok) return fail(parsed.error);

  // Slug sengaja tidak diubah: tautan yang sudah dibagikan tidak boleh putus gara-gara judul diedit.
  // announcedAt dan notifiedSnapshot juga tidak disentuh di sini — hanya announceAgendaAction dan
  // sendAgendaUpdateAction yang boleh mengubahnya. Dengan begitu menyimpan perubahan TIDAK mengirim
  // apa pun; selisihnya baru terlihat sebagai "Ada perubahan" dan dikirim saat sekretaris menekan tombolnya.
  const { data, error } = await supabaseAdmin
    .from("Agenda")
    .update({ ...parsed.value, updatedAt: new Date().toISOString() })
    .eq("id", id)
    .select("*")
    .maybeSingle();

  if (isMissingTable(error)) return fail(MISSING_TABLE);
  if (isMissingColumn(error)) return fail(MISSING_COLUMN);
  if (error) return fail("Gagal menyimpan perubahan. Silakan coba lagi.");
  if (!data) return fail("Agenda tidak ditemukan.");

  revalidateAgenda((data as Agenda).slug);
  return ok;
}

// Terbitkan draft, atau tarik kembali agenda yang sudah terbit menjadi draft. Tidak mengirim
// notifikasi apa pun: menerbitkan hanya memunculkan agenda di kalender anggota.
export async function setAgendaPublishedAction(id: string, published: boolean): Promise<ActionResult> {
  const g = await guard();
  if ("error" in g) return g.error;
  if (typeof id !== "string" || !id) return fail("Agenda tidak valid.");

  const { data, error } = await supabaseAdmin
    .from("Agenda")
    .update({ status: published ? "PUBLISHED" : "DRAFT", updatedAt: new Date().toISOString() })
    .eq("id", id)
    .select("slug")
    .maybeSingle();

  if (isMissingTable(error)) return fail(MISSING_TABLE);
  if (error) return fail("Gagal mengubah status agenda. Silakan coba lagi.");
  if (!data) return fail("Agenda tidak ditemukan.");

  revalidateAgenda(data.slug as string);
  return ok;
}

// Umumkan satu agenda ke anggota (lonceng + email). Aman ditekan berulang: catatan terkirim
// (NotificationDelivery) menjamin penerima yang sudah dikirimi tidak dikirimi lagi, dan penerima
// yang sebelumnya GAGAL dicoba ulang — jadi tombol ini sekaligus berfungsi sebagai "kirim ulang
// yang gagal".
export async function announceAgendaAction(id: string): Promise<ActionResult> {
  const g = await guard();
  if ("error" in g) return g.error;
  if (typeof id !== "string" || !id) return fail("Agenda tidak valid.");

  const { data: row, error } = await supabaseAdmin.from("Agenda").select("*").eq("id", id).maybeSingle();
  if (isMissingTable(error)) return fail(MISSING_TABLE);
  if (error) return fail("Gagal membaca agenda. Silakan coba lagi.");
  if (!row) return fail("Agenda tidak ditemukan.");

  const agenda = row as Agenda;
  if (agenda.status !== "PUBLISHED") return fail("Terbitkan agenda ini dulu sebelum mengirim notifikasi.");
  if (!canAnnounceAgenda(agenda)) return fail("Agenda ini sudah lewat, tidak perlu diumumkan.");

  let announced = agenda;
  if (!agenda.announcedAt) {
    // Penanda dipasang secara atomik (hanya kalau masih kosong): dua klik berdekatan tidak
    // menghasilkan dua pengumuman. Kalau kalah balapan, pengiriman tetap aman karena idempoten.
    // Snapshot ikut disimpan: itulah "keadaan yang diketahui anggota" untuk deteksi perubahan.
    const { data: marked, error: markError } = await supabaseAdmin
      .from("Agenda")
      .update({ announcedAt: new Date().toISOString(), notifiedSnapshot: takeSnapshot(agenda) })
      .eq("id", id)
      .is("announcedAt", null)
      .select("*")
      .maybeSingle();
    if (isMissingColumn(markError)) return fail(MISSING_COLUMN);
    if (markError) return fail("Gagal menandai agenda sebagai diumumkan. Silakan coba lagi.");
    if (marked) announced = marked as Agenda;
  }

  notifyAfter(announced, "CREATED");
  revalidateAgenda(announced.slug);
  return ok;
}

// Umumkan SEMUA agenda terbit yang belum diumumkan dan belum lewat, dalam satu kali jalan.
export async function announcePendingAgendaAction(): Promise<ActionResult & { count?: number }> {
  const g = await guard();
  if ("error" in g) return g.error;

  const { data, error } = await supabaseAdmin.from("Agenda").select("*").eq("status", "PUBLISHED").is("announcedAt", null).order("startAt", { ascending: true });
  if (isMissingTable(error)) return fail(MISSING_TABLE);
  if (isMissingColumn(error)) return fail(MISSING_COLUMN);
  if (error) return fail("Gagal membaca daftar agenda. Silakan coba lagi.");

  const pendingIds = ((data ?? []) as Agenda[]).filter((agenda) => canAnnounceAgenda(agenda)).map((agenda) => agenda.id);
  if (pendingIds.length === 0) return { ...ok, count: 0 };

  // Satu UPDATE per agenda (snapshot-nya berbeda-beda), masing-masing hanya kalau masih belum
  // ditandai: yang keburu ditandai proses lain tidak ikut dikirim dua kali.
  const now = new Date().toISOString();
  const results = await Promise.all(
    ((data ?? []) as Agenda[])
      .filter((agenda) => pendingIds.includes(agenda.id))
      .map((agenda) => supabaseAdmin.from("Agenda").update({ announcedAt: now, notifiedSnapshot: takeSnapshot(agenda) }).eq("id", agenda.id).is("announcedAt", null).select("*").maybeSingle()),
  );
  if (results.some((result) => result.error)) return fail("Gagal menandai sebagian agenda sebagai diumumkan. Silakan coba lagi.");

  const announced = results.map((result) => result.data as Agenda | null).filter((agenda): agenda is Agenda => !!agenda);
  notifyManyAfter(announced, "CREATED");
  revalidateAgenda();
  return { ...ok, count: announced.length };
}

// Kabarkan perubahan (judul/jadwal/tempat/tautan) pada agenda yang SUDAH diumumkan. Yang dikirim
// adalah selisih antara keadaan terakhir yang diberitahukan (snapshot) dan keadaan sekarang, jadi
// beberapa kali edit sebelumnya menjadi satu pembaruan.
export async function sendAgendaUpdateAction(id: string): Promise<ActionResult> {
  const g = await guard();
  if ("error" in g) return g.error;
  if (typeof id !== "string" || !id) return fail("Agenda tidak valid.");

  const { data: row, error } = await supabaseAdmin.from("Agenda").select("*").eq("id", id).maybeSingle();
  if (isMissingTable(error)) return fail(MISSING_TABLE);
  if (error) return fail("Gagal membaca agenda. Silakan coba lagi.");
  if (!row) return fail("Agenda tidak ditemukan.");

  const agenda = row as Agenda;
  if (!agenda.announcedAt) return fail("Agenda ini belum diumumkan. Kirim notifikasi pengumumannya dulu.");
  if (!canAnnounceAgenda(agenda)) return fail("Agenda ini sudah lewat atau belum terbit, tidak perlu diberitahukan.");
  if (!hasPendingChange(agenda)) return fail("Tidak ada perubahan yang perlu diberitahukan.");

  // Keadaan yang diketahui anggota sebelum ini; dibutuhkan untuk menyusun kotak "Yang berubah".
  const before = { ...agenda, ...agenda.notifiedSnapshot } as Agenda;

  // Majukan snapshot SECARA ATOMIK dan hanya kalau agenda tidak berubah lagi sejak dibaca (updatedAt
  // sama): dua klik berdekatan tidak mengirim dua pembaruan, dan edit yang menyelip di antaranya
  // tidak ikut "dianggap sudah dikabarkan" padahal belum.
  const { data: advanced, error: advanceError } = await supabaseAdmin
    .from("Agenda")
    .update({ notifiedSnapshot: takeSnapshot(agenda) })
    .eq("id", id)
    .eq("updatedAt", agenda.updatedAt ?? "")
    .select("*")
    .maybeSingle();
  if (isMissingColumn(advanceError)) return fail(MISSING_COLUMN);
  if (advanceError) return fail("Gagal menyimpan status pembaruan. Silakan coba lagi.");
  if (!advanced) return fail("Agenda baru saja diubah lagi atau pembaruannya sudah dikirim. Muat ulang halaman, lalu coba lagi.");

  notifyAfter(advanced as Agenda, "UPDATED", before);
  revalidateAgenda(agenda.slug);
  return ok;
}

export async function deleteAgendaAction(id: string): Promise<ActionResult> {
  const g = await guard();
  if ("error" in g) return g.error;
  if (typeof id !== "string" || !id) return fail("Agenda tidak valid.");

  const { data, error } = await supabaseAdmin.from("Agenda").delete().eq("id", id).select("slug").maybeSingle();

  if (isMissingTable(error)) return fail(MISSING_TABLE);
  if (error) return fail("Gagal menghapus agenda. Silakan coba lagi.");

  revalidateAgenda((data?.slug as string | undefined) ?? null);
  return ok;
}
