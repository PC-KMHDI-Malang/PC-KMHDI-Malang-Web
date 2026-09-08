import { supabaseAdmin } from "@/lib/supabase";

// Pembatas percobaan login (lihat migrasi 023).
//
// Tangganya sengaja longgar di awal: kader yang salah ketik dua-tiga kali tidak terhalang sama
// sekali. Rem baru terasa justru pada pola yang tidak manusiawi — puluhan percobaan beruntun.
// Jendela hitungannya juga pendek supaya penyerang tidak bisa memakai ini untuk mengunci akun
// pengurus dalam waktu lama; paling lama 15 menit, lalu hitungannya jatuh sendiri.
const WINDOW_MS = 15 * 60 * 1000;

const LOCK_STEPS: { afterFailures: number; lockMs: number }[] = [
  { afterFailures: 10, lockMs: 15 * 60 * 1000 },
  { afterFailures: 8, lockMs: 5 * 60 * 1000 },
  { afterFailures: 5, lockMs: 60 * 1000 },
];

export interface AttemptRecord {
  failedCount: number;
  firstFailedAt: string;
  lockedUntil: string | null;
}

export function lockDurationFor(failedCount: number): number | null {
  return LOCK_STEPS.find((step) => failedCount >= step.afterFailures)?.lockMs ?? null;
}

// ---------------------------------------------------------------------------
// Keputusan murni. Dipisahkan dari akses database supaya seluruh perilakunya —
// eskalasi, jendela yang jatuh sendiri, kunci yang kedaluwarsa — bisa diuji apa adanya.
// ---------------------------------------------------------------------------

/** Catatan percobaan berikutnya setelah satu kegagalan baru. */
export function nextAttemptState(existing: AttemptRecord | null, now: number): AttemptRecord {
  // Kegagalan lama tidak ikut dihitung: pengguna yang sempat salah minggu lalu memulai dari
  // nol lagi hari ini.
  const withinWindow = existing !== null && now - new Date(existing.firstFailedAt).getTime() < WINDOW_MS;
  const failedCount = withinWindow ? existing.failedCount + 1 : 1;
  const lockMs = lockDurationFor(failedCount);

  return {
    failedCount,
    firstFailedAt: withinWindow ? existing.firstFailedAt : new Date(now).toISOString(),
    lockedUntil: lockMs === null ? null : new Date(now + lockMs).toISOString(),
  };
}

export interface LockState {
  locked: boolean;
  retryAfterSeconds: number;
}

/** Terkunci selama ADA SATU saja catatan yang masih dalam masa kunci (email atau IP). */
export function lockStateOf(records: { lockedUntil: string | null }[], now: number): LockState {
  const longest = records.reduce((max, row) => {
    const until = row.lockedUntil ? new Date(row.lockedUntil).getTime() : 0;
    return until > max ? until : max;
  }, 0);

  if (longest <= now) return { locked: false, retryAfterSeconds: 0 };
  return { locked: true, retryAfterSeconds: Math.ceil((longest - now) / 1000) };
}

// ---------------------------------------------------------------------------
// Kunci penghitung
// ---------------------------------------------------------------------------

export function emailKey(email: string): string {
  return `email:${email.trim().toLowerCase()}`;
}

export function ipKey(ip: string): string {
  return `ip:${ip}`;
}

// Diambil dari header proxy; di Vercel x-forwarded-for selalu diisi. Kalau tidak ada sama
// sekali, pembatas per-IP dilewati dan pembatas per-email yang bekerja.
export function clientIpFrom(headers: Headers): string | null {
  const forwarded = headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0].trim() || null;
  return headers.get("x-real-ip");
}

// ---------------------------------------------------------------------------
// Akses database (tipis; keputusannya ada di fungsi murni di atas)
// ---------------------------------------------------------------------------

// Kegagalan membaca tabel (mis. migrasi 023 belum dijalankan) sengaja tidak memblokir login —
// kalau tidak, satu migrasi yang tertinggal akan mengunci semua orang keluar dari situsnya
// sendiri. Konsekuensinya: selama tabel ini belum ada, tidak ada pembatas sama sekali, dan
// peringatan di bawah muncul di log setiap percobaan login.
export async function checkLock(keys: string[]): Promise<LockState> {
  if (keys.length === 0) return { locked: false, retryAfterSeconds: 0 };

  const { data, error } = await supabaseAdmin.from("LoginAttempt").select("lockedUntil").in("identifier", keys);
  if (error) {
    console.error("Pembatas login tidak aktif — gagal membaca LoginAttempt:", error.message);
    return { locked: false, retryAfterSeconds: 0 };
  }

  return lockStateOf(data || [], Date.now());
}

export async function recordFailure(keys: string[]): Promise<void> {
  const now = Date.now();

  for (const identifier of keys) {
    try {
      const { data: existing } = await supabaseAdmin
        .from("LoginAttempt")
        .select("failedCount, firstFailedAt, lockedUntil")
        .eq("identifier", identifier)
        .maybeSingle();

      const next = nextAttemptState(existing ?? null, now);
      await supabaseAdmin.from("LoginAttempt").upsert({ identifier, ...next }, { onConflict: "identifier" });
    } catch (err) {
      console.error("Gagal mencatat percobaan login gagal:", err);
    }
  }
}

export async function clearAttempts(keys: string[]): Promise<void> {
  if (keys.length === 0) return;
  try {
    await supabaseAdmin.from("LoginAttempt").delete().in("identifier", keys);
  } catch (err) {
    console.error("Gagal membersihkan catatan percobaan login:", err);
  }
}
