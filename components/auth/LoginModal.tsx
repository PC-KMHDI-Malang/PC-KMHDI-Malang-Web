"use client";

import { useState, useTransition } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { X, Eye, EyeOff, Lock, Mail, AlertCircle } from "lucide-react";
import { signIn } from "next-auth/react";

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function LoginModal({ isOpen, onClose }: LoginModalProps) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const [showPassword, setShowPassword] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    const formData = new FormData(e.currentTarget);
    const email = formData.get("email") as string;
    const password = formData.get("password") as string;

    startTransition(async () => {
      try {
        const res = await signIn("credentials", {
          email,
          password,
          redirect: false,
        });

        if (res?.error) {
          setError("Email atau password yang Anda masukkan salah.");
        } else {
          onClose();
          router.refresh();
        }
      } catch {
        setError("Terjadi kendala saat login. Silakan coba kembali.");
      }
    });
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-md animate-in fade-in duration-200">
      {/* Backdrop overlay dismiss */}
      <div className="absolute inset-0" onClick={onClose} />

      {/* Modal Container */}
      <div className="relative w-full max-w-md rounded-3xl bg-white dark:bg-[#121215] border border-slate-200 dark:border-white/10 p-6 sm:p-8 shadow-2xl z-10 animate-in zoom-in-95 duration-200">
        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          aria-label="Tutup modal login"
          className="absolute right-5 top-5 w-9 h-9 rounded-full flex items-center justify-center bg-slate-100 dark:bg-white/10 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200 dark:hover:bg-white/20 transition"
        >
          <X size={18} />
        </button>

        {/* Header */}
        <div className="flex items-center gap-4 mb-6">
          <div className="w-14 h-14 shrink-0 rounded-2xl bg-red-50 dark:bg-red-950/40 border border-red-100 dark:border-red-900/40 flex items-center justify-center p-2 shadow-sm">
            <Image src="/image/Logo.webp" alt="KMHDI" width={44} height={44} className="object-contain" priority />
          </div>
          <div>
            <h2 className="text-xl sm:text-2xl font-black tracking-tight text-slate-900 dark:text-white leading-tight">Masuk ke Akun</h2>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-neutral-400 mt-0.5">Akses khusus kader & anggota PC KMHDI</p>
          </div>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="mb-5 p-3.5 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/50 text-rose-700 dark:text-rose-300 text-xs sm:text-sm font-semibold flex items-center gap-2.5 animate-in fade-in">
            <AlertCircle size={18} className="shrink-0 text-rose-600 dark:text-rose-400" />
            <span>{error}</span>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">Email</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                <Mail size={16} />
              </div>
              <input
                name="email"
                type="email"
                required
                placeholder="nama@kmhdimalang.org"
                className="w-full rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-[#18181c] pl-10 pr-4 py-3 text-sm text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-neutral-500 outline-none focus:border-red-500 focus:ring-2 focus:ring-red-500/20 transition"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">Password</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                <Lock size={16} />
              </div>
              <input
                name="password"
                type={showPassword ? "text" : "password"}
                required
                placeholder="Masukkan kata sandi"
                className="w-full rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-[#18181c] pl-10 pr-11 py-3 text-sm text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-neutral-500 outline-none focus:border-red-500 focus:ring-2 focus:ring-red-500/20 transition"
              />
              <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={isPending}
            className="mt-2 w-full rounded-xl bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 py-3.5 text-sm font-bold text-white shadow-lg shadow-red-600/25 transition-all hover:shadow-red-600/40 active:scale-[0.99] flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed cursor-pointer"
          >
            {isPending ? <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : "Login ke Akun"}
          </button>
        </form>

        {/* Footer info */}
        <div className="mt-6 pt-5 border-t border-slate-100 dark:border-white/10 text-center">
          <p className="text-xs text-slate-500 dark:text-neutral-400">
            Belum memiliki akses akun kader?{" "}
            <Link
              href="https://wa.me/6287774230949?text=Halo%20Admin%2C%20saya%20ingin%20meminta%20akses%20akun%20untuk%20website%20PC%20KMHDI%20Malang."
              target="_blank"
              rel="noopener noreferrer"
              className="font-bold text-red-600 dark:text-rose-400 hover:underline inline-block mt-0.5"
            >
              Hubungi Admin via WhatsApp
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
