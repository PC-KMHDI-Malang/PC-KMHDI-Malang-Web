import { auth } from "@/lib/auth";
import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowLeft, KeyRound, UserCheck, Shield } from "lucide-react";
import { ProfileSettingsForm } from "@/components/profile/ProfileSettingsForm";
import { UpdatePasswordForm } from "@/components/admin/UpdatePasswordForm";

export const metadata = {
  title: "Atur Profil & Sandi | PC KMHDI Malang",
  description: "Kelola informasi akun dan kata sandi akun kader PC KMHDI Malang.",
};

export default async function ProfilePage() {
  const session = await auth();

  if (!session?.user?.id) {
    redirect("/login");
  }

  const userInitial = session.user.name?.[0]?.toUpperCase() || "U";
  const isAdmin = session.user.role === "ADMIN";

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

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <span className="inline-flex rounded-full border border-white/20 bg-white/10 px-4 py-1.5 text-xs font-semibold text-red-100 backdrop-blur-xl mb-3">Akun Kader</span>
              <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-white">Profil &amp; Pengaturan Akun</h1>
              <p className="text-red-100/80 text-sm sm:text-base mt-2 max-w-xl">Kelola nama profil dan perbarui kata sandi akun Anda secara aman.</p>
            </div>

            {isAdmin && (
              <Link href="/admin" className="self-start sm:self-auto inline-flex items-center gap-2 bg-white text-red-900 px-5 py-2.5 rounded-2xl text-xs sm:text-sm font-bold shadow-lg hover:bg-neutral-100 transition hover:scale-105">
                <Shield size={16} />
                Buka Panel Admin
              </Link>
            )}
          </div>
        </div>
      </div>

      {/* Konten Utama: 2 Kolom Bersih Tanpa Sidebar Dashboard */}
      <div className="relative z-10 mx-auto max-w-5xl px-5 sm:px-6 lg:px-8 -mt-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Kolom Kiri: Kartu Identitas & Edit Nama (5/12) */}
          <div className="lg:col-span-5 space-y-6">
            {/* Kartu Ringkasan Akun */}
            <div className="rounded-3xl border border-slate-200/80 dark:border-white/10 bg-white dark:bg-[#121215] p-6 sm:p-8 shadow-xl">
              <div className="flex flex-col items-center text-center pb-6 border-b border-slate-100 dark:border-white/10">
                <div className="w-20 h-20 rounded-full bg-gradient-to-tr from-red-600 via-rose-600 to-red-500 text-white flex items-center justify-center text-2xl font-black shadow-lg shadow-red-600/30 mb-4 ring-4 ring-red-50 dark:ring-red-950/30">
                  {userInitial}
                </div>
                <h2 className="text-lg sm:text-xl font-extrabold text-slate-900 dark:text-white leading-tight">{session.user.name || "Kader KMHDI"}</h2>
                <p className="text-xs text-slate-500 dark:text-neutral-400 mt-1">{session.user.email}</p>
                <span
                  className={`inline-block text-[10px] font-bold px-3 py-1 rounded-full mt-3 tracking-widest uppercase border ${
                    isAdmin ? "bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/30" : "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/30"
                  }`}
                >
                  {isAdmin ? "ADMINISTRATOR" : "KADER / ANGGOTA"}
                </span>
              </div>

              {/* Form Ubah Nama */}
              <div className="pt-6">
                <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
                  <UserCheck size={16} className="text-red-600" />
                  Ubah Nama Profil
                </h3>
                <ProfileSettingsForm initialName={session.user.name || ""} email={session.user.email || ""} />
              </div>
            </div>
          </div>

          {/* Kolom Kanan: Kartu Ganti Password (7/12) */}
          <div className="lg:col-span-7">
            <div className="rounded-3xl border border-slate-200/80 dark:border-white/10 bg-white dark:bg-[#121215] p-6 sm:p-8 shadow-xl h-full">
              <div className="flex items-center gap-3 pb-6 mb-6 border-b border-slate-100 dark:border-white/10">
                <div className="w-10 h-10 rounded-2xl bg-red-50 dark:bg-red-950/40 border border-red-100 dark:border-red-900/40 flex items-center justify-center text-red-600 dark:text-red-400 shadow-sm">
                  <KeyRound size={20} />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-900 dark:text-white leading-tight">Ganti Kata Sandi</h3>
                  <p className="text-xs text-slate-500 dark:text-neutral-400 mt-0.5">Pastikan kata sandi baru Anda kuat dan minimal terdiri dari 6 karakter.</p>
                </div>
              </div>

              <UpdatePasswordForm />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
