"use server";

import { revalidatePath } from "next/cache";

import { auth } from "@/lib/auth";
import { requireTreasurer } from "@/lib/guard";
import { supabaseAdmin } from "@/lib/supabase";
import { isR2Configured } from "@/lib/r2";
import { createR2UploadUrl, deleteFromBucketByUrl, resolveStoredUrl, uploadToBucket } from "@/lib/storage";
import { KAS_PROOF_BUCKET, KAS_PROOF_TYPES, MAX_PROOF_MB, SERVER_UPLOAD_MAX_BYTES } from "@/lib/uploadLimits";
import { currentPeriod, isKasMember, isValidDate, isValidPeriod, parseRupiahInput, todayInJakarta } from "@/lib/kas";

// Satu-satunya jalur tulis untuk data kas. Server Action adalah endpoint HTTP publik (lihat
// catatan di lib/guard.ts), jadi SETIAP action di sini wajib memeriksa sesinya sendiri:
// - action bendahara (catat, ubah, konfirmasi, tolak, pengaturan) lewat guard() →
//   requireTreasurer();
// - action anggota (unggah bukti pembayaran) lewat requireKasMember(): hanya akun anggota kas
//   yang login, dan hanya untuk iuran miliknya sendiri. Anggota tidak pernah bisa menandai
//   iurannya LUNAS — buktinya selalu masuk sebagai MENUNGGU sampai dikonfirmasi bendahara.

type ActionResult = { success: boolean; error: string | null };

const ok: ActionResult = { success: true, error: null };
const fail = (error: string): ActionResult => ({ success: false, error });

function revalidateKas() {
  revalidatePath("/kas");
  revalidatePath("/kas/kelola");
}

async function guard(): Promise<ActionResult | null> {
  try {
    await requireTreasurer();
    return null;
  } catch {
    return fail("Hanya akun bendahara yang dapat mengelola uang kas.");
  }
}

async function assertKasMember(userId: unknown): Promise<string | null> {
  if (typeof userId !== "string" || !userId) return "Anggota tidak valid.";
  const { data: user } = await supabaseAdmin.from("User").select("email, role").eq("id", userId).maybeSingle();
  if (!user || !isKasMember(user)) return "Anggota tidak ditemukan.";
  return null;
}

function cleanNote(note: unknown): string | null {
  if (typeof note !== "string") return null;
  const trimmed = note.trim().slice(0, 200);
  return trimmed || null;
}

// Satu file bukti bisa dipakai beberapa bulan sekaligus (pembayaran rapel), jadi file baru
// dihapus dari storage kalau sudah tidak ada satu baris iuran pun yang memakainya.
async function removeUnusedProofs(urls: (string | null | undefined)[]) {
  for (const url of new Set(urls.filter((u): u is string => !!u))) {
    const { count } = await supabaseAdmin.from("KasIuran").select("id", { count: "exact", head: true }).eq("proofUrl", url);
    if ((count ?? 0) === 0) await deleteFromBucketByUrl(KAS_PROOF_BUCKET, url).catch(() => {});
  }
}

// Role & email dibaca ulang dari database (bukan dari sesi) supaya akun yang role-nya baru
// diubah admin langsung ikut aturan baru, tanpa menunggu sesinya kedaluwarsa.
async function requireKasMember(): Promise<{ userId: string } | { error: string }> {
  const session = await auth();
  if (!session?.user?.id) return { error: "Silakan login terlebih dahulu." };
  const { data: user } = await supabaseAdmin.from("User").select("id, email, role").eq("id", session.user.id).maybeSingle();
  if (!user || !isKasMember(user)) return { error: "Hanya akun anggota yang dapat mengunggah bukti iuran." };
  return { userId: user.id as string };
}

// ---------------------------------------------------------------------------------------------
// Log transaksi (tabel KasLog, migrasi 027) — ditampilkan di tab "Log Transaksi" bendahara.
// ---------------------------------------------------------------------------------------------

type LogAction = "DICATAT" | "DIKIRIM" | "DIKONFIRMASI" | "DITOLAK" | "DIUBAH" | "DIBATALKAN";
type LogEntry = { action: LogAction; userId: string; periods: string[]; amount: number; note?: string | null };

