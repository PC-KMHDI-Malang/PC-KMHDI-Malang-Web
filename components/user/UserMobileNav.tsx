"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { Menu, X, ArrowLeft, LogOut } from "lucide-react";
import { UserSidebarNav } from "./UserSidebarNav";
import { SubmitWithConfirm } from "@/components/ui/SubmitWithConfirm";
import { logoutAction } from "@/app/actions/auth";

export function UserMobileNav() {
  const [isOpen, setIsOpen] = useState(false);

  // Lock background scroll when drawer is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isOpen]);

  return (
    <div className="md:hidden">
      {/* 1. Sticky Mobile Header Bar */}
      <header className="sticky top-0 z-30 flex items-center justify-between px-4 py-3 bg-white/95 dark:bg-[#0a0a0a]/95 backdrop-blur-md border-b border-slate-200 dark:border-white/10 shadow-sm transition-colors">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-slate-50 dark:bg-white/5 flex items-center justify-center p-1 border border-slate-200 dark:border-white/10 flex-shrink-0">
            <Image src="/image/Logo.webp" alt="Logo KMHDI" width={28} height={28} unoptimized priority className="w-full h-full object-contain" />
          </div>
          <div>
            <h1 className="text-sm font-bold text-slate-800 dark:text-white leading-tight">Dasbor Anggota</h1>
            <p className="text-[10px] text-slate-500 dark:text-slate-400 font-bold tracking-wider uppercase">KMHDI Malang</p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          aria-label={isOpen ? "Tutup menu" : "Buka menu"}
          className="w-9 h-9 flex items-center justify-center rounded-xl bg-slate-100 dark:bg-white/10 text-slate-700 dark:text-white hover:bg-slate-200 dark:hover:bg-white/20 active:scale-95 transition border border-slate-200 dark:border-white/10"
        >
          {isOpen ? <X size={20} /> : <Menu size={20} />}
        </button>
      </header>

      {/* 2. Slide-over Mobile Drawer */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex animate-in fade-in duration-200">
          {/* Backdrop overlay */}
          <div className="fixed inset-0 bg-black/60 backdrop-blur-xs" onClick={() => setIsOpen(false)} />

          {/* Drawer content */}
          <div className="relative w-72 max-w-[85vw] h-full bg-white dark:bg-[#0a0a0a] text-slate-600 dark:text-slate-400 shadow-2xl z-10 flex flex-col justify-between border-r border-slate-200 dark:border-white/10 animate-in slide-in-from-left duration-300">
            <div>
              {/* Drawer Header */}
              <div className="p-5 border-b border-slate-100 dark:border-white/5 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-slate-50 dark:bg-white/5 flex items-center justify-center p-1 border border-slate-100 dark:border-white/5 flex-shrink-0">
                    <Image src="/image/Logo.webp" alt="Logo KMHDI" width={32} height={32} unoptimized priority className="w-full h-full object-contain" />
                  </div>
                  <div>
                    <h2 className="text-base font-bold text-slate-800 dark:text-white leading-tight">Dasbor Anggota</h2>
                    <p className="text-[10px] text-slate-500 dark:text-slate-400 font-bold tracking-widest uppercase">KMHDI Malang</p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  className="w-8 h-8 rounded-xl bg-slate-100 dark:bg-white/5 text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white flex items-center justify-center transition"
                >
                  <X size={18} />
                </button>
              </div>

              {/* Navigation Links */}
              <div className="py-2 overflow-y-auto max-h-[calc(100vh-250px)]" onClick={() => setIsOpen(false)}>
                <UserSidebarNav />
              </div>
            </div>

            {/* Drawer Footer Actions */}
            <div className="p-4 border-t border-slate-100 dark:border-white/5 flex flex-col gap-2 mt-auto">
              <Link
                href="/"
                onClick={() => setIsOpen(false)}
                className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-slate-50 dark:bg-[#111111] hover:bg-slate-100 dark:hover:bg-black text-slate-700 dark:text-white rounded-xl transition-colors border border-slate-200 dark:border-white/5 font-semibold text-xs"
              >
                <ArrowLeft size={15} />
                <span>Kembali ke Website</span>
              </Link>

              <SubmitWithConfirm
                wrapperClassName="w-full"
                action={logoutAction}
                modalTitle="Keluar dari Aplikasi?"
                modalDesc="Sesi Anda akan diakhiri dan Anda harus login kembali untuk masuk ke dashboard."
                confirmText="Ya, Logout"
                buttonElement={
                  <div className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-red-50 dark:bg-rose-950/30 hover:bg-red-600 dark:hover:bg-rose-600 text-red-600 hover:text-white dark:text-rose-400 dark:hover:text-white rounded-xl transition-colors border border-red-100 dark:border-rose-900/30 font-semibold text-xs cursor-pointer">
                    <LogOut size={15} />
                    <span>Logout</span>
                  </div>
                }
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
