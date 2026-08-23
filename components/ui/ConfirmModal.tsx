"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";

interface ConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  description: string;
  confirmText?: string;
  cancelText?: string;
  isDestructive?: boolean;
}

export function ConfirmModal({
  isOpen,
  onClose,
  onConfirm,
  title,
  description,
  confirmText = "Konfirmasi",
  cancelText = "Batal",
  isDestructive = true,
}: ConfirmModalProps) {
  const [isRendered, setIsRendered] = useState(false);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => setIsRendered(true), 0);
      // Small delay to allow initial render before triggering animation
      setTimeout(() => setIsVisible(true), 10);
      document.body.style.overflow = 'hidden';
    } else {
      setIsVisible(false);
      const timer = setTimeout(() => {
        setIsRendered(false);
        document.body.style.overflow = 'unset';
      }, 300); // matches transition duration
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  if (!isRendered) return null;

  const modalContent = (
    <div className="fixed inset-y-0 right-0 left-0 md:left-64 z-[100] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className={`absolute inset-0 bg-slate-900/40 backdrop-blur-md transition-opacity duration-300 ${
          isVisible ? "opacity-100" : "opacity-0"
        }`}
        onClick={onClose}
      />
      
      {/* Modal Card */}
      <div 
        className={`relative w-full max-w-md bg-white dark:bg-slate-900 rounded-3xl shadow-2xl p-6 transform transition-all duration-300 border border-slate-100 dark:border-white/5 ${
          isVisible ? "scale-100 opacity-100 translate-y-0" : "scale-95 opacity-0 translate-y-4"
        }`}
      >
        <div className="absolute top-4 right-4">
          <button 
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-full bg-slate-50 dark:bg-white/5 text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-white/10 hover:text-slate-800 dark:hover:text-white transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        <div className="mb-6">
          <div className={`w-12 h-12 rounded-full mb-4 flex items-center justify-center ${
            isDestructive ? 'bg-red-100 dark:bg-rose-950/50 text-red-600 dark:text-rose-400' : 'bg-slate-100 dark:bg-white/5 text-slate-600 dark:text-slate-300'
          }`}>
            {isDestructive ? (
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path></svg>
            ) : (
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
            )}
          </div>
          <h3 className="text-xl font-bold text-slate-800 dark:text-white mb-2">{title}</h3>
          <p className="text-slate-500 dark:text-slate-400 text-sm leading-relaxed">{description}</p>
        </div>

        <div className="flex gap-3 justify-end">
          <button 
            onClick={onClose}
            className="px-5 py-2.5 rounded-xl font-semibold text-slate-600 dark:text-slate-300 bg-slate-50 dark:bg-white/5 hover:bg-slate-100 dark:hover:bg-white/10 transition-colors"
          >
            {cancelText}
          </button>
          <button 
            onClick={onConfirm}
            className={`px-5 py-2.5 rounded-xl font-semibold text-white transition-colors shadow-sm ${
              isDestructive ? 'bg-red-600 dark:bg-rose-600 hover:bg-red-700 dark:hover:bg-rose-700 hover:shadow-red-600/30 dark:hover:shadow-rose-900/30' : 'bg-slate-900 dark:bg-white dark:text-slate-900 hover:bg-black dark:hover:bg-slate-200'
            }`}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
}
