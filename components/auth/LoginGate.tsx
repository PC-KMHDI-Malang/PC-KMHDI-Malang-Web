"use client";

import { useState } from "react";
import { LockKeyhole, LogIn } from "lucide-react";
import { LoginModal } from "./LoginModal";

interface LoginGateProps {
  title: string;
  description: string;
}

/**
 * Gerbang login untuk halaman terkunci.
 *
 * Pengunjung tidak dipindahkan ke /login. Popup baru terbuka setelah tombol "Masuk ke Akun"
 * ditekan, bukan otomatis saat halaman dibuka. Setelah login berhasil, LoginModal memanggil
 * router.refresh() sehingga server component dirender ulang dan isi halaman langsung muncul
 * tanpa perlu berpindah halaman.
 */
export function LoginGate({ title, description }: LoginGateProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <div className="rounded-3xl border border-slate-200 dark:border-white/10 bg-white dark:bg-[#141416] px-6 py-14 text-center shadow-xl shadow-slate-900/5">
        <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-red-50 dark:bg-red-950/40 text-red-600 dark:text-red-400">
          <LockKeyhole size={24} />
        </span>

        <h2 className="mt-5 text-lg font-bold text-slate-900 dark:text-white">{title}</h2>
        <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-slate-500 dark:text-neutral-400">{description}</p>

        <button
          type="button"
          onClick={() => setIsOpen(true)}
          className="mt-6 inline-flex items-center gap-2 rounded-2xl bg-red-600 px-6 py-3 text-sm font-bold text-white shadow-lg shadow-red-600/20 transition hover:bg-red-700 hover:shadow-red-600/30"
        >
          <LogIn size={16} />
          Masuk ke Akun
        </button>
      </div>

      <LoginModal isOpen={isOpen} onClose={() => setIsOpen(false)} />
    </>
  );
}