// Best-effort: kalau log gagal ditulis (mis. migrasi 027 belum dijalankan), aksi utamanya tetap
// dianggap berhasil — log adalah catatan tambahan, bukan bagian dari transaksi iurannya.
async function writeLog(entries: LogEntry[]) {
  if (entries.length === 0) return;
  try {
    await supabaseAdmin.from("KasLog").insert(entries.map((e) => ({ ...e, periods: [...e.periods].sort(), note: e.note ?? null })));
  } catch {
    // diabaikan, lihat catatan di atas
  }
}

// Satu entri log per anggota (konfirmasi/tolak bisa mencakup beberapa bulan sekaligus).
function logPerMember(action: LogAction, rows: { userId: string; period: string; amount: number }[], note?: string | null): LogEntry[] {
  const byUser = new Map<string, LogEntry>();
  for (const r of rows) {
    const entry = byUser.get(r.userId) ?? { action, userId: r.userId, periods: [], amount: 0, note };
    entry.periods.push(r.period);
    entry.amount += r.amount;
    byUser.set(r.userId, entry);
  }
  return [...byUser.values()];
}

function validateProofFile(contentType: unknown, size: unknown): string | null {
  if (typeof contentType !== "string" || !KAS_PROOF_TYPES.has(contentType)) return "Bukti harus berupa gambar JPG, PNG, atau WebP.";
  if (typeof size !== "number" || !Number.isFinite(size) || size <= 0) return "File tidak valid.";
  if (size > MAX_PROOF_MB * 1024 * 1024) return `Ukuran bukti maksimal ${MAX_PROOF_MB} MB.`;
  return null;
}

export async function recordIuranAction(input: { userId: string; periods: string[]; amount: string | number; paidAt: string; note?: string }): Promise<ActionResult> {
  const denied = await guard();
  if (denied) return denied;

  try {
    const memberError = await assertKasMember(input.userId);
    if (memberError) return fail(memberError);

    const periods = Array.from(new Set(Array.isArray(input.periods) ? input.periods : []));
    if (periods.length === 0) return fail("Pilih minimal satu bulan.");
    if (periods.length > 24) return fail("Maksimal 24 bulan dalam sekali pencatatan.");
    if (!periods.every(isValidPeriod)) return fail("Periode bulan tidak valid.");

    const amount = parseRupiahInput(input.amount);
    if (!amount) return fail("Nominal per bulan harus lebih dari 0.");

    const paidAt = input.paidAt || todayInJakarta();
    if (!isValidDate(paidAt)) return fail("Tanggal bayar tidak valid.");

    const note = cleanNote(input.note);
    const rows = periods.map((period) => ({ userId: input.userId, period, amount, paidAt, note, status: "LUNAS" }));

    // Bulan yang buktinya pernah DITOLAK masih punya baris (indeks unik userId+period), jadi
    // baris itu dibuang dulu sebelum bendahara mencatat pembayaran langsung untuk bulan tsb.
    const { data: rejected } = await supabaseAdmin.from("KasIuran").select("id, proofUrl").eq("userId", input.userId).eq("status", "DITOLAK").in("period", periods);
    if (rejected?.length) await supabaseAdmin.from("KasIuran").delete().in("id", rejected.map((r) => r.id));

    const { error } = await supabaseAdmin.from("KasIuran").insert(rows);
    if (error) {
      // 23505 = unique_violation dari indeks KasIuran_user_period_key.
      if (error.code === "23505") return fail("Sebagian bulan yang dipilih sudah tercatat lunas atau sedang menunggu konfirmasi. Muat ulang halaman lalu coba lagi.");
      return fail("Gagal menyimpan pembayaran iuran.");
    }

    await removeUnusedProofs((rejected ?? []).map((r) => r.proofUrl));
    await writeLog([{ action: "DICATAT", userId: input.userId, periods, amount: amount * periods.length, note }]);
    revalidateKas();
    return ok;
  } catch {
    return fail("Terjadi kesalahan sistem.");
  }
}

