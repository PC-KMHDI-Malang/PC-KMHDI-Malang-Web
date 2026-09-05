"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";
import { Edit2, X, Loader2 } from "lucide-react";
import { ImagePicker } from "@/components/ui/ImagePicker";

interface GalleryItem {
  id: string;
  title: string;
  coverImage: string;
  description?: string;
  createdAt?: string;
}

interface EditGalleryModalProps {
  item: GalleryItem;
  action: (formData: FormData) => Promise<void>;
}

export function EditGalleryModal({ item, action }: EditGalleryModalProps) {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [isRendered, setIsRendered] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => setIsRendered(true), 0);
      setTimeout(() => setIsVisible(true), 10);
      setError(null);
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

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const formData = new FormData(e.currentTarget);
      // Jika tidak ada gambar baru, gunakan gambar lama
      if (!formData.get("coverImageUrl")) {
        formData.set("coverImageUrl", item.coverImage);
      }
      await action(formData);
      router.refresh();
      setIsOpen(false);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Gagal menyimpan";
      setError(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const defaultDate = item.createdAt ? new Date(item.createdAt).toISOString().split("T")[0] : "";

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="w-10 h-10 flex items-center justify-center bg-slate-100 dark:bg-white/5 text-slate-700 dark:text-slate-300 rounded-full hover:bg-slate-200 dark:hover:bg-white/10 hover:scale-110 transition-transform shadow-sm backdrop-blur-sm mr-2"
        title="Edit Foto"
      >
        <Edit2 size={18} />
      </button>

      {isRendered &&
        createPortal(
          <div className="fixed inset-y-0 right-0 left-0 md:left-64 z-[100] flex items-center justify-center p-4 text-left">
            {/* Backdrop */}
            <div className={`absolute inset-0 bg-slate-900/40 backdrop-blur-md transition-opacity duration-300 ${isVisible ? "opacity-100" : "opacity-0"}`} onClick={() => setIsOpen(false)} />

            {/* Modal Card */}
            <div
              className={`relative w-full max-w-xl max-h-[90vh] overflow-y-auto bg-white dark:bg-[#111114] rounded-3xl shadow-2xl p-8 transform transition-all duration-300 border border-slate-200 dark:border-white/10 ${
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
                <h3 className="text-2xl font-bold text-slate-800 dark:text-white mb-2">Edit Foto Galeri</h3>
                <p className="text-slate-500 dark:text-slate-400 text-sm">Ubah detail dokumentasi kegiatan.</p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-5">
                <input type="hidden" name="id" value={item.id} />
                {error && (
                  <div className="p-3 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 text-sm rounded-xl border border-red-100 dark:border-red-900/30 flex items-center justify-between">
                    <span>{error}</span>
                    <button type="button" onClick={() => setError(null)} className="text-red-400 hover:text-red-600 dark:hover:text-red-300 font-bold ml-2">
                      &times;
                    </button>
                  </div>
                )}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1.5">Judul Foto</label>
                    <input
                      type="text"
                      name="title"
                      required
                      defaultValue={item.title}
                      className="w-full bg-slate-50 dark:bg-[#111114] dark:text-white border border-slate-200 dark:border-white/5 focus:border-red-500 dark:focus:border-rose-500 focus:ring-4 focus:ring-red-500/10 dark:focus:ring-rose-500/20 rounded-xl p-3 outline-none transition-all"
                      placeholder="Masukkan judul..."
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1.5">Tanggal Kegiatan</label>
                    <input
                      type="date"
                      name="createdAt"
                      defaultValue={defaultDate}
                      className="w-full bg-slate-50 dark:bg-[#111114] dark:text-white border border-slate-200 dark:border-white/5 focus:border-red-500 dark:focus:border-rose-500 focus:ring-4 focus:ring-red-500/10 dark:focus:ring-rose-500/20 rounded-xl p-3 outline-none transition-all"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1.5">Ganti Foto (Opsional)</label>
                  <ImagePicker bucket="gallery-photos" defaultImageUrl={item.coverImage} />
                  <p className="text-[10px] text-slate-500 mt-1">Kosongkan/biarkan jika tidak ingin mengganti foto saat ini.</p>
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1.5">Deskripsi Singkat (Opsional)</label>
                  <textarea
                    name="description"
                    defaultValue={item.description || ""}
                    className="w-full bg-slate-50 dark:bg-[#111114] dark:text-white border border-slate-200 dark:border-white/5 focus:border-red-500 dark:focus:border-rose-500 focus:ring-4 focus:ring-red-500/10 dark:focus:ring-rose-500/20 rounded-xl p-3 outline-none transition-all"
                    rows={3}
                    placeholder="Tuliskan deskripsi..."
                  ></textarea>
                </div>

                <div className="flex gap-3 justify-end pt-4">
                  <button
                    type="button"
                    onClick={() => setIsOpen(false)}
                    className="px-5 py-2.5 rounded-xl font-semibold text-slate-600 dark:text-slate-300 bg-slate-50 dark:bg-white/5 hover:bg-slate-100 dark:hover:bg-white/10 transition-colors"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="px-5 py-2.5 rounded-xl font-semibold text-white bg-blue-600 dark:bg-blue-600 hover:bg-blue-700 dark:hover:bg-blue-700 transition-colors shadow-sm disabled:opacity-50 flex items-center gap-2"
                  >
                    {isSubmitting && <Loader2 size={16} className="animate-spin" />}
                    <span>{isSubmitting ? "Menyimpan..." : "Simpan Perubahan"}</span>
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
