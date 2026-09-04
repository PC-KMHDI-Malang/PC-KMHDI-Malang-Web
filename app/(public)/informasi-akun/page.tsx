import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, Search, Mail, KeyRound, LogIn, ShieldAlert, Users } from "lucide-react";
import { auth } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabase";
import { LoginGate } from "@/components/auth/LoginGate";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Informasi Akun Kader",
  description: "Daftar akun kader PC KMHDI Malang beserta email yang digunakan untuk masuk ke website.",
  // Halaman internal berisi daftar email kader — tidak boleh masuk hasil pencarian.
  robots: { index: false, follow: false },
};

interface KaderRow {
  id: string;
  name: string;
  email: string;
  jabatan: string | null;
  bidang: string | null;
}

interface InformasiAkunPageProps {
  searchParams: Promise<{ q?: string }>;
}

export default async function InformasiAkunPage({ searchParams: searchParamsPromise }: InformasiAkunPageProps) {
  const session = await auth();
  const isLoggedIn = !!session?.user?.id;

  // Kunci halaman: query baru dijalankan setelah sesi terverifikasi, sehingga pengunjung
  // yang belum login tidak pernah menerima satu pun email kader — termasuk di dalam HTML.
  let kader: KaderRow[] = [];
  let query = "";

  if (isLoggedIn) {
    const searchParams = await searchParamsPromise;
    query = searchParams?.q?.trim() || "";

    // Akun admin sengaja tidak ditampilkan: daftar ini disebar luas ke kader, dan
    // mengeksposnya berarti menunjukkan akun mana yang paling bernilai untuk disalahgunakan.
    let dbQuery = supabaseAdmin
      .from("User")
      .select("id, name, email, jabatan, bidang")
      .neq("role", "ADMIN")
      .order("name", { ascending: true });

    if (query) {
      dbQuery = dbQuery.or(`name.ilike.%${query}%,email.ilike.%${query}%`);
    }

    const { data } = await dbQuery;
    kader = data || [];
  }

  return (
    <div className="-mt-32 bg-slate-50/70 dark:bg-[#0a0a0c] transition-colors min-h-screen pb-20">
      {/* Header Banner Merah Khas KMHDI */}
      <div className="bg-gradient-to-br from-red-800 via-red-900 to-red-950 pt-44 pb-16 relative overflow-hidden">
        <div className="absolute left-0 top-0 h-48 w-48 rounded-full bg-red-500/20 blur-3xl pointer-events-none" />
        <div className="absolute right-0 bottom-0 h-64 w-64 rounded-full bg-rose-400/10 blur-3xl pointer-events-none" />

        <div className="relative mx-auto max-w-5xl px-5 sm:px-6 lg:px-8">
          <Link href="/" className="inline-flex items-center gap-2 text-sm font-semibold text-red-100/80 hover:text-white transition-colors mb-6">
            <ArrowLeft size={16} />
            Kembali ke Beranda
          </Link>

          {/* Dibungkus elemen blok: badge dan tautan kembali sama-sama inline-flex, jadi tanpa
              pembungkus ini keduanya mengalir di baris yang sama. */}
          <div>
            <span className="inline-flex rounded-full border border-white/20 bg-white/10 px-4 py-1.5 text-xs font-semibold text-red-100 backdrop-blur-xl mb-3">
              Khusus Kader
            </span>
            <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-white">Informasi Akun Kader</h1>
            <p className="text-red-100/80 text-sm sm:text-base mt-2 max-w-2xl">
              Cari namamu di daftar berikut untuk mengetahui email yang dipakai masuk ke website PC KMHDI Malang.
            </p>
          </div>
        </div>
      </div>

      <div className="relative z-10 mx-auto max-w-5xl px-5 sm:px-6 lg:px-8 -mt-8">
        {!isLoggedIn ? (
          <LoginGate
            title="Halaman ini khusus kader"
            description="Masuk terlebih dahulu untuk melihat daftar akun kader beserta email yang dipakai untuk login. Bila kamu belum memiliki akun, silakan hubungi pengurus."
          />
        ) : (
          <AccountDirectory kader={kader} query={query} />
        )}
      </div>
    </div>
  );
}