// Edit manual oleh bendahara: nominal, tanggal bayar, catatan, dan status satu catatan iuran.
// Status yang bisa dipilih hanya "Sudah Bayar" (LUNAS) atau "Menunggu Konfirmasi" (MENUNGGU,
// hanya kalau iuran itu punya bukti dari anggota). "Belum Bayar" = batalkan catatannya
// (deleteIuranAction), atau tolak buktinya lewat tab Konfirmasi.
export async function updateIuranAction(input: { id: string; amount: string | number; paidAt: string; note?: string; status: string }): Promise<ActionResult> {
  const denied = await guard();
  if (denied) return denied;

  try {
    if (typeof input.id !== "string" || !input.id) return fail("Data tidak valid.");
    if (input.status !== "LUNAS" && input.status !== "MENUNGGU") return fail("Status tidak valid.");

    const amount = parseRupiahInput(input.amount);
    if (!amount) return fail("Nominal harus lebih dari 0.");
    if (!isValidDate(input.paidAt)) return fail("Tanggal bayar tidak valid.");

    const { data: row } = await supabaseAdmin.from("KasIuran").select("userId, period, status, proofUrl").eq("id", input.id).maybeSingle();
    if (!row) return fail("Catatan iuran tidak ditemukan.");
    if (input.status === "MENUNGGU" && !row.proofUrl) return fail("Catatan tanpa bukti tidak bisa diberi status menunggu konfirmasi.");

    const statusChanged = row.status !== input.status;
    const { error } = await supabaseAdmin
      .from("KasIuran")
      .update({
        amount,
        paidAt: input.paidAt,
        note: cleanNote(input.note),
        status: input.status,
        ...(statusChanged ? { reviewedAt: input.status === "LUNAS" ? new Date().toISOString() : null, rejectReason: null } : {}),
      })
      .eq("id", input.id);
    if (error) return fail("Gagal menyimpan perubahan.");

    await writeLog([
      {
        action: "DIUBAH",
        userId: row.userId,
        periods: [row.period],
        amount,
        note: statusChanged ? `Status diubah menjadi ${input.status === "LUNAS" ? "Sudah Bayar" : "Menunggu Konfirmasi"}` : "Nominal/tanggal/catatan diubah",
      },
    ]);
    revalidateKas();
    return ok;
  } catch {
    return fail("Terjadi kesalahan sistem.");
  }
}

export async function deleteIuranAction(id: string): Promise<ActionResult> {
  const denied = await guard();
  if (denied) return denied;

  try {
    if (typeof id !== "string" || !id) return fail("Data tidak valid.");
    const { data: row } = await supabaseAdmin.from("KasIuran").select("userId, period, amount, proofUrl").eq("id", id).maybeSingle();
    const { error } = await supabaseAdmin.from("KasIuran").delete().eq("id", id);
    if (error) return fail("Gagal membatalkan catatan iuran.");

    await removeUnusedProofs([row?.proofUrl]);
    if (row) await writeLog([{ action: "DIBATALKAN", userId: row.userId, periods: [row.period], amount: row.amount }]);
    revalidateKas();
    return ok;
  } catch {
    return fail("Terjadi kesalahan sistem.");
  }
}

// ---------------------------------------------------------------------------------------------
// Bukti pembayaran dari anggota
// ---------------------------------------------------------------------------------------------

export type ProofUploadTarget = { mode: "direct"; uploadUrl: string; headers: Record<string, string>; fileUrl: string } | { mode: "server" } | { mode: "error"; error: string };

// Link upload sementara untuk bukti pembayaran — file dikirim browser langsung ke bucket R2
// privat (sama seperti upload panel admin, lihat lib/uploadClient.ts).
export async function createKasProofUploadUrlAction(input: { fileName: string; contentType: string; size: number }): Promise<ProofUploadTarget> {
  const member = await requireKasMember();
  if ("error" in member) return { mode: "error", error: member.error };
  const invalid = validateProofFile(input?.contentType, input?.size);
  if (invalid) return { mode: "error", error: invalid };
  if (!isR2Configured()) return { mode: "server" };
  return { mode: "direct", ...(await createR2UploadUrl(KAS_PROOF_BUCKET, String(input.fileName || ""), input.contentType, input.size)) };
}

