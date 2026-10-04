"use client";

import { createPortal } from "react-dom";
import { X } from "lucide-react";
import { useModalTransition } from "@/components/ui/useModalTransition";

interface KasModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  disableClose?: boolean;
  children: React.ReactNode;
}

// Kerangka modal yang sama dengan modal panel admin (mis. AddPartnerModal), tapi tanpa geseran
// md:left-64 — halaman kas berada di layout publik yang tidak punya sidebar admin.
export function KasModal({ isOpen, onClose, title, description, disableClose, children }: KasModalProps) {
  const { isRendered, isVisible } = useModalTransition(isOpen);
  if (!isRendered) return null;

  return createPortal(
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 text-left">
      <div className={`absolute inset-0 bg-slate-900/40 backdrop-blur-md transition-opacity duration-300 ${isVisible ? "opacity-100" : "opacity-0"}`} onClick={disableClose ? undefined : onClose} />

      <div
        className={`relative w-full max-w-lg max-h-[90vh] overflow-y-auto bg-white dark:bg-[#111114] rounded-3xl shadow-2xl p-6 sm:p-8 transform transition-all duration-300 border border-slate-200 dark:border-white/10 ${
          isVisible ? "scale-100 opacity-100 translate-y-0" : "scale-95 opacity-0 translate-y-4"
        }`}
      >
        <div className="absolute top-6 right-6">
          <button
            type="button"
            onClick={onClose}
            disabled={disableClose}
            className="w-8 h-8 flex items-center justify-center rounded-full bg-slate-50 dark:bg-white/5 text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-white/10 hover:text-slate-800 dark:hover:text-white transition-colors disabled:opacity-40"
          >
            <X size={18} />
          </button>
        </div>

        <div className="mb-6 pr-10">
          <h3 className="text-2xl font-bold text-slate-800 dark:text-white mb-2">{title}</h3>
          {description && <p className="text-slate-500 dark:text-slate-400 text-sm">{description}</p>}
        </div>

        {children}
      </div>
    </div>,
    document.body,
  );
}

export function ModalError({ message, onDismiss }: { message: string | null; onDismiss: () => void }) {
  if (!message) return null;
  return (
    <div className="p-3 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 text-sm rounded-xl border border-red-100 dark:border-red-900/30 flex items-center justify-between">
      <span>{message}</span>
      <button type="button" onClick={onDismiss} className="text-red-400 hover:text-red-600 dark:hover:text-red-300 font-bold ml-2">
        &times;
      </button>
    </div>
  );
}

export function ModalActions({ onCancel, isSubmitting, submitLabel, submittingLabel = "Menyimpan..." }: { onCancel: () => void; isSubmitting: boolean; submitLabel: string; submittingLabel?: string }) {
  return (
    <div className="flex gap-3 justify-end pt-4">
      <button
        type="button"
        onClick={onCancel}
        disabled={isSubmitting}
        className="px-5 py-2.5 rounded-xl font-semibold text-slate-600 dark:text-slate-300 bg-slate-50 dark:bg-white/5 hover:bg-slate-100 dark:hover:bg-white/10 transition-colors disabled:opacity-40"
      >
        Batal
      </button>
      <button
        type="submit"
        disabled={isSubmitting}
        className="px-5 py-2.5 rounded-xl font-semibold text-white bg-red-600 dark:bg-rose-600 hover:bg-red-700 dark:hover:bg-rose-700 transition-colors shadow-sm disabled:opacity-50"
      >
        {isSubmitting ? submittingLabel : submitLabel}
      </button>
    </div>
  );
}
