"use client";

import { useEffect, useState, useTransition } from "react";
import { createPortal } from "react-dom";
import { X, Edit2 } from "lucide-react";
import { ImagePicker } from "@/components/ui/ImagePicker";
import { FilePicker } from "@/components/ui/FilePicker";
import { useRouter } from "next/navigation";

interface Ebook {
  id: string;
  title: string;
  description?: string | null;
  genre: string;
  coverImage: string;
  pdfUrl?: string | null;
  publishYear?: number | null;
  publisher?: string | null;
}

interface EditEbookModalProps {
  ebook: Ebook;
  action: (formData: FormData) => void;
  usedBytes: number;
  filesUsedBytes?: number;
}

export function EditEbookModal({ ebook, action, usedBytes, filesUsedBytes = 0 }: EditEbookModalProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isRendered, setIsRendered] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

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
    formData.append("id", ebook.id);

    startTransition(() => {
      action(formData);
      setIsOpen(false);
    });
  };

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        title="Edit E-Book"
        className="flex items-center gap-2 text-blue-500 dark:text-blue-400 font-bold hover:text-blue-700 dark:hover:text-blue-300 hover:bg-blue-50 dark:hover:bg-blue-950/50 px-4 py-2 rounded-lg transition-colors text-sm"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"></path>
        </svg>
        Edit
      </button>

      {isRendered &&
        createPortal(
          <div className="fixed inset-y-0 right-0 left-0 md:left-64 z-[100] flex items-center justify-center p-4 text-left">
            <div className={`absolute inset-0 bg-slate-900/40 backdrop-blur-md transition-opacity duration-300 ${isVisible ? "opacity-100" : "opacity-0"}`} onClick={() => setIsOpen(false)} />

            <div
              className={`relative w-full max-w-xl max-h-[90vh] overflow-y-auto bg-white dark:bg-slate-900 rounded-3xl shadow-2xl p-8 transform transition-all duration-300 border border-slate-100 dark:border-white/5 ${
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
                <h3 className="text-2xl font-bold text-slate-800 dark:text-white mb-2">Edit E-Book</h3>
                <p className="text-slate-500 dark:text-slate-400 text-sm">Ubah detail e-book ini.</p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-5">
                <div>
                  <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1.5">Judul Ebook</label>
                  <input
                    type="text"
                    name="title"
                    defaultValue={ebook.title}
                    required
                    className="w-full bg-slate-50 dark:bg-[#111111] dark:text-white border border-slate-200 dark:border-white/5 focus:border-red-500 dark:focus:border-rose-500 focus:ring-4 focus:ring-red-500/10 dark:focus:ring-rose-500/20 rounded-xl p-3 outline-none transition-all"
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1.5">Jenis/Kategori Buku</label>
                  <select
                    name="genre"
                    defaultValue={ebook.genre || "Lainnya"}
                    required
                    className="w-full bg-slate-50 dark:bg-[#111111] dark:text-white border border-slate-200 dark:border-white/5 focus:border-red-500 dark:focus:border-rose-500 focus:ring-4 focus:ring-red-500/10 dark:focus:ring-rose-500/20 rounded-xl p-3 outline-none transition-all"
                  >
                    <option value="Lainnya">Lainnya</option>
                    <option value="Organisasi">Organisasi</option>
                    <option value="Agama">Agama</option>
                    <option value="Pendidikan">Pendidikan</option>
                    <option value="Teknologi">Teknologi</option>
                    <option value="Sastra">Sastra</option>
                    <option value="Pengembangan Diri">Pengembangan Diri</option>
                    <option value="Finansial">Finansial</option>
                  </select>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1.5">Tahun Terbit</label>
                    <input
                      type="number"
                      name="publishYear"
                      required
                      defaultValue={ebook.publishYear || new Date().getFullYear()}
                      className="w-full bg-slate-50 dark:bg-[#111111] dark:text-white border border-slate-200 dark:border-white/5 focus:border-red-500 dark:focus:border-rose-500 focus:ring-4 focus:ring-red-500/10 dark:focus:ring-rose-500/20 rounded-xl p-3 outline-none transition-all"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1.5">Nama Penerbit</label>
                    <input
                      type="text"
                      name="publisher"
                      required
                      defaultValue={ebook.publisher || "PP KMHDI"}
                      className="w-full bg-slate-50 dark:bg-[#111111] dark:text-white border border-slate-200 dark:border-white/5 focus:border-red-500 dark:focus:border-rose-500 focus:ring-4 focus:ring-red-500/10 dark:focus:ring-rose-500/20 rounded-xl p-3 outline-none transition-all"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1.5">Deskripsi Singkat (Opsional)</label>
                  <textarea
                    name="description"
                    defaultValue={ebook.description || ""}
                    maxLength={300}
                    className="w-full bg-slate-50 dark:bg-[#111111] dark:text-white border border-slate-200 dark:border-white/5 focus:border-red-500 dark:focus:border-rose-500 focus:ring-4 focus:ring-red-500/10 dark:focus:ring-rose-500/20 rounded-xl p-3 outline-none transition-all"
                    rows={4}
                    placeholder="Tuliskan deskripsi singkat mengenai e-book ini (Maksimal 300 karakter)..."
                  ></textarea>
                  <p className="text-xs text-slate-500 mt-1.5">Maksimal 300 karakter.</p>
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1.5">Gambar Cover E-Book</label>
                  <ImagePicker bucket="ebook-covers" usedBytes={usedBytes} defaultImageUrl={ebook.coverImage} />
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1.5">File PDF E-Book</label>
                  <FilePicker bucket="ebook-files" usedBytes={filesUsedBytes} defaultFileUrl={ebook.pdfUrl || ""} />
                </div>

                <div className="flex gap-3 justify-end pt-4">
                  <button
                    type="button"
                    onClick={() => setIsOpen(false)}
                    className="px-5 py-2.5 rounded-xl font-semibold text-slate-600 dark:text-slate-300 bg-slate-50 dark:bg-white/5 hover:bg-slate-100 dark:hover:bg-white/10 transition-colors"
                  >
                    Batal
                  </button>
                  <button type="submit" className="px-5 py-2.5 rounded-xl font-semibold text-white bg-blue-600 dark:bg-blue-600 hover:bg-blue-700 dark:hover:bg-blue-700 transition-colors shadow-sm">
                    Simpan Perubahan
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