// Jalur cadangan kalau upload langsung ke R2 tidak bisa dipakai (body request Vercel ≤ 4.5 MB).
export async function uploadKasProofAction(formData: FormData): Promise<{ url: string | null; error: string | null }> {
  const member = await requireKasMember();
  if ("error" in member) return { url: null, error: member.error };
  const file = formData.get("file");
  if (!(file instanceof File)) return { url: null, error: "File tidak valid." };
  const invalid = validateProofFile(file.type, file.size);
  if (invalid) return { url: null, error: invalid };
  if (file.size > SERVER_UPLOAD_MAX_BYTES) return { url: null, error: "File terlalu besar untuk diunggah lewat server." };
  try {
    return { url: await uploadToBucket(KAS_PROOF_BUCKET, file), error: null };
  } catch {
    return { url: null, error: "Gagal mengunggah bukti pembayaran." };
  }
}

// Nominal tidak diisi anggota — selalu nominal iuran per bulan dari Pengaturan bendahara
// (KasSetting.monthlyFee), supaya tidak ada bukti dengan nominal karangan sendiri.
export async function submitIuranProofAction(input: { periods: string[]; paidAt: string; note?: string; proofUrl: string }): Promise<ActionResult> {
  const member = await requireKasMember();
  if ("error" in member) return fail(member.error);

  try {
    const { data: setting } = await supabaseAdmin.from("KasSetting").select("startPeriod, monthlyFee").eq("id", 1).maybeSingle();
    if (!setting?.startPeriod || !setting.monthlyFee) return fail("Iuran belum diatur oleh bendahara.");

    const periods = Array.from(new Set(Array.isArray(input.periods) ? input.periods : [])).sort();
    if (periods.length === 0) return fail("Pilih minimal satu bulan.");
    if (periods.length > 24) return fail("Maksimal 24 bulan dalam sekali unggah.");
    if (!periods.every(isValidPeriod)) return fail("Periode bulan tidak valid.");
    const maxPeriod = `${Number(currentPeriod().slice(0, 4)) + 1}-12`;
    if (periods.some((p) => p < setting.startPeriod! || p > maxPeriod)) return fail("Ada bulan yang di luar masa berlaku iuran.");

    const amount = setting.monthlyFee as number;
    if (!isValidDate(input.paidAt) || input.paidAt > todayInJakarta()) return fail("Tanggal bayar tidak valid.");

    // Hanya file yang memang diunggah lewat createKasProofUploadUrlAction/uploadKasProofAction
    // (folder kas-proofs di storage privat) yang diterima sebagai bukti — bukan URL sembarang.
    const proof = typeof input.proofUrl === "string" ? resolveStoredUrl(KAS_PROOF_BUCKET, input.proofUrl) : null;
    if (!proof || proof.provider === "r2-public") return fail("Bukti pembayaran belum diunggah.");

    const { data: existing } = await supabaseAdmin.from("KasIuran").select("id, period, status, proofUrl").eq("userId", member.userId).in("period", periods);
    const blocked = (existing ?? []).filter((r) => r.status !== "DITOLAK");
    if (blocked.length) {
      const label = blocked.map((r) => r.period).join(", ");
      return fail(`Bulan ${label} sudah lunas atau sedang menunggu konfirmasi.`);
    }

    const now = new Date().toISOString();
    const note = cleanNote(input.note);
    const fields = { amount, paidAt: input.paidAt, note, status: "MENUNGGU", proofUrl: input.proofUrl, submittedAt: now, reviewedAt: null, rejectReason: null };
    const rejected = existing ?? [];
    const rejectedPeriods = new Set(rejected.map((r) => r.period));

    // Bulan yang buktinya pernah ditolak: baris lamanya dipakai ulang (indeks unik userId+period).
    if (rejected.length) {
      const { error } = await supabaseAdmin.from("KasIuran").update(fields).in("id", rejected.map((r) => r.id));
      if (error) return fail("Gagal mengirim bukti pembayaran.");
    }
    const fresh = periods.filter((p) => !rejectedPeriods.has(p)).map((period) => ({ userId: member.userId, period, ...fields }));
    if (fresh.length) {
      const { error } = await supabaseAdmin.from("KasIuran").insert(fresh);
      if (error) {
        if (error.code === "23505") return fail("Sebagian bulan sudah tercatat. Muat ulang halaman lalu coba lagi.");
        return fail("Gagal mengirim bukti pembayaran.");
      }
    }

    await removeUnusedProofs(rejected.map((r) => r.proofUrl));
    await writeLog([{ action: "DIKIRIM", userId: member.userId, periods, amount: amount * periods.length, note }]);
    revalidateKas();
    return ok;
  } catch {
    return fail("Terjadi kesalahan sistem.");
  }
}

