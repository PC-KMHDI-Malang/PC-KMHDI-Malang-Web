"use server";

import { revalidatePath } from "next/cache";

import { requireTreasurer } from "@/lib/guard";
import { supabaseAdmin } from "@/lib/supabase";
import { isKasMember, isValidDate, isValidPeriod, parseRupiahInput, todayInJakarta, type KasTransaksiType } from "@/lib/kas";

// Satu-satunya jalur tulis untuk data kas. Server Action adalah endpoint HTTP publik (lihat
// catatan di lib/guard.ts), jadi SETIAP action di sini wajib lolos requireTreasurer() dulu —
// halaman anggota (/kas) sendiri memang tidak punya form apa pun, tapi itu bukan pengaman.

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
    const rows = periods.map((period) => ({ userId: input.userId, period, amount, paidAt, note }));

    const { error } = await supabaseAdmin.from("KasIuran").insert(rows);
    if (error) {
      // 23505 = unique_violation dari indeks KasIuran_user_period_key.
      if (error.code === "23505") return fail("Sebagian bulan yang dipilih sudah tercatat lunas. Muat ulang halaman lalu coba lagi.");
      return fail("Gagal menyimpan pembayaran iuran.");
    }

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
    const { error } = await supabaseAdmin.from("KasIuran").delete().eq("id", id);
    if (error) return fail("Gagal membatalkan catatan iuran.");

    revalidateKas();
    return ok;
  } catch {
    return fail("Terjadi kesalahan sistem.");
  }
}

export async function saveTransaksiAction(input: { id?: string; type: string; amount: string | number; date: string; description: string; category?: string }): Promise<ActionResult> {
  const denied = await guard();
  if (denied) return denied;

  try {
    if (input.type !== "MASUK" && input.type !== "KELUAR") return fail("Jenis transaksi tidak valid.");
    const type: KasTransaksiType = input.type;

    const amount = parseRupiahInput(input.amount);
    if (!amount) return fail("Nominal harus lebih dari 0.");
    if (!isValidDate(input.date)) return fail("Tanggal tidak valid.");

    const description = typeof input.description === "string" ? input.description.trim().slice(0, 200) : "";
    if (description.length < 3) return fail("Keterangan minimal 3 karakter.");

    const category = cleanNote(input.category)?.slice(0, 50) ?? null;
    const row = { type, amount, date: input.date, description, category };

    const { error } = input.id ? await supabaseAdmin.from("KasTransaksi").update(row).eq("id", input.id) : await supabaseAdmin.from("KasTransaksi").insert(row);
    if (error) return fail("Gagal menyimpan transaksi.");

    revalidateKas();
    return ok;
  } catch {
    return fail("Terjadi kesalahan sistem.");
  }
}

export async function deleteTransaksiAction(id: string): Promise<ActionResult> {
  const denied = await guard();
  if (denied) return denied;

  try {
    if (typeof id !== "string" || !id) return fail("Data tidak valid.");
    const { error } = await supabaseAdmin.from("KasTransaksi").delete().eq("id", id);
    if (error) return fail("Gagal menghapus transaksi.");

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