function AccountDirectory({ kader, query }: { kader: KaderRow[]; query: string }) {
  return (
    <>
      {/* Panduan Masuk */}
      <div className="rounded-3xl border border-slate-200 dark:border-white/10 bg-white dark:bg-[#141416] p-6 sm:p-7 shadow-xl shadow-slate-900/5">
        <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white mb-5">Cara Masuk ke Akunmu</h2>

        <ol className="grid gap-4 sm:grid-cols-3">
          <li className="flex gap-3">
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-red-50 dark:bg-red-950/40 text-red-600 dark:text-red-400">
              <Search size={16} />
            </span>
            <div>
              <p className="text-sm font-bold text-slate-900 dark:text-white">1. Cari namamu</p>
              <p className="text-xs text-slate-500 dark:text-neutral-400 mt-1 leading-relaxed">
                Gunakan kolom pencarian di bawah, lalu catat alamat emailmu.
              </p>
            </div>
          </li>

          <li className="flex gap-3">
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-red-50 dark:bg-red-950/40 text-red-600 dark:text-red-400">
              <LogIn size={16} />
            </span>
            <div>
              <p className="text-sm font-bold text-slate-900 dark:text-white">2. Masuk</p>
              <p className="text-xs text-slate-500 dark:text-neutral-400 mt-1 leading-relaxed">
                Login memakai email tersebut dan kata sandi awal yang dibagikan pengurus.
              </p>
            </div>
          </li>

          <li className="flex gap-3">
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-red-50 dark:bg-red-950/40 text-red-600 dark:text-red-400">
              <KeyRound size={16} />
            </span>
            <div>
              <p className="text-sm font-bold text-slate-900 dark:text-white">3. Ganti kata sandi</p>
              <p className="text-xs text-slate-500 dark:text-neutral-400 mt-1 leading-relaxed">
                Segera ubah kata sandi lewat menu{" "}
                <Link href="/profile" className="font-semibold text-red-600 dark:text-red-400 hover:underline">
                  Profil Akun
                </Link>
                .
              </p>
            </div>
          </li>
        </ol>

        {/* Kata sandi awal sama untuk semua akun, jadi akun belum aman sebelum diganti. */}
        <div className="mt-6 flex gap-3 rounded-2xl border border-amber-200 dark:border-amber-900/50 bg-amber-50 dark:bg-amber-950/25 p-4">
          <ShieldAlert size={18} className="shrink-0 text-amber-600 dark:text-amber-500 mt-0.5" />
          <p className="text-xs sm:text-[13px] text-amber-900 dark:text-amber-200/90 leading-relaxed">
            <span className="font-bold">Penting:</span> kata sandi awal dibagikan sama untuk semua kader, sehingga akunmu
            belum aman sampai kamu menggantinya. Lakukan langkah ke-3 segera setelah berhasil masuk.
          </p>
        </div>
      </div>

      {/* Pencarian */}
      <form method="GET" className="mt-8">
        <div className="relative">
          <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
          <input
            type="text"
            name="q"
            defaultValue={query}
            placeholder="Cari nama atau email…"
            aria-label="Cari nama atau email kader"
            className="w-full rounded-2xl border border-slate-200 dark:border-white/10 bg-white dark:bg-[#141416] py-3.5 pl-12 pr-28 text-sm text-slate-900 dark:text-white placeholder:text-slate-400 shadow-sm outline-none transition focus:border-red-500 focus:ring-2 focus:ring-red-500/20"
          />
          <button
            type="submit"
            className="absolute right-2 top-1/2 -translate-y-1/2 rounded-xl bg-red-600 px-4 py-2 text-xs font-bold text-white transition hover:bg-red-700"
          >
            Cari
          </button>
        </div>
      </form>

      {/* Jumlah hasil */}
      <div className="mt-6 flex items-center gap-2 text-sm text-slate-500 dark:text-neutral-400">
        <Users size={16} className="text-red-600 dark:text-red-400" />
        {query ? (
          <span>
            <span className="font-bold text-slate-900 dark:text-white">{kader.length}</span> akun cocok dengan &ldquo;
            {query}&rdquo;
          </span>
        ) : (
          <span>
            Total <span className="font-bold text-slate-900 dark:text-white">{kader.length}</span> akun terdaftar
          </span>
        )}
      </div>

      {kader.length === 0 ? (
        <div className="mt-4 rounded-3xl border border-dashed border-slate-300 dark:border-white/10 bg-white dark:bg-[#141416] py-16 text-center">
          <Search size={32} className="mx-auto text-slate-300 dark:text-neutral-700" />
          <p className="mt-4 font-bold text-slate-900 dark:text-white">Akun tidak ditemukan</p>
          <p className="mt-1 text-sm text-slate-500 dark:text-neutral-400">
            Coba kata kunci lain, atau hubungi pengurus bila namamu memang belum terdaftar.
          </p>
          {query && (
            <Link
              href="/informasi-akun"
              className="mt-5 inline-flex rounded-xl bg-red-600 px-5 py-2.5 text-xs font-bold text-white transition hover:bg-red-700"
            >
              Tampilkan Semua Akun
            </Link>
          )}
        </div>
      ) : (
        <>
          {/* Tampilan tabel — layar sedang ke atas */}
          <div className="mt-4 hidden overflow-hidden rounded-3xl border border-slate-200 dark:border-white/10 bg-white dark:bg-[#141416] shadow-sm md:block">
            <table className="w-full text-left">
              <thead className="border-b border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/5">
                <tr>
                  <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-neutral-400">Nama</th>
                  <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-neutral-400">Email untuk Login</th>
                  <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-neutral-400">Jabatan</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-white/5">
                {kader.map((item) => (
                  <tr key={item.id} className="transition hover:bg-slate-50 dark:hover:bg-white/5">
                    <td className="px-6 py-4">
                      <span className="text-sm font-bold text-slate-900 dark:text-white">{item.name}</span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center gap-2 text-sm text-slate-600 dark:text-neutral-300">
                        <Mail size={14} className="shrink-0 text-red-600 dark:text-red-400" />
                        <span className="break-all">{item.email}</span>
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      {item.jabatan ? (
                        <span className="text-sm text-slate-600 dark:text-neutral-300">{item.jabatan}</span>
                      ) : (
                        <span className="text-sm text-slate-400 dark:text-neutral-600">—</span>
                      )}
                      {item.bidang && (
                        <span className="block text-xs text-slate-400 dark:text-neutral-500 mt-0.5">{item.bidang}</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Tampilan kartu — mobile */}
          <div className="mt-4 space-y-3 md:hidden">
            {kader.map((item) => (
              <div
                key={item.id}
                className="rounded-2xl border border-slate-200 dark:border-white/10 bg-white dark:bg-[#141416] p-4 shadow-sm"
              >
                <p className="text-sm font-bold text-slate-900 dark:text-white">{item.name}</p>

                <p className="mt-2 flex items-start gap-2 text-sm text-slate-600 dark:text-neutral-300">
                  <Mail size={14} className="mt-0.5 shrink-0 text-red-600 dark:text-red-400" />
                  <span className="break-all">{item.email}</span>
                </p>

                {(item.jabatan || item.bidang) && (
                  <p className="mt-2 border-t border-slate-100 dark:border-white/5 pt-2 text-xs text-slate-500 dark:text-neutral-400">
                    {item.jabatan}
                    {item.jabatan && item.bidang ? " · " : ""}
                    {item.bidang}
                  </p>
                )}
              </div>
            ))}
          </div>
        </>
      )}
    </>
  );
}
