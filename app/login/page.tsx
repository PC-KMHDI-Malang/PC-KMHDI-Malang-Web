"use client";

import { Suspense, useState, useTransition } from "react";
import { loginAction } from "./actions";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { ArrowLeft, Eye, EyeOff } from "lucide-react";

export default function LoginPage() {
  return (
    <Suspense fallback={null}>
      <LoginForm />
    </Suspense>
  );
}

function LoginForm() {
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const [showPassword, setShowPassword] = useState(false);
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") || "";

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    setError(null);
    startTransition(async () => {
      const result = await loginAction(formData);
      if (result?.error) {
        setError(result.error);
      }
    });
  };

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-50 relative overflow-hidden">
      {/* Tombol Kembali ke Website */}
      <div className="absolute top-6 left-6 md:top-10 md:left-10 z-10">
        <Link
          href="/"
          className="flex items-center gap-2 bg-white/70 backdrop-blur-md px-5 py-2.5 rounded-full shadow-sm hover:shadow-md transition-all border border-slate-200 text-slate-700 font-semibold hover:text-red-700 hover:border-red-200 group"
        >
          <ArrowLeft size={18} className="group-hover:-translate-x-1 transition-transform" />
          Kembali ke Website
        </Link>
      </div>

      <div className="w-full max-w-md rounded-[2rem] bg-white p-10 shadow-2xl border border-slate-100 z-10 relative">
        <div className="flex items-center gap-5 mb-8">
          <div className="w-20 h-20 shrink-0 bg-slate-50 border border-slate-100 shadow-sm rounded-2xl flex items-center justify-center p-2">
            <img src="/image/Logo.png" alt="Logo" className="w-full h-full object-contain" />
          </div>
          <div>
            <h1 className="text-3xl font-extrabold text-slate-800 tracking-tight">Login</h1>
            <p className="text-slate-500 mt-1 text-sm font-medium">
              Web Apps ini dikhususkan untuk kader PC KMHDI Malang. Masuk untuk eksplore lebih lanjut.
            </p>
          </div>
        </div>

        {!error && callbackUrl && (
          <div className="mb-6 p-4 rounded-xl bg-amber-50 border border-amber-100 text-amber-700 text-sm font-bold flex items-center gap-3">
            <svg className="w-5 h-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 10-8 0v4h8z"></path>
            </svg>
            Silakan login terlebih dahulu untuk membaca buku ini.
          </div>
        )}

        {error && (
          <div className="mb-6 p-4 rounded-xl bg-red-50 border border-red-100 text-red-600 text-sm font-bold flex items-center gap-3">
            <svg className="w-5 h-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path>
            </svg>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <input type="hidden" name="callbackUrl" value={callbackUrl} />
          <div>
            <label className="mb-2 block text-sm font-bold text-slate-700">Email</label>
            <input
              name="email"
              type="email"
              required
              placeholder="admin@kmhdimalang.org"
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3.5 outline-none focus:border-red-500 focus:ring-4 focus:ring-red-500/10 transition-all font-medium"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-bold text-slate-700">Password</label>
            <div className="relative">
              <input
                name="password"
                type={showPassword ? "text" : "password"}
                required
                placeholder="********"
                className="w-full rounded-xl border border-slate-200 bg-slate-50 pl-4 pr-12 py-3.5 outline-none focus:border-red-500 focus:ring-4 focus:ring-red-500/10 transition-all font-medium"
              />
              <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute inset-y-0 right-0 flex items-center justify-center w-12 text-slate-400 hover:text-slate-600 transition-colors">
                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={isPending}
            className={`w-full rounded-xl bg-red-600 py-3.5 font-bold text-white transition-all shadow-md hover:shadow-lg hover:shadow-red-600/30 flex items-center justify-center gap-2 ${
              isPending ? "opacity-70 pointer-events-none" : "hover:bg-red-700"
            }`}
          >
            {isPending ? <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></span> : "Login"}
          </button>
        </form>

        <div className="mt-8 pt-6 border-t border-slate-100 text-center">
          <p className="text-sm font-medium text-slate-500">
            Belum punya akun?{" "}
            <Link
              href="https://wa.me/6281234567890?text=Halo%20Admin%2C%20saya%20ingin%20meminta%20akses%20akun%20untuk%20website%20PC%20KMHDI%20Malang."
              target="_blank"
              rel="noopener noreferrer"
              className="font-bold text-slate-800 hover:text-red-600 underline underline-offset-4 decoration-2 decoration-slate-300 hover:decoration-red-600 transition-all"
            >
              Hubungi Admin via WhatsApp
            </Link>
          </p>
        </div>
      </div>
    </main>
  );
}
