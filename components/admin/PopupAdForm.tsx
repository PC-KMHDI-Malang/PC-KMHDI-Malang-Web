"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { ImagePicker } from "@/components/ui/ImagePicker";

interface PopupAdFormProps {
  imageUrl: string;
  linkUrl: string;
  isActive: boolean;
  action: (formData: FormData) => Promise<void>;
}

export function PopupAdForm({ imageUrl, linkUrl, isActive, action }: PopupAdFormProps) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeChecked, setActiveChecked] = useState(isActive);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);
    try {
      const formData = new FormData(e.currentTarget);
      // Sakelar aktif/nonaktif bukan <input> asli (custom, lihat di bawah), jadi nilainya
      // disisipkan manual ke FormData sebelum dikirim ke server action.
      formData.set("isActive", activeChecked ? "true" : "false");
      await action(formData);
      toast.success("Pengaturan pop-up berhasil disimpan.");
      router.refresh();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Gagal menyimpan";
      setError(msg);
      toast.error(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div className="p-3 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 text-sm rounded-xl border border-red-100 dark:border-red-900/30 flex items-center justify-between">
          <span>{error}</span>
          <button type="button" onClick={() => setError(null)} className="text-red-400 hover:text-red-600 dark:hover:text-red-300 font-bold ml-2">
            &times;
          </button>
        </div>
      )}

      <div>
        <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1.5">Gambar Poster</label>
        <ImagePicker name="imageUrl" bucket="popup-ads" defaultImageUrl={imageUrl} maxSizeMB={2} />
        <p className="text-[10px] text-slate-500 mt-1">Tampil sebagai pop-up begitu pengunjung pertama kali membuka situs.</p>
      </div>

      <div>
        <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1.5">Tautan Tujuan (Opsional)</label>
        <input
          type="text"
          name="linkUrl"
          defaultValue={linkUrl}
          placeholder="https://contoh.com/promo"
          className="w-full bg-slate-50 dark:bg-[#111114] dark:text-white border border-slate-200 dark:border-white/5 focus:border-red-500 dark:focus:border-rose-500 focus:ring-4 focus:ring-red-500/10 dark:focus:ring-rose-500/20 rounded-xl p-3 outline-none transition-all"
        />
        <p className="text-[10px] text-slate-500 mt-1">Kalau diisi, poster bisa diklik dan membuka tautan ini di tab baru. Kosongkan kalau posternya cuma pengumuman tanpa tautan.</p>
      </div>

      <div className="flex items-center justify-between rounded-xl border border-slate-200 dark:border-white/10 p-4">
        <div className="pr-4">
          <p className="text-sm font-bold text-slate-700 dark:text-slate-300">Aktifkan Pop-up</p>
          <p className="text-[11px] text-slate-500 mt-0.5">Kalau dimatikan, pop-up tidak tampil di situs sama sekali walau gambarnya sudah diisi.</p>
        </div>
        <button
          type="button"
          role="switch"
          aria-checked={activeChecked}
          onClick={() => setActiveChecked((v) => !v)}
          className={`relative inline-flex h-7 w-12 shrink-0 items-center rounded-full transition-colors cursor-pointer ${activeChecked ? "bg-red-600" : "bg-slate-300 dark:bg-slate-700"}`}
        >
          <span className={`inline-block h-5 w-5 transform rounded-full bg-white shadow transition-transform ${activeChecked ? "translate-x-6" : "translate-x-1"}`} />
        </button>
      </div>

      <div className="pt-2 flex justify-end">
        <button
          type="submit"
          disabled={isSubmitting}
          className="px-6 py-3 rounded-xl font-semibold text-white bg-red-600 hover:bg-red-700 transition-colors shadow-sm disabled:opacity-50 flex items-center gap-2 cursor-pointer"
        >
          {isSubmitting && <Loader2 size={16} className="animate-spin" />}
          <span>{isSubmitting ? "Menyimpan..." : "Simpan Perubahan"}</span>
        </button>
      </div>
    </form>
  );
}
