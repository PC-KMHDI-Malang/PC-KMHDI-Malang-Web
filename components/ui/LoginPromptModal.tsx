"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import { X, Lock } from "lucide-react";

interface LoginPromptModalProps {
  loginHref: string;
  triggerLabel: string;
  triggerIcon: React.ReactNode;
  triggerClassName: string;
}

export function LoginPromptModal({ loginHref, triggerLabel, triggerIcon, triggerClassName }: LoginPromptModalProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isRendered, setIsRendered] = useState(false);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => setIsRendered(true), 0);
      setTimeout(() => setIsVisible(true), 10);
    } else {
      setIsVisible(false);
      const timer = setTimeout(() => setIsRendered(false), 300);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isOpen]);

  return (
    <>
      <button type="button" onClick={() => setIsOpen(true)} className={triggerClassName}>
        {triggerIcon}
        {triggerLabel}
      </button>

      {isRendered &&
        createPortal(
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <div className={`absolute inset-0 bg-slate-900/40 backdrop-blur-md transition-opacity duration-300 ${isVisible ? "opacity-100" : "opacity-0"}`} onClick={() => setIsOpen(false)} />

            <div
              className={`relative w-full max-w-sm bg-white dark:bg-slate-900 rounded-3xl shadow-2xl p-7 transform transition-all duration-300 border border-slate-100 dark:border-white/5 ${
                isVisible ? "scale-100 opacity-100 translate-y-0" : "scale-95 opacity-0 translate-y-4"
              }`}
            >
              <div className="absolute top-4 right-4">
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  className="w-8 h-8 flex items-center justify-center rounded-full bg-slate-50 dark:bg-white/5 text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-white/10 hover:text-slate-800 dark:hover:text-white transition-colors"
                >
                  <X size={18} />
                </button>
              </div>

              <div className="w-12 h-12 rounded-full mb-4 flex items-center justify-center bg-red-100 dark:bg-rose-950/50 text-red-600 dark:text-rose-400">
                <Lock size={22} />
              </div>

              <h3 className="text-xl font-bold text-slate-800 dark:text-white mb-2">Login Diperlukan</h3>
              <p className="text-slate-500 dark:text-slate-400 text-sm leading-relaxed mb-6">Anda harus login sebagai kader PC KMHDI Malang untuk membaca atau mengunduh e-Book ini.</p>

              <div className="flex gap-3 justify-end">
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  className="px-5 py-2.5 rounded-xl font-semibold text-slate-600 dark:text-slate-300 bg-slate-50 dark:bg-white/5 hover:bg-slate-100 dark:hover:bg-white/10 transition-colors"
                >
                  Nanti Saja
                </button>
                <Link href={loginHref} className="px-5 py-2.5 rounded-xl font-semibold text-white bg-red-600 dark:bg-rose-600 hover:bg-red-700 dark:hover:bg-rose-700 transition-colors shadow-sm">
                  Login
                </Link>
              </div>
            </div>
          </div>,
          document.body,
        )}
    </>
  );
}
