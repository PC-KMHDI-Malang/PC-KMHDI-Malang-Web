"use client";

import { useActionState, useEffect, useRef } from "react";
import { updatePasswordAction } from "@/app/actions/profile";

export function UpdatePasswordForm() {
  const [state, formAction, isPending] = useActionState(updatePasswordAction, null);
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state?.success) {
      formRef.current?.reset();
    }
  }, [state]);

  return (
    <form ref={formRef} action={formAction} className="space-y-6">
      {state?.error && (
        <div className="p-4 rounded-xl bg-red-50 dark:bg-rose-950/50 border border-red-100 dark:border-rose-900/50 text-red-600 dark:text-rose-400 text-sm font-bold flex items-center gap-3">
          <svg className="w-5 h-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path></svg>
          {state.error}
        </div>
      )}
      {state?.success && (
        <div className="p-4 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-100 dark:border-emerald-900/50 text-emerald-600 dark:text-emerald-400 text-sm font-bold flex items-center gap-3">
          <svg className="w-5 h-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
          Password berhasil diperbarui!
        </div>
      )}
      
      <div>
        <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1.5">Password Saat Ini</label>
        <input 
          type="password" 
          name="currentPassword" 
          required 
          className="w-full bg-slate-50 dark:bg-[#111111] dark:text-white border border-slate-200 dark:border-white/5 focus:border-slate-800 dark:focus:border-slate-500 focus:ring-4 focus:ring-slate-800/10 dark:focus:ring-slate-500/20 rounded-xl p-3 outline-none transition-all font-medium" 
        />
      </div>
      <div>
        <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1.5">Password Baru (Min. 6 Karakter)</label>
        <input 
          type="password" 
          name="newPassword" 
          required 
          minLength={6}
          className="w-full bg-slate-50 dark:bg-[#111111] dark:text-white border border-slate-200 dark:border-white/5 focus:border-red-500 dark:focus:border-rose-500 focus:ring-4 focus:ring-red-500/10 dark:focus:ring-rose-500/20 rounded-xl p-3 outline-none transition-all font-medium" 
        />
      </div>
      <div className="pt-4 flex justify-end">
        <button 
          type="submit" 
          disabled={isPending}
          className={`bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-bold px-8 py-3 rounded-xl transition-all duration-300 shadow-sm flex items-center gap-2 ${
            isPending ? 'opacity-70 cursor-not-allowed' : 'hover:bg-black dark:hover:bg-slate-200 hover:shadow-lg hover:shadow-slate-900/30 dark:hover:shadow-white/20'
          }`}
        >
          {isPending && <span className="w-4 h-4 border-2 border-white/30 dark:border-slate-900/30 border-t-white dark:border-t-slate-900 rounded-full animate-spin"></span>}
          {isPending ? "Menyimpan..." : "Perbarui Password"}
        </button>
      </div>
    </form>
  );
}
