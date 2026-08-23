"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { X, Edit2 } from "lucide-react";

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
}

interface EditUserModalProps {
  user: User;
  action: (formData: FormData) => void;
}

export function EditUserModal({ user, action }: EditUserModalProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isRendered, setIsRendered] = useState(false);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => setIsRendered(true), 0);
      setTimeout(() => setIsVisible(true), 10);
      document.body.style.overflow = 'hidden';
    } else {
      setIsVisible(false);
      const timer = setTimeout(() => {
        setIsRendered(false);
        document.body.style.overflow = 'unset';
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
        className="text-slate-600 dark:text-slate-400 font-bold hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/10 px-3 py-1.5 rounded-lg transition-colors text-sm flex items-center justify-center gap-1.5"
      >
        <Edit2 size={14} />
        Edit
      </button>

      {isRendered && createPortal(
        <div className="fixed inset-y-0 right-0 left-0 md:left-64 z-[100] flex items-center justify-center p-4 text-left">
          {/* Backdrop */}
          <div 
            className={`absolute inset-0 bg-slate-900/40 backdrop-blur-md transition-opacity duration-300 ${
              isVisible ? "opacity-100" : "opacity-0"
            }`}
            onClick={() => setIsOpen(false)}
          />
          
          {/* Modal Card */}
          <div 
            className={`relative w-full max-w-xl bg-white dark:bg-slate-900 rounded-3xl shadow-2xl p-8 transform transition-all duration-300 border border-slate-100 dark:border-white/5 ${
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
              <h3 className="text-2xl font-bold text-slate-800 dark:text-white mb-2">Edit User</h3>
              <p className="text-slate-500 dark:text-slate-400 text-sm">Ubah informasi akun untuk {user.name}.</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              <input type="hidden" name="id" value={user.id} />
              
              <div>
                <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1.5">Nama Lengkap</label>
                <input type="text" name="name" defaultValue={user.name} required className="w-full bg-slate-50 dark:bg-[#111111] dark:text-white border border-slate-200 dark:border-white/5 focus:border-red-500 dark:focus:border-rose-500 focus:ring-4 focus:ring-red-500/10 dark:focus:ring-rose-500/20 rounded-xl p-3 outline-none transition-all" />
              </div>
              
              <div>
                <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1.5">Email</label>
                <input type="email" name="email" defaultValue={user.email} required className="w-full bg-slate-50 dark:bg-[#111111] dark:text-white border border-slate-200 dark:border-white/5 focus:border-red-500 dark:focus:border-rose-500 focus:ring-4 focus:ring-red-500/10 dark:focus:ring-rose-500/20 rounded-xl p-3 outline-none transition-all" />
              </div>
              
              <div>
                <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1.5">Password Baru <span className="text-slate-400 font-normal">(Opsional)</span></label>
                <input type="password" name="password" className="w-full bg-slate-50 dark:bg-[#111111] dark:text-white border border-slate-200 dark:border-white/5 focus:border-red-500 dark:focus:border-rose-500 focus:ring-4 focus:ring-red-500/10 dark:focus:ring-rose-500/20 rounded-xl p-3 outline-none transition-all" minLength={6} placeholder="Kosongkan jika tidak ingin mengubah password" />
              </div>
              
              <div>
                <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1.5">Role (Hak Akses)</label>
                <select name="role" defaultValue={user.role} className="w-full bg-slate-50 dark:bg-[#111111] dark:text-white border border-slate-200 dark:border-white/5 focus:border-red-500 dark:focus:border-rose-500 focus:ring-4 focus:ring-red-500/10 dark:focus:ring-rose-500/20 rounded-xl p-3 outline-none transition-all text-slate-700 font-medium cursor-pointer">
                  <option value="USER">User Biasa</option>
                  <option value="ADMIN">Administrator</option>
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
                <button 
                  type="submit"
                  className="px-5 py-2.5 rounded-xl font-semibold text-white bg-slate-900 dark:bg-white dark:text-slate-900 hover:bg-black dark:hover:bg-slate-200 transition-colors shadow-sm"
                >
                  Simpan Perubahan
                </button>
              </div>
            </form>
          </div>
        </div>
      , document.body)}
    </>
  );
}
