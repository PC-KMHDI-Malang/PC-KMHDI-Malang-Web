"use client";

import { useActionState } from "react";
import { updateNameAction } from "@/app/actions/profile";
import { User, Check, AlertCircle } from "lucide-react";

interface ProfileSettingsFormProps {
  initialName: string;
  email: string;
}

export function ProfileSettingsForm({ initialName, email }: ProfileSettingsFormProps) {
  const [state, formAction, isPending] = useActionState(updateNameAction, null);

  return (
    <form action={formAction} className="space-y-5">
      {state?.error && (
        <div className="p-4 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/50 text-rose-700 dark:text-rose-300 text-xs sm:text-sm font-semibold flex items-center gap-2.5 animate-in fade-in">
          <AlertCircle size={18} className="shrink-0 text-rose-600 dark:text-rose-400" />
          <span>{state.error}</span>
        </div>
      )}

      {state?.success && (
        <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900/50 text-emerald-700 dark:text-emerald-300 text-xs sm:text-sm font-semibold flex items-center gap-2.5 animate-in fade-in">
          <Check size={18} className="shrink-0 text-emerald-600 dark:text-emerald-400" />
          <span>Nama profil berhasil diperbarui!</span>
        </div>
      )}

      <div>
        <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">Email Akun</label>
        <input
          type="email"
          value={email}
          disabled
          className="w-full rounded-xl border border-slate-200 dark:border-white/10 bg-slate-100 dark:bg-white/5 px-4 py-3 text-sm text-slate-500 dark:text-neutral-400 font-medium cursor-not-allowed outline-none"
        />
        <p className="text-[11px] text-slate-400 mt-1">Email akun kader dikelola secara terpusat oleh administrator.</p>
      </div>

      <div>
        <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">Nama Lengkap</label>
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
            <User size={16} />
          </div>
          <input
            name="name"
            type="text"
            required
            defaultValue={initialName}
            placeholder="Masukkan nama lengkap Anda"
            className="w-full rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-[#161619] pl-10 pr-4 py-3 text-sm text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-neutral-500 outline-none focus:border-red-500 focus:ring-2 focus:ring-red-500/20 transition font-medium"
          />
        </div>
      </div>

      <div className="pt-2 flex justify-end">
        <button
          type="submit"
          disabled={isPending}
          className="rounded-xl bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 px-6 py-2.5 text-sm font-bold text-white shadow-md shadow-red-600/20 hover:shadow-lg transition-all active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed cursor-pointer flex items-center gap-2"
        >
          {isPending && <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />}
          {isPending ? "Menyimpan..." : "Simpan Perubahan"}
        </button>
      </div>
    </form>
  );
}
