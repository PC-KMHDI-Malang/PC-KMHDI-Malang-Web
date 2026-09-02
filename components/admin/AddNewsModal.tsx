"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { X, PenTool } from "lucide-react";
import { ImagePicker } from "@/components/ui/ImagePicker";
import { CategorySelect } from "@/components/admin/CategorySelect";

interface AddNewsModalProps {
  action: (formData: FormData) => void;
  usedBytes: number;
}

export function AddNewsModal({ action, usedBytes }: AddNewsModalProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isRendered, setIsRendered] = useState(false);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => setIsRendered(true), 0);
      setTimeout(() => setIsVisible(true), 10);
      document.body.style.overflow = "hidden";
    } else {
      setIsVisible(false);
      const timer = setTimeout(() => {
        setIsRendered(false);
        document.body.style.overflow = "unset";
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    action(formData);
    setIsOpen(false);
  };

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="bg-red-600 dark:bg-rose-600 text-white font-bold px-5 py-2.5 rounded-xl hover:bg-red-700 dark:hover:bg-rose-700 shadow-sm transition-all text-sm flex items-center justify-center gap-2 w-full md:w-auto"
      >
        <PenTool size={16} />
        Tulis Artikel Baru
      </button>

      {isRendered &&
        createPortal(
          <div className="fixed inset-y-0 right-0 left-0 md:left-64 z-[100] flex items-center justify-center p-4 text-left">
            <div className={`absolute inset-0 bg-slate-900/40 backdrop-blur-md transition-opacity duration-300 ${isVisible ? "opacity-100" : "opacity-0"}`} onClick={() => setIsOpen(false)} />

            <div
              className={`relative w-full max-w-4xl max-h-[90vh] overflow-y-auto bg-white dark:bg-slate-900 rounded-3xl shadow-2xl p-8 transform transition-all duration-300 border border-slate-100 dark:border-white/5 ${
                isVisible ? "scale-100 opacity-100 translate-y-0" : "scale-95 opacity-0 translate-y-4"
              }`}
            >
              <div className="absolute top-6 right-6">
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  className="w-8 h-8 flex items-center justify-center rounded-full bg-slate-50 dark:bg-white/5 text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-white/10 hover:text-slate-800 dark:hover:text-white transition-colors"
                >
                  <X size={18} />
                </button>
              </div>

              <div className="mb-6">
                <h3 className="text-2xl font-bold text-slate-800 dark:text-white mb-2">Tulis Artikel Baru</h3>
                <p className="text-slate-500 dark:text-slate-400 text-sm">Publikasikan berita, opini, atau informasi terbaru.</p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                  <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1.5">Judul Artikel</label>
                  <input
                    type="text"
                    name="title"
                    required
                    className="w-full bg-slate-50 dark:bg-[#111111] dark:text-white border border-slate-200 dark:border-white/5 focus:border-red-500 dark:focus:border-rose-500 focus:ring-4 focus:ring-red-500/10 dark:focus:ring-rose-500/20 rounded-xl p-3 outline-none transition-all text-lg font-semibold"
                    placeholder="Masukkan judul menarik..."
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1.5">Ringkasan (Excerpt)</label>
                  <textarea
                    name="excerpt"
                    required
                    className="w-full bg-slate-50 dark:bg-[#111111] dark:text-white border border-slate-200 dark:border-white/5 focus:border-red-500 dark:focus:border-rose-500 focus:ring-4 focus:ring-red-500/10 dark:focus:ring-rose-500/20 rounded-xl p-3 outline-none transition-all"
                    rows={2}
                    placeholder="Satu atau dua kalimat untuk menarik minat pembaca..."
                  ></textarea>
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1.5">Isi Artikel Lengkap</label>
                  <textarea
                    name="content"
                    required
                    className="w-full bg-slate-50 dark:bg-[#111111] dark:text-white border border-slate-200 dark:border-white/5 focus:border-red-500 dark:focus:border-rose-500 focus:ring-4 focus:ring-red-500/10 dark:focus:ring-rose-500/20 rounded-xl p-4 outline-none transition-all leading-relaxed"
                    rows={8}
                    placeholder="Ketik isi lengkap artikel Anda di sini..."
                  ></textarea>
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1.5">Gambar Cover</label>
                  <ImagePicker bucket="news-covers" usedBytes={usedBytes} />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <CategorySelect focusColor="red" />
                  <div>
                    <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1.5">Nama Penulis</label>
                    <input
                      type="text"
                      name="authorName"
                      className="w-full bg-slate-50 dark:bg-[#111111] dark:text-white border border-slate-200 dark:border-white/5 focus:border-red-500 dark:focus:border-rose-500 focus:ring-4 focus:ring-red-500/10 dark:focus:ring-rose-500/20 rounded-xl p-3 outline-none transition-all"
                      placeholder="Kosongkan untuk memakai nama akun Anda"
                    />
                  </div>
                </div>

                <div className="flex gap-3 justify-end pt-4">
                  <button
                    type="button"
                    onClick={() => setIsOpen(false)}
                    className="px-5 py-2.5 rounded-xl font-semibold text-slate-600 dark:text-slate-300 bg-slate-50 dark:bg-white/5 hover:bg-slate-100 dark:hover:bg-white/10 transition-colors"
                  >
                    Batal
                  </button>
                  <button type="submit" className="px-5 py-2.5 rounded-xl font-semibold text-white bg-red-600 dark:bg-rose-600 hover:bg-red-700 dark:hover:bg-rose-700 transition-colors shadow-sm">
                    Terbitkan Artikel
                  </button>
                </div>
              </form>
            </div>
          </div>,
          document.body,
        )}
    </>
  );
}
