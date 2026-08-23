import Link from "next/link";
import { auth } from "@/lib/auth";
import { logoutAction } from "@/app/actions/auth";
import {
  LayoutDashboard,
  BookOpen,
  KeyRound,
  LogOut
} from "lucide-react";
import { SubmitWithConfirm } from "@/components/ui/SubmitWithConfirm";

export default async function UserSidebar() {
  const session = await auth();

  return (
    <aside className="w-64 bg-white text-slate-600 border-r border-slate-200 h-screen fixed inset-y-0 left-0 flex flex-col shadow-xl z-20">
      <div className="p-6 border-b border-slate-100 flex items-center gap-4">
        <div className="w-12 h-12 rounded-xl bg-slate-50 flex items-center justify-center p-1.5 shadow-sm border border-slate-100">
          <img src="/image/Logo.png" alt="Logo KMHDI" className="w-full h-full object-contain" />
        </div>
        <div className="flex flex-col">
          <h2 className="text-lg font-bold text-slate-800 tracking-wide leading-tight">
            User Panel
          </h2>
          <p className="text-[10px] text-slate-500 mt-0.5 font-bold tracking-[0.2em] uppercase">KMHDI Malang</p>
        </div>
      </div>

      <nav className="flex-1 p-4 space-y-1">
        <Link
          href="/dashboard"
          className="flex items-center gap-3 px-4 py-3 text-slate-600 hover:text-red-600 hover:bg-red-50 hover:shadow-[inset_4px_0_0_0_rgba(220,38,38,1)] rounded-xl transition-all duration-300 group font-medium"
        >
          <LayoutDashboard className="w-5 h-5 group-hover:scale-110 transition-transform" />
          <span className="font-medium">Beranda</span>
        </Link>

        <Link
          href="/dashboard/ebooks"
          className="flex items-center gap-3 px-4 py-3 text-slate-600 hover:text-red-600 hover:bg-red-50 hover:shadow-[inset_4px_0_0_0_rgba(220,38,38,1)] rounded-xl transition-all duration-300 group font-medium"
        >
          <BookOpen className="w-5 h-5 group-hover:scale-110 transition-transform" />
          <span className="font-medium">Baca Ebook</span>
        </Link>

        <Link
          href="/dashboard/profile"
          className="flex items-center gap-3 px-4 py-3 text-slate-600 hover:text-red-600 hover:bg-red-50 hover:shadow-[inset_4px_0_0_0_rgba(220,38,38,1)] rounded-xl transition-all duration-300 group font-medium"
        >
          <KeyRound className="w-5 h-5 group-hover:scale-110 transition-transform" />
          <span className="font-medium">Ganti Password</span>
        </Link>
      </nav>

      <div className="p-4 border-t border-slate-100">
        <SubmitWithConfirm
          action={logoutAction}
          modalTitle="Keluar dari Aplikasi?"
          modalDesc="Sesi Anda akan diakhiri dan Anda harus login kembali untuk masuk ke dashboard."
          confirmText="Ya, Logout"
          buttonElement={
            <div className="flex items-center gap-3 px-4 py-3 w-full text-slate-500 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all duration-300 font-medium">
              <LogOut className="w-5 h-5" />
              <span className="font-medium">Logout</span>
            </div>
          }
        />
      </div>
    </aside>
  );
}
