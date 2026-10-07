"use server";

import { revalidatePath } from "next/cache";
import { after } from "next/server";

import { requireSecretary } from "@/lib/guard";
import { supabaseAdmin } from "@/lib/supabase";
import { parseAgendaInput, slugifyAgenda, type Agenda, type AgendaInput } from "@/lib/agenda";
import { decideUpdateNotification, type NotifyReason } from "@/lib/notify/content";
import { dispatchAgendaNotification } from "@/lib/notify/dispatch";

// Satu-satunya jalur tulis untuk data agenda. Server Action adalah endpoint HTTP publik (lihat
// catatan di lib/guard.ts), jadi SETIAP action di sini wajib memeriksa sesinya sendiri lewat
// guard() → requireSecretary(). Input form dianggap tidak tepercaya dan selalu diparse ulang di
// server (parseAgendaInput), bukan mengandalkan validasi di komponen klien.

type ActionResult = { success: boolean; error: string | null };

const ok: ActionResult = { success: true, error: null };
const fail = (error: string): ActionResult => ({ success: false, error });

function revalidateAgenda(slug?: string | null) {
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

// Kolom sendNotification baru ada setelah migrasi 038.
function isMissingColumn(error: { code?: string } | null): boolean {
  return error?.code === "42703";
}

const MISSING_COLUMN = "Kolom notifikasi belum ada. Jalankan migrasi 038_add_send_notification_to_agenda.sql di Supabase terlebih dahulu.";

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
      if (created.status === "PUBLISHED" && created.sendNotification) notifyAfter(created, "CREATED");
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

  // Kondisi sebelum diubah, untuk menentukan apakah perubahannya layak diberitahukan ke anggota.
  const { data: before, error: beforeError } = await supabaseAdmin.from("Agenda").select("*").eq("id", id).maybeSingle();
  if (isMissingTable(beforeError)) return fail(MISSING_TABLE);
  if (beforeError) return fail("Gagal membaca agenda. Silakan coba lagi.");
  if (!before) return fail("Agenda tidak ditemukan.");

  // Slug sengaja tidak diubah: tautan yang sudah dibagikan tidak boleh putus gara-gara judul diedit.
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

  const updated = data as Agenda;
  revalidateAgenda(updated.slug);
  // Keputusannya di decideUpdateNotification (teruji): tidak ada kalau agenda masih draft atau
  // notifikasinya mati; pengumuman pertama kalau notifikasi baru dinyalakan; "diperbarui" kalau
  // jadwal/tempat/judul berubah. Koreksi kecil (mis. typo deskripsi) tidak membanjiri anggota.
  const next = decideUpdateNotification(before as Agenda, updated);
  if (next) notifyAfter(updated, next, before as Agenda);
  return ok;
}

// Terbitkan draft, atau tarik kembali agenda yang sudah terbit menjadi draft.
export async function setAgendaPublishedAction(id: string, published: boolean): Promise<ActionResult> {
  const g = await guard();
  if ("error" in g) return g.error;
  if (typeof id !== "string" || !id) return fail("Agenda tidak valid.");

  const { data, error } = await supabaseAdmin
    .from("Agenda")
    .update({ status: published ? "PUBLISHED" : "DRAFT", updatedAt: new Date().toISOString() })
    .eq("id", id)
    .select("*")
    .maybeSingle();

  if (isMissingTable(error)) return fail(MISSING_TABLE);
  if (error) return fail("Gagal mengubah status agenda. Silakan coba lagi.");
  if (!data) return fail("Agenda tidak ditemukan.");

  const row = data as Agenda;
  revalidateAgenda(row.slug);
  // Menerbitkan draft = pengumuman agenda baru (kalau notifikasinya dinyalakan). Menarik kembali menjadi draft tidak memberi tahu
  // siapa pun. Menerbitkan ulang agenda yang sudah pernah diumumkan tidak mengirim dobel:
  // kunci "CREATED" di NotificationDelivery sudah terpakai.
  if (published && row.sendNotification) notifyAfter(row, "CREATED");
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
