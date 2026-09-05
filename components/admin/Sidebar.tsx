import Link from "next/link";
import Image from "next/image";
import { auth } from "@/lib/auth";
import { logoutAction } from "@/app/actions/auth";
import { LogOut, ArrowLeft } from "lucide-react";
import { SubmitWithConfirm } from "@/components/ui/SubmitWithConfirm";
import { SidebarNav } from "./SidebarNav";
import { AdminMobileNav } from "./AdminMobileNav";
import { ThemeToggle } from "@/components/ui/ThemeToggle";

export default async function Sidebar() {
  const session = await auth();
  const role = session?.user?.role || "USER";

  return (
    <>
      <AdminMobileNav role={role} />

      <aside className="hidden md:flex w-64 bg-white dark:bg-[#0a0a0c] text-slate-600 dark:text-slate-400 border-r border-slate-200 dark:border-white/10 h-screen fixed inset-y-0 left-0 flex-col shadow-xl z-20 transition-colors">
        <div className="p-6 border-b border-slate-100 dark:border-white/10 flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-slate-50 dark:bg-white/5 flex items-center justify-center p-1.5 shadow-sm border border-slate-100 dark:border-white/10">
            <Image src="/image/Logo.webp" alt="Logo KMHDI" width={40} height={40} priority className="w-full h-full object-contain" />
          </div>
          <div className="flex flex-col">
            <h2 className="text-lg font-bold text-slate-800 dark:text-white tracking-wide leading-tight">Admin Panel</h2>
            <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5 font-bold tracking-[0.2em] uppercase">KMHDI Malang</p>
          </div>
        </div>

        <SidebarNav role={role} />

        <div className="p-4 border-t border-slate-100 dark:border-white/10 mt-auto flex flex-col gap-2">
          {/* Sakelar Mode Gelap / Terang Admin */}
          <ThemeToggle />

          <Link
            href="/"
            className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-slate-50 dark:bg-[#141417] hover:bg-slate-100 dark:hover:bg-white/10 text-slate-700 dark:text-white rounded-2xl transition-colors border border-slate-200 dark:border-white/10 text-xs font-bold"
          >
            <ArrowLeft size={16} />
            <span>Kembali ke Website</span>
          </Link>

          <SubmitWithConfirm
            wrapperClassName="w-full"
            action={logoutAction}
            modalTitle="Keluar dari Aplikasi?"
            modalDesc="Sesi Anda akan diakhiri dan Anda akan diarahkan kembali ke beranda."
            confirmText="Ya, Logout"
            buttonElement={
              <div className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-rose-50 dark:bg-rose-950/30 hover:bg-rose-600 dark:hover:bg-rose-600 text-rose-600 hover:text-white dark:text-rose-400 dark:hover:text-white rounded-2xl transition-colors border border-rose-100 dark:border-rose-900/30 text-xs font-bold cursor-pointer">
                <LogOut size={16} />
                <span>Logout</span>
              </div>
            }
          />
        </div>
      </aside>
    </>
  );
}
