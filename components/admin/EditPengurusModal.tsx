"use client";

import { useEffect, useState, useRef } from "react";
import { createPortal } from "react-dom";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { X, Edit2, Upload, Loader2, Image as ImageIcon, Instagram } from "lucide-react";
import { uploadFileAction } from "@/lib/actions";
import { Member, organizationRoleGroups } from "@/data/organization";

interface EditPengurusModalProps {
  member: Member;
  action: (formData: FormData) => Promise<void>;
}

export function EditPengurusModal({ member, action }: EditPengurusModalProps) {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string>(member.imageUrl || "");
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
      setError(null);
    } else {
      document.body.style.overflow = "unset";
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isOpen]);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    setError(null);
    const file = e.target.files?.[0];
    if (!file) return;

    if (!["image/jpeg", "image/png", "image/webp", "image/jpg"].includes(file.type)) {
      setError("Format gambar harus JPG, PNG, atau WEBP.");
      e.target.value = "";
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      setError("Ukuran file maksimal 2 MB.");
      e.target.value = "";
      return;
    }

    setIsUploading(true);
    try {
      const uploadData = new FormData();
      uploadData.append("file", file);
      uploadData.append("bucket", "organization-photos");
      const url = await uploadFileAction(uploadData);
      setPreviewUrl(url);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Terjadi kesalahan";
      setError("Gagal mengunggah foto: " + msg);
    } finally {
      setIsUploading(false);
      e.target.value = "";
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const formData = new FormData(e.currentTarget);
      formData.set("id", member.id);
      if (previewUrl) {
        formData.set("imageUrl", previewUrl);
      }
      await action(formData);
      router.refresh();
      setIsOpen(false);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Gagal menyimpan";
      setError("Terjadi kesalahan: " + msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <button
        type="button"
        onClick={() => {
          setPreviewUrl(member.imageUrl || "");
          setIsOpen(true);
        }}
        className="p-2 rounded-xl bg-slate-100 dark:bg-white/5 hover:bg-slate-200 dark:hover:bg-white/10 text-slate-700 dark:text-white transition cursor-pointer"
        title="Edit Data Pengurus"
      >
        <Edit2 size={15} />
      </button>

      {isOpen &&
        createPortal(
          <div className="fixed inset-y-0 right-0 left-0 md:left-64 z-[100] flex items-center justify-center p-4 text-left animate-in fade-in duration-200">
            {/* Backdrop */}
            <div className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm" onClick={() => setIsOpen(false)} />

            {/* Modal Card */}
            <div className="relative w-full max-w-xl max-h-[90vh] overflow-y-auto bg-white dark:bg-[#111114] rounded-3xl shadow-2xl p-6 sm:p-8 border border-slate-200 dark:border-white/10 z-10 animate-in zoom-in-95 duration-200">
              <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-white/5 mb-6">
                <div>
                  <h3 className="text-xl font-bold text-slate-800 dark:text-white">Edit Data Pengurus</h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    {member.name} • {member.role}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  className="w-8 h-8 rounded-full bg-slate-100 dark:bg-white/5 text-slate-400 hover:text-slate-700 dark:hover:text-white flex items-center justify-center transition cursor-pointer"
                >
                  <X size={18} />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                {error && (
                  <div className="p-3 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 text-sm rounded-xl border border-red-100 dark:border-red-900/30 flex items-center justify-between">
                    <span>{error}</span>
                    <button type="button" onClick={() => setError(null)} className="text-red-400 hover:text-red-600 dark:hover:text-red-300 font-bold ml-2">
                      &times;
                    </button>
                  </div>
                )}
                <input type="hidden" name="id" value={member.id} />

                {/* Upload Foto Profil */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2">Foto Resmi Kader</label>
                  <div className="flex items-center gap-4">
                    <div className="relative w-20 h-24 rounded-2xl overflow-hidden bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 flex items-center justify-center shrink-0 shadow-inner">
                      {previewUrl ? <Image src={previewUrl} alt="Preview" fill unoptimized className="object-cover" /> : <ImageIcon size={24} className="text-slate-400" />}
                      {isUploading && (
                        <div className="absolute inset-0 bg-black/50 flex items-center justify-center text-white">
                          <Loader2 size={20} className="animate-spin" />
                        </div>
                      )}
                    </div>
                    <div className="flex-1">
                      <input type="file" ref={fileInputRef} onChange={handleFileChange} accept="image/jpeg,image/png,image/webp" className="hidden" />
                      <input type="hidden" name="imageUrl" value={previewUrl} />
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        disabled={isUploading}
                        className="flex items-center gap-2 px-4 py-2 bg-slate-100 dark:bg-white/10 hover:bg-slate-200 dark:hover:bg-white/20 text-slate-700 dark:text-white rounded-xl text-xs font-bold transition cursor-pointer"
                      >
                        <Upload size={14} />
                        <span>{isUploading ? "Mengunggah..." : "Ganti Foto"}</span>
                      </button>
                      <p className="text-[11px] text-slate-400 mt-1">Format JPG, PNG, atau WEBP. Maksimal 2 MB.</p>
                    </div>
                  </div>
                </div>

                {/* Nama Lengkap */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                    Nama Lengkap <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="name"
                    required
                    defaultValue={member.name}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/5 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
                  />
                </div>

                {/* Jabatan & Level */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                      Jabatan Resmi <span className="text-red-500">*</span>
                    </label>
                    <select
                      name="role"
                      required
                      defaultValue={member.role}
                      className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-[#1c1c22] text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
                    >
                      {/* Pastikan role saat ini tetap ada jika role non-standar */}
                      {!organizationRoleGroups.some((g) => g.roles.includes(member.role)) && <option value={member.role}>{member.role} (Saat ini)</option>}
                      {organizationRoleGroups.map((group) => (
                        <optgroup key={group.group} label={group.group}>
                          {group.roles.map((r) => (
                            <option key={r} value={r}>
                              {r}
                            </option>
                          ))}
                        </optgroup>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                      Tingkatan (Level Bagan) <span className="text-red-500">*</span>
                    </label>
                    <select
                      name="level"
                      required
                      defaultValue={member.level || "staf"}
                      className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-[#1c1c22] text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
                    >
                      <option value="bph_inti">BPH Inti (Ketua / Sekcab / Bencab)</option>
                      <option value="bph_wakil">Wakil BPH (Wasekcab / Wabencab)</option>
                      <option value="kabid">Ketua / Kepala Bidang</option>
                      <option value="direktur">Direktur Lembaga (Non-Bidang)</option>
                      <option value="staf">Staf Anggota / Pengurus Lembaga</option>
                    </select>
                  </div>
                </div>

                {/* Departemen */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                    Departemen / Bidang / Lembaga <span className="text-red-500">*</span>
                  </label>
                  <select
                    name="department"
                    required
                    defaultValue={member.department}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-[#1c1c22] text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
                  >
                    <option value="bph">Badan Pengurus Harian (BPH)</option>
                    <option value="organisasi">Bidang Organisasi</option>
                    <option value="kaderisasi">Bidang Kaderisasi</option>
                    <option value="litbang">Bidang Penelitian &amp; Pengembangan (Litbang)</option>
                    <option value="sosmas">Bidang Sosial Kemasyarakatan (Sosmas)</option>
                    <option value="ddi">Bidang Data dan Informasi (DDI)</option>
                    <option value="kewirausahaan">Lembaga Kewirausahaan (Non-Bidang)</option>
                  </select>
                </div>

                {/* Kampus & Jurusan */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                      Asal Kampus <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      name="campus"
                      required
                      defaultValue={member.campus}
                      className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/5 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                      Program Studi / Jurusan <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      name="major"
                      required
                      defaultValue={member.major}
                      className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/5 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
                    />
                  </div>
                </div>

                {/* Nomor Urut Tampil & Akun Instagram (Masa Bakti Dihilangkan) */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                      Nomor Urut Tampil (Angka) <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="number"
                      name="orderIndex"
                      required
                      defaultValue={member.orderIndex}
                      className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/5 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-red-500 font-bold text-red-600 dark:text-rose-400"
                    />
                    <p className="text-[10px] text-slate-400 mt-1">Panduan: BPH (1-5), Organisasi (10-19), Kaderisasi (20-29), Litbang (30-39), Sosmas (40-49), DDI (50-59), Kewirausahaan (60-69).</p>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">Akun Instagram Kader</label>
                    <div className="relative">
                      <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                        <Instagram size={14} />
                      </span>
                      <input
                        type="text"
                        name="instagram"
                        defaultValue={member.instagram?.replace(/^@/, "") || ""}
                        placeholder="username_tanpa_@"
                        className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/5 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-red-500 font-medium"
                      />
                    </div>
                    <p className="text-[10px] text-slate-400 mt-1">Ketik username saja tanpa tanda @ (opsional).</p>
                  </div>
                </div>

                {/* Tombol Aksi */}
                <div className="pt-4 border-t border-slate-100 dark:border-white/5 flex items-center justify-end gap-3">
                  <button type="button" onClick={() => setIsOpen(false)} className="px-5 py-2.5 rounded-xl text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-white/5 text-sm font-semibold transition cursor-pointer">
                    Batal
                  </button>
                  <button
                    type="submit"
                    disabled={isUploading || isSubmitting}
                    className="px-6 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 dark:bg-rose-600 dark:hover:bg-rose-700 text-white text-sm font-bold shadow-md transition cursor-pointer disabled:opacity-50 flex items-center gap-2"
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
