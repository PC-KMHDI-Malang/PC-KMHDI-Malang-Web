"use client";

import { useState, useMemo } from "react";
import { EditUserModal } from "@/components/admin/EditUserModal";
import { SubmitWithConfirm } from "@/components/ui/SubmitWithConfirm";
import { Mail, Calendar, Briefcase, Shield, Trash2 } from "lucide-react";

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  jabatan?: string | null;
  bidang?: string | null;
  createdAt: string;
}

interface UserTableProps {
  users: User[];
  editAction: (formData: FormData) => Promise<{ error?: string; success?: boolean; message?: string }>;
  deleteAction: (formData: FormData) => Promise<{ error?: string; success?: boolean; message?: string }>;
  currentUserEmail?: string;
}

export function UserTable({ users, editAction, deleteAction, currentUserEmail }: UserTableProps) {
  const [sortBy, setSortBy] = useState<"createdAt" | "name" | "jabatan" | "bidang">("createdAt");
  const [filterJabatan, setFilterJabatan] = useState<string>("");
  const [filterBidang, setFilterBidang] = useState<string>("");

  const filteredAndSortedUsers = useMemo(() => {
    let result = [...users];

    // Filter by Jabatan
    if (filterJabatan) {
      result = result.filter((u) => u.jabatan === filterJabatan);
    }

    // Filter by Bidang
    if (filterBidang) {
      result = result.filter((u) => u.bidang === filterBidang);
    }

    // Sort
    return result.sort((a, b) => {
      if (sortBy === "createdAt") {
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(); // Newest first
      }

      const valA = (a[sortBy] || "").toLowerCase();
      const valB = (b[sortBy] || "").toLowerCase();

      if (valA < valB) return -1;
      if (valA > valB) return 1;
      return 0;
    });
  }, [users, sortBy, filterJabatan, filterBidang]);

  return (
    <div className="bg-white dark:bg-[#111114] p-4 sm:p-6 lg:p-8 rounded-2xl sm:rounded-3xl shadow-lg border border-slate-200/80 dark:border-white/10 transition-colors">
      {/* 1. Header & Filter Bar */}
      <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between mb-6 sm:mb-8 pb-4 border-b border-slate-100 dark:border-white/5 gap-4">
        <div className="flex items-center gap-2.5">
          <h2 className="text-lg sm:text-xl font-bold text-slate-800 dark:text-white flex items-center gap-2">
            <span className="w-2 h-6 bg-slate-800 dark:bg-slate-300 rounded-full inline-block"></span>
            Daftar Akun
          </h2>
          <span className="px-2.5 py-1 bg-slate-100 dark:bg-white/5 text-slate-600 dark:text-slate-300 rounded-full text-xs sm:text-sm font-semibold">{users.length} Terdaftar</span>
        </div>

        <div className="flex flex-wrap sm:flex-nowrap items-center gap-2 w-full lg:w-auto">
          {/* Filter Jabatan */}
          <select
            value={filterJabatan}
            onChange={(e) => {
              setFilterJabatan(e.target.value);
            }}
            className="w-full sm:w-auto bg-slate-50 dark:bg-[#111114] dark:text-white border border-slate-200 dark:border-white/5 rounded-xl px-3 py-2 text-xs sm:text-sm outline-none focus:border-red-500 focus:ring-2 focus:ring-red-500/20 transition-all font-medium cursor-pointer"
          >
            <option value="">Semua Jabatan</option>
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

          {/* Filter Bidang */}
          <select
            value={filterBidang}
            onChange={(e) => {
              setFilterBidang(e.target.value);
            }}
            className="w-full sm:w-auto bg-slate-50 dark:bg-[#111114] dark:text-white border border-slate-200 dark:border-white/5 rounded-xl px-3 py-2 text-xs sm:text-sm outline-none focus:border-red-500 focus:ring-2 focus:ring-red-500/20 transition-all font-medium cursor-pointer"
          >
            <option value="">Semua Bidang</option>
            <option value="Organisasi">Organisasi</option>
            <option value="Kaderisasi">Kaderisasi</option>
            <option value="Data dan Informasi">Data dan Informasi</option>
            <option value="Sosial Masyarakat">Sosial Masyarakat</option>
            <option value="Litbang">Litbang</option>
            <option value="Hubungan Masyarakat">Hubungan Masyarakat</option>
            <option value="Tidak Ada">Tidak Ada</option>
          </select>

          {/* Sort */}
          <select
            value={sortBy}
            onChange={(e) => {
              setSortBy(e.target.value as any);
            }}
            className="w-full sm:w-auto bg-slate-50 dark:bg-[#111114] dark:text-white border border-slate-200 dark:border-white/5 rounded-xl px-3 py-2 text-xs sm:text-sm outline-none focus:border-red-500 focus:ring-2 focus:ring-red-500/20 transition-all font-medium cursor-pointer"
          >
            <option value="createdAt">Sort: Terbaru</option>
            <option value="name">Sort: Nama (A-Z)</option>
            <option value="jabatan">Sort: Jabatan</option>
            <option value="bidang">Sort: Bidang</option>
          </select>

          {(filterJabatan || filterBidang) && (
            <button
              onClick={() => {
                setFilterJabatan("");
                setFilterBidang("");
              }}
              className="w-full sm:w-auto px-3 py-2 text-xs sm:text-sm font-bold text-red-600 dark:text-rose-500 hover:bg-red-50 dark:hover:bg-rose-500/10 rounded-xl transition-colors text-center"
            >
              Hapus Filter
            </button>
          )}
        </div>
      </div>

      {/* 2. Tampilan Mobile: Kartu Responsif (Khusus Layar HP < md) */}
      {/* max-h + overflow-y-auto gantinya pagination — daftarnya discroll sendiri begitu
          melewati tinggi ini, bukan dipotong-potong jadi beberapa halaman. */}
      <div className="block md:hidden max-h-[70vh] overflow-y-auto space-y-3.5 pr-1">
        {filteredAndSortedUsers.length === 0 ? (
          <div className="py-12 text-center text-slate-500 dark:text-slate-400">Tidak ada user ditemukan.</div>
        ) : (
          filteredAndSortedUsers.map((u) => (
            <div key={u.id} className="rounded-2xl border border-slate-200 dark:border-white/10 bg-slate-50/70 dark:bg-white/5 p-4 space-y-3 shadow-xs">
              {/* Header Kartu: Nama & Role */}
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0 flex-1">
                  <h3 className="font-bold text-base text-slate-900 dark:text-white truncate">{u.name}</h3>
                  <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400 mt-0.5 truncate">
                    <Mail size={13} className="flex-shrink-0" />
                    <span className="truncate">{u.email}</span>
                  </div>
                </div>

                <span
                  className={`flex-shrink-0 px-2.5 py-1 text-[10px] rounded-full font-bold tracking-wider uppercase ${
                    u.role === "ADMIN" ? "bg-red-600 dark:bg-rose-600 text-white shadow-xs" : "bg-slate-200 dark:bg-white/10 text-slate-700 dark:text-slate-300"
                  }`}
                >
                  {u.role}
                </span>
              </div>

              {/* Posisi & Tanggal */}
              <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-200/60 dark:border-white/5 text-xs">
                <div>
                  <span className="text-[10px] font-semibold uppercase text-slate-400 dark:text-slate-500 block mb-0.5">Posisi / Jabatan</span>
                  {u.jabatan || u.bidang ? (
                    <div className="flex flex-col font-medium text-slate-700 dark:text-slate-300">
                      {u.jabatan && <span className="font-bold">{u.jabatan}</span>}
                      {u.bidang && u.bidang !== "Tidak Ada" && <span className="text-[11px] text-slate-500">{u.bidang}</span>}
                    </div>
                  ) : (
                    <span className="text-slate-400 italic text-[11px]">Belum diatur</span>
                  )}
                </div>

                <div>
                  <span className="text-[10px] font-semibold uppercase text-slate-400 dark:text-slate-500 block mb-0.5">Terdaftar</span>
                  <div className="flex items-center gap-1 text-slate-600 dark:text-slate-400 text-xs">
                    <Calendar size={12} className="flex-shrink-0 text-slate-400" />
                    <span>
                      {new Date(u.createdAt).toLocaleDateString("id-ID", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      })}
                    </span>
                  </div>
                </div>
              </div>

              {/* Aksi */}
              <div className="pt-2 border-t border-slate-200/60 dark:border-white/5 flex items-center justify-end gap-2">
                <EditUserModal
                  user={{
                    id: u.id,
                    name: u.name,
                    email: u.email,
                    role: u.role,
                    jabatan: u.jabatan,
                    bidang: u.bidang,
                  }}
                  action={editAction}
                />

                {currentUserEmail !== u.email ? (
                  <SubmitWithConfirm
                    id={u.id}
                    action={deleteAction}
                    modalTitle="Hapus User?"
                    modalDesc={`Anda yakin ingin menghapus akun ${u.name} (${u.email})?`}
                    buttonElement={
                      <div className="text-red-600 dark:text-rose-400 font-bold hover:bg-red-50 dark:hover:bg-rose-950/50 px-3 py-1.5 rounded-lg transition-colors text-xs flex items-center gap-1 border border-red-200 dark:border-rose-900/30">
                        <Trash2 size={13} />
                        Hapus
                      </div>
                    }
                  />
                ) : (
                  <span className="text-slate-400 dark:text-slate-500 text-xs italic px-2 py-1">Akun Anda</span>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {/* 3. Tampilan Desktop / Tablet: Tabel Lengkap (Layar >= md) */}
      <div className="hidden md:block overflow-hidden rounded-2xl bg-white dark:bg-white/5 shadow-sm dark:shadow-none border border-slate-100 dark:border-white/5">
        {/* max-h + overflow-y-auto gantinya pagination — header dibuat sticky (dengan bg solid,
            bukan transparan) supaya tetap kelihatan saat isi tabelnya discroll. */}
        <div className="max-h-[70vh] overflow-auto">
          <table className="min-w-[760px] w-full border-collapse">
            <thead className="sticky top-0 z-10 bg-white dark:bg-[#1a1a1e]">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest border-b border-slate-100 dark:border-white/5">Nama</th>
                <th className="px-6 py-4 text-left text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest border-b border-slate-100 dark:border-white/5">Email</th>
                <th className="px-6 py-4 text-left text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest border-b border-slate-100 dark:border-white/5">Posisi</th>
                <th className="px-6 py-4 text-left text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest border-b border-slate-100 dark:border-white/5">Role</th>
                <th className="px-6 py-4 text-left text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest border-b border-slate-100 dark:border-white/5">Tanggal Daftar</th>
                <th className="px-6 py-4 text-right text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest border-b border-slate-100 dark:border-white/5">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {filteredAndSortedUsers.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-slate-500 dark:text-slate-400">
                    Tidak ada user ditemukan.
                  </td>
                </tr>
              ) : (
                filteredAndSortedUsers.map((u) => (
                  <tr key={u.id} className="group transition-all duration-300 hover:bg-slate-50 dark:hover:bg-white/5 border-b border-slate-50 dark:border-white/5 last:border-0">
                    <td className="px-6 py-4 text-sm font-bold text-slate-800 dark:text-white">{u.name}</td>
                    <td className="px-6 py-4 text-sm font-medium text-slate-600 dark:text-slate-400">{u.email}</td>
                    <td className="px-6 py-4 text-sm font-medium text-slate-600 dark:text-slate-400">
                      {u.jabatan || u.bidang ? (
                        <div className="flex flex-col">
                          {u.jabatan && <span className="font-bold text-slate-700 dark:text-slate-300">{u.jabatan}</span>}
                          {u.bidang && u.bidang !== "Tidak Ada" && <span className="text-xs text-slate-500">{u.bidang}</span>}
                        </div>
                      ) : (
                        <span className="text-slate-400 italic text-xs">Belum diatur</span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`px-3 py-1 text-xs rounded-full font-bold tracking-wider uppercase shadow-sm ${
                          u.role === "ADMIN" ? "bg-red-600 dark:bg-rose-600 text-white" : "bg-slate-200 dark:bg-white/10 text-slate-700 dark:text-slate-300"
                        }`}
                      >
                        {u.role}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm font-medium text-slate-400 dark:text-slate-500">
                      {new Date(u.createdAt).toLocaleDateString("id-ID", {
                        day: "numeric",
                        month: "long",
                        year: "numeric",
                      })}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-end gap-2">
                        <EditUserModal
                          user={{
                            id: u.id,
                            name: u.name,
                            email: u.email,
                            role: u.role,
                            jabatan: u.jabatan,
                            bidang: u.bidang,
                          }}
                          action={editAction}
                        />

                        {currentUserEmail !== u.email ? (
                          <SubmitWithConfirm
                            id={u.id}
                            action={deleteAction}
                            modalTitle="Hapus User?"
                            modalDesc={`Anda yakin ingin menghapus akun ${u.name} (${u.email})?`}
                            buttonElement={
                              <div className="text-red-500 dark:text-rose-400 font-bold hover:text-red-700 dark:hover:text-rose-300 hover:bg-red-50 dark:hover:bg-rose-950/50 px-3 py-1.5 rounded-lg transition-colors text-sm flex items-center gap-1.5 cursor-pointer">
                                <Trash2 size={15} />
                                Hapus
                              </div>
                            }
                          />
                        ) : (
                          <span className="text-slate-300 dark:text-slate-600 text-sm font-medium italic px-3 py-1.5">Akun Anda</span>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
}
