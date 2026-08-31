"use client";

import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { uploadFileAction } from "@/lib/actions";

interface ImagePickerProps {
  defaultImageUrl?: string;
  bucket?: string;
  usedBytes?: number;
  quotaBytes?: number;
}

export function ImagePicker({ defaultImageUrl = "", bucket = "news-covers", usedBytes, quotaBytes = 52428800 }: ImagePickerProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedUrl, setSelectedUrl] = useState(defaultImageUrl);
  const [isUploading, setIsUploading] = useState(false);
  const [mounted, setMounted] = useState(false);

  // Fungsi utilitas formatBytes
  const formatBytes = (bytes: number) => {
    if (bytes <= 0) return "0 B";
    const units = ["B", "KB", "MB", "GB"];
    const i = Math.min(units.length - 1, Math.floor(Math.log(bytes) / Math.log(1024)));
    return `${(bytes / Math.pow(1024, i)).toFixed(i === 0 ? 0 : 1)} ${units[i]}`;
  };

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (isModalOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isModalOpen]);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!["image/jpeg", "image/png", "image/jpg"].includes(file.type)) {
      alert("Format gambar tidak didukung. Harap gunakan JPG atau PNG.");
      return;
    }

    if (file.size > 1024 * 1024) {
      alert("Ukuran gambar maksimal 1 MB.");
      return;
    }

    setIsUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("bucket", bucket);

      const newUrl = await uploadFileAction(formData);

      setSelectedUrl(newUrl);
      setIsModalOpen(false);
    } catch (error: any) {
      alert("Gagal mengupload gambar: " + error.message);
    } finally {
      setIsUploading(false);
    }
  };

  const modalContent = isModalOpen ? (
    <div className="fixed top-0 bottom-0 right-0 left-64 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-white dark:bg-slate-900 w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden flex flex-col">
        <div className="p-6 border-b border-slate-100 dark:border-white/5 flex justify-between items-center bg-white dark:bg-slate-900 sticky top-0 z-10">
          <h3 className="text-xl font-bold text-slate-800 dark:text-white">Upload Gambar Baru</h3>
          <button type="button" onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-red-500 transition-colors p-2 font-bold">
            Tutup
          </button>
        </div>

        <div className="p-8 bg-slate-50 dark:bg-slate-800/50">
          <label className="flex items-center justify-center w-full h-48 border-2 border-dashed border-blue-400 dark:border-blue-500/50 rounded-xl cursor-pointer hover:bg-blue-50 dark:hover:bg-blue-500/10 transition-colors">
            <div className="flex flex-col items-center justify-center">
              {isUploading ? (
                <span className="text-blue-600 dark:text-blue-400 font-semibold flex items-center gap-2">
                  <svg className="animate-spin h-6 w-6" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Mengunggah...
                </span>
              ) : (
                <>
                  <svg className="w-10 h-10 text-blue-500 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"></path>
                  </svg>
                  <span className="text-blue-600 dark:text-blue-400 font-semibold">Klik untuk memilih file</span>
                  <span className="text-slate-400 dark:text-slate-500 text-sm mt-1">Mendukung format JPG, PNG (Maks 1 MB)</span>
                </>
              )}
            </div>
            <input type="file" className="hidden" accept="image/jpeg, image/png, image/jpg" onChange={handleUpload} disabled={isUploading} />
          </label>

          {typeof usedBytes !== "undefined" && typeof quotaBytes !== "undefined" && (
            <div className="mt-6 pt-6 border-t border-slate-200 dark:border-white/10">
              <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
                <span className="text-sm font-bold text-slate-700 dark:text-slate-300">Penyimpanan Storage</span>
                <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                  {formatBytes(usedBytes)} terpakai &middot; {formatBytes(Math.max(0, quotaBytes - usedBytes))} tersisa dari {formatBytes(quotaBytes)}
                </span>
              </div>
              <div className="w-full h-2 rounded-full bg-slate-200 dark:bg-white/10 overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all ${usedBytes / quotaBytes > 0.9 ? "bg-red-500" : usedBytes / quotaBytes > 0.7 ? "bg-amber-500" : "bg-emerald-500"}`}
                  style={{ width: `${Math.min(100, (usedBytes / quotaBytes) * 100)}%` }}
                />
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  ) : null;

  return (
    <div>
      <input type="hidden" name="coverImageUrl" value={selectedUrl} />
      <div className="flex flex-wrap gap-4 items-center">
        {selectedUrl ? (
          <div className="relative inline-block group">
            <img src={selectedUrl} alt="Selected cover" className="w-48 h-32 object-cover rounded-xl border border-slate-200 dark:border-white/10" />
            <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity rounded-xl">
              <button type="button" onClick={() => setIsModalOpen(true)} className="text-white text-sm font-semibold bg-blue-600 px-3 py-1.5 rounded-lg hover:bg-blue-700 transition-colors">
                Ganti Gambar
              </button>
            </div>
            <button
              type="button"
              onClick={() => setSelectedUrl("")}
              className="absolute -top-2 -right-2 bg-red-500 text-white w-6 h-6 rounded-full flex items-center justify-center hover:bg-red-600 transition-colors opacity-0 group-hover:opacity-100"
            >
              &times;
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => setIsModalOpen(true)}
            className="bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-semibold px-5 py-4 rounded-xl border-2 border-dashed border-slate-300 dark:border-slate-600 transition-all flex items-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
              ></path>
            </svg>
            Pilih Gambar
          </button>
        )}
      </div>

      {mounted && typeof document !== "undefined" && createPortal(modalContent, document.body)}
    </div>
  );
}
