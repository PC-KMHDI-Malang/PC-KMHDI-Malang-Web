"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { X, UserPlus, Eye, EyeOff } from "lucide-react";

import { toast } from "sonner";
import { SubmitButton } from "@/components/ui/SubmitButton";

interface AddUserModalProps {
  action: (formData: FormData) => Promise<{ error?: string; success?: boolean; message?: string }>;
}

export function AddUserModal({ action }: AddUserModalProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isRendered, setIsRendered] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

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

  const handleFormAction = async (formData: FormData) => {
    const result = await action(formData);
    if (result?.error) {
      toast.error(result.error);
    } else if (result?.success) {
      toast.success(result.message);
      setIsOpen(false);
    }
  };

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="bg-red-600 dark:bg-rose-600 text-white font-bold px-5 py-2.5 rounded-xl hover:bg-red-700 dark:hover:bg-rose-700 shadow-sm transition-all text-sm flex items-center justify-center gap-2"
      >
        <UserPlus size={16} />
        Daftarkan Akun
      </button>

      {isRendered &&
        createPortal(
          <div className="fixed inset-y-0 right-0 left-0 md:left-64 z-[100] flex items-center justify-center p-4 text-left">
            {/* Backdrop */}
            <div className={`absolute inset-0 bg-slate-900/40 backdrop-blur-md transition-opacity duration-300 ${isVisible ? "opacity-100" : "opacity-0"}`} onClick={() => setIsOpen(false)} />

            {/* Modal Card */}
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
                <h3 className="text-2xl font-bold text-slate-800 dark:text-white mb-2">Tambah User Baru</h3>
                <p className="text-slate-500 dark:text-slate-400 text-sm">Daftarkan akun administrator atau anggota sistem.</p>
              </div>

              <form action={handleFormAction} className="space-y-5">
                <div>
                  <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1.5">Nama Lengkap</label>
                  <input
                    type="text"
                    name="name"
                    required
                    className="w-full bg-slate-50 dark:bg-[#111111] dark:text-white border border-slate-200 dark:border-white/5 focus:border-red-500 dark:focus:border-rose-500 focus:ring-4 focus:ring-red-500/10 dark:focus:ring-rose-500/20 rounded-xl p-3 outline-none transition-all"
                    placeholder="John Doe"
                  />
                </div>

                <div>
                  <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1.5">Email</label>
                  <input
                    type="email"
                    name="email"
                    required
                    className="w-full bg-slate-50 dark:bg-[#111111] dark:text-white border border-slate-200 dark:border-white/5 focus:border-red-500 dark:focus:border-rose-500 focus:ring-4 focus:ring-red-500/10 dark:focus:ring-rose-500/20 rounded-xl p-3 outline-none transition-all"
                    placeholder="john@example.com"
                  />
                </div>

                <div>
                  <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1.5">Password</label>
                  <div className="relative">
                    <input
                      type={showPassword ? "text" : "password"}
                      name="password"
                      required
                      className="w-full bg-slate-50 dark:bg-[#111111] dark:text-white border border-slate-200 dark:border-white/5 focus:border-red-500 dark:focus:border-rose-500 focus:ring-4 focus:ring-red-500/10 dark:focus:ring-rose-500/20 rounded-xl p-3 pr-12 outline-none transition-all"
                      minLength={6}
                      placeholder="Minimal 6 karakter"
                      // Tanpa ini, bubble validasi bawaan browser tampil dalam bahasa browsernya
                      // sendiri (bisa Inggris) — pesannya tidak ikut lang="id" di halaman.
                      onInvalid={(e) => {
                        const el = e.currentTarget;
                        el.setCustomValidity(el.validity.tooShort ? "Kata sandi minimal 6 karakter." : "Kata sandi wajib diisi.");
                      }}
                      onInput={(e) => e.currentTarget.setCustomValidity("")}
                    />
                    <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors">
                      {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1.5">Role (Hak Akses)</label>
                  <select
                    name="role"
                    className="w-full bg-slate-50 dark:bg-[#111111] dark:text-white border border-slate-200 dark:border-white/5 focus:border-red-500 dark:focus:border-rose-500 focus:ring-4 focus:ring-red-500/10 dark:focus:ring-rose-500/20 rounded-xl p-3 outline-none transition-all text-slate-700 font-medium cursor-pointer"
                  >
                    <option value="USER">User Biasa</option>
                    <option value="KONTRIBUTOR">Kontributor</option>
                    <option value="ADMIN">Administrator</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1.5">Jabatan (Opsional)</label>
                  <select
                    name="jabatan"
                    className="w-full bg-slate-50 dark:bg-[#111111] dark:text-white border border-slate-200 dark:border-white/5 focus:border-red-500 dark:focus:border-rose-500 focus:ring-4 focus:ring-red-500/10 dark:focus:ring-rose-500/20 rounded-xl p-3 outline-none transition-all text-slate-700 font-medium cursor-pointer"
                  >
                    <option value="">-- Pilih Jabatan --</option>
                    <option value="Ketua Cabang">Ketua Cabang</option>
                    <option value="Wakil Ketua Cabang">Wakil Ketua Cabang</option>
                    <option value="Sekretaris Cabang">Sekretaris Cabang</option>
                    <option value="Bendahara Cabang">Bendahara Cabang</option>
                    <option value="Ketua Bidang">Ketua Bidang</option>
                    <option value="Sekretaris Bidang">Sekretaris Bidang</option>
                    <option value="Anggota Bidang">Anggota Bidang</option>
                    <option value="Anggota Biasa">Anggota Biasa</option>
                    <option value="Alumni/Demisioner">Alumni/Demisioner</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1.5">Bidang (Opsional)</label>
                  <select
                    name="bidang"
                    className="w-full bg-slate-50 dark:bg-[#111111] dark:text-white border border-slate-200 dark:border-white/5 focus:border-red-500 dark:focus:border-rose-500 focus:ring-4 focus:ring-red-500/10 dark:focus:ring-rose-500/20 rounded-xl p-3 outline-none transition-all text-slate-700 font-medium cursor-pointer"
                  >
                    <option value="">-- Pilih Bidang --</option>
                    <option value="Organisasi">Organisasi</option>
                    <option value="Kaderisasi">Kaderisasi</option>
                    <option value="Data dan Informasi">Data dan Informasi</option>
                    <option value="Sosial Masyarakat">Sosial Masyarakat</option>
                    <option value="Kajian dan Isu">Kajian dan Isu</option>
                    <option value="Hubungan Masyarakat">Hubungan Masyarakat</option>
                    <option value="Tidak Ada">Tidak Ada</option>
                  </select>
                </div>

                <div className="flex gap-3 justify-end pt-4">
                  <button
                    type="button"
                    onClick={() => setIsOpen(false)}
                    className="px-5 py-2.5 rounded-xl font-semibold text-slate-600 dark:text-slate-300 bg-slate-50 dark:bg-white/5 hover:bg-slate-100 dark:hover:bg-white/10 transition-colors"
                  >
                    Batal
                  </button>
                  <SubmitButton variant="destructive" className="px-5 py-2.5">
                    Daftarkan Akun
                  </SubmitButton>
                </div>
              </form>
            </div>
          </div>,
          document.body,
        )}
    </>
  );
}