// ---------------------------------------------------------------------------------------------
// Konfirmasi bendahara
// ---------------------------------------------------------------------------------------------

function cleanIds(ids: unknown): string[] {
  return Array.isArray(ids) ? Array.from(new Set(ids.filter((id): id is string => typeof id === "string" && !!id))).slice(0, 50) : [];
}

export async function confirmIuranAction(ids: string[]): Promise<ActionResult> {
  const denied = await guard();
  if (denied) return denied;

  try {
    const list = cleanIds(ids);
    if (list.length === 0) return fail("Data tidak valid.");
    // Hanya baris yang masih MENUNGGU yang diubah — klik ganda / data basi tidak mengubah apa pun.
    const { data: rows } = await supabaseAdmin.from("KasIuran").select("userId, period, amount").in("id", list).eq("status", "MENUNGGU");
    const { error } = await supabaseAdmin
      .from("KasIuran")
      .update({ status: "LUNAS", reviewedAt: new Date().toISOString(), rejectReason: null })
      .in("id", list)
      .eq("status", "MENUNGGU");
    if (error) return fail("Gagal mengonfirmasi pembayaran.");

    await writeLog(logPerMember("DIKONFIRMASI", rows ?? []));
    revalidateKas();
    return ok;
  } catch {
    return fail("Terjadi kesalahan sistem.");
  }
}

export async function rejectIuranAction(ids: string[], reason: string): Promise<ActionResult> {
  const denied = await guard();
  if (denied) return denied;

  try {
    const list = cleanIds(ids);
    if (list.length === 0) return fail("Data tidak valid.");
    const rejectReason = cleanNote(reason);
    if (!rejectReason || rejectReason.length < 3) return fail("Tuliskan alasan penolakan (minimal 3 karakter).");

    // Foto bukti yang ditolak tidak disimpan: tautannya dikosongkan di database dan filenya
    // dihapus dari storage. Alasan penolakan tetap tersimpan supaya anggota tahu kenapa ditolak.
    const { data: rows } = await supabaseAdmin.from("KasIuran").select("userId, period, amount, proofUrl").in("id", list).eq("status", "MENUNGGU");
    const { error } = await supabaseAdmin
      .from("KasIuran")
      .update({ status: "DITOLAK", reviewedAt: new Date().toISOString(), rejectReason, proofUrl: null })
      .in("id", list)
      .eq("status", "MENUNGGU");
    if (error) return fail("Gagal menolak pembayaran.");

    // Hanya terhapus kalau tidak ada baris lain yang masih memakai file yang sama.
    await removeUnusedProofs((rows ?? []).map((r) => r.proofUrl));
    await writeLog(logPerMember("DITOLAK", rows ?? [], rejectReason));
    revalidateKas();
    return ok;
  } catch {
    return fail("Terjadi kesalahan sistem.");
  }
}

export async function updateKasSettingAction(input: { monthlyFee: string | number; startPeriod: string }): Promise<ActionResult> {
  const denied = await guard();
  if (denied) return denied;

  try {
    const monthlyFee = parseRupiahInput(input.monthlyFee);
    if (!monthlyFee) return fail("Nominal iuran bulanan harus lebih dari 0.");
    if (!isValidPeriod(input.startPeriod)) return fail("Bulan mulai iuran tidak valid.");

    const { error } = await supabaseAdmin.from("KasSetting").upsert({ id: 1, monthlyFee, startPeriod: input.startPeriod, updatedAt: new Date().toISOString() });
    if (error) return fail("Gagal menyimpan pengaturan kas.");

    revalidateKas();
    return ok;
  } catch {
    return fail("Terjadi kesalahan sistem.");
  }
}
