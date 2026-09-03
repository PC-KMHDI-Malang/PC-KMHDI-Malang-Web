import Link from "next/link";
import { auth } from "@/lib/auth";
import { logoutAction } from "@/app/actions/auth";
import { LogOut, ArrowLeft } from "lucide-react";
import { SubmitWithConfirm } from "@/components/ui/SubmitWithConfirm";
import { ThemeToggle } from "@/components/ui/ThemeToggle";
import { UserSidebarNav } from "./UserSidebarNav";

export default async function UserSidebar() {
  const session = await auth();

  return (
    <aside className="w-64 bg-white dark:bg-[#0a0a0a] text-slate-600 dark:text-slate-400 border-r border-slate-200 dark:border-white/5 h-screen fixed inset-y-0 left-0 flex flex-col shadow-xl z-20 transition-colors">
      <div className="p-6 border-b border-slate-100 dark:border-white/5 flex items-center gap-4">
        <div className="w-12 h-12 rounded-xl bg-slate-50 dark:bg-white/5 flex items-center justify-center p-1.5 shadow-sm border border-slate-100 dark:border-white/5">
          <img src="/image/Logo.webp" alt="Logo KMHDI" className="w-full h-full object-contain" />
        </div>
        <div className="flex flex-col">
          <h2 className="text-lg font-bold text-slate-800 dark:text-white tracking-wide leading-tight">Dasbor User</h2>
          <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5 font-bold tracking-[0.2em] uppercase">KMHDI Malang</p>
        </div>
      </div>

      <UserSidebarNav />

      <div className="p-4 border-t border-slate-100 dark:border-white/5 mt-auto flex flex-col gap-1.5">
        <ThemeToggle />

        <Link
          href="/"
          className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-slate-50 dark:bg-[#111111] hover:bg-slate-100 dark:hover:bg-black text-slate-700 dark:text-white rounded-2xl transition-colors border border-slate-100 dark:border-white/5"
        >
          <ArrowLeft size={16} />
          <span className="font-bold text-sm tracking-wide">Kembali ke Website</span>
        </Link>

        <SubmitWithConfirm
          wrapperClassName="w-full"
          action={logoutAction}
          modalTitle="Keluar dari Aplikasi?"
          modalDesc="Sesi Anda akan diakhiri dan Anda harus login kembali untuk masuk ke dashboard."
          confirmText="Ya, Logout"
          buttonElement={
            <div className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-slate-50 dark:bg-[#111111] hover:bg-red-600 dark:hover:bg-rose-600 text-slate-700 hover:text-white dark:text-white rounded-2xl transition-colors border border-slate-100 dark:border-white/5">
              <LogOut size={16} />
              <span className="font-bold text-sm tracking-wide">Logout</span>
            </div>
          }
        />
      </div>
    </aside>
  );
}
