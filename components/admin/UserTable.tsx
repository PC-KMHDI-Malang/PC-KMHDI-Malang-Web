"use client";

import { useState, useMemo } from "react";
import { EditUserModal } from "@/components/admin/EditUserModal";
import { SubmitWithConfirm } from "@/components/ui/SubmitWithConfirm";

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
  editAction: (formData: FormData) => void;
  deleteAction: (formData: FormData) => void;
  currentUserEmail?: string;
}

export function UserTable({ users, editAction, deleteAction, currentUserEmail }: UserTableProps) {
  const [sortBy, setSortBy] = useState<"createdAt" | "name" | "jabatan" | "bidang">("createdAt");
  const [filterJabatan, setFilterJabatan] = useState<string>("");
  const [filterBidang, setFilterBidang] = useState<string>("");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

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

  const totalPages = Math.ceil(filteredAndSortedUsers.length / itemsPerPage);
  const paginatedUsers = filteredAndSortedUsers.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  return (
    <div className="bg-white/70 dark:bg-slate-900/70 backdrop-blur-xl p-8 rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:shadow-none border border-slate-100 dark:border-white/5 transition-colors">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-8 pb-4 border-b border-slate-100 dark:border-white/5 gap-4">
        <div className="flex items-center gap-2">
          <h2 className="text-xl font-bold text-slate-800 dark:text-white flex items-center gap-2">
            <span className="w-2 h-6 bg-slate-800 dark:bg-slate-300 rounded-full inline-block"></span>
            Daftar Akun
          </h2>
          <span className="px-3 py-1 bg-slate-100 dark:bg-white/5 text-slate-600 dark:text-slate-300 rounded-full text-sm font-semibold">{users.length} Terdaftar</span>
        </div>

        <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
          {/* Filter Jabatan */}
          <select
            value={filterJabatan}
            onChange={(e) => {
              setFilterJabatan(e.target.value);
              setCurrentPage(1);
            }}
            className="w-full sm:w-auto bg-slate-50 dark:bg-[#111111] dark:text-white border border-slate-200 dark:border-white/5 rounded-xl p-2.5 text-sm outline-none focus:border-red-500 focus:ring-2 focus:ring-red-500/20 transition-all font-medium cursor-pointer"
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
              setCurrentPage(1);
            }}
            className="w-full sm:w-auto bg-slate-50 dark:bg-[#111111] dark:text-white border border-slate-200 dark:border-white/5 rounded-xl p-2.5 text-sm outline-none focus:border-red-500 focus:ring-2 focus:ring-red-500/20 transition-all font-medium cursor-pointer"
          >
            <option value="">Semua Bidang</option>
            <option value="Organisasi">Organisasi</option>
            <option value="Kaderisasi">Kaderisasi</option>
            <option value="Data dan Informasi">Data dan Informasi</option>
            <option value="Sosial Masyarakat">Sosial Masyarakat</option>
            <option value="Kajian dan Isu">Kajian dan Isu</option>
            <option value="Hubungan Masyarakat">Hubungan Masyarakat</option>
            <option value="Tidak Ada">Tidak Ada</option>
          </select>

          <select
            value={sortBy}
            onChange={(e) => {
              setSortBy(e.target.value as any);
              setCurrentPage(1);
            }}
            className="w-full sm:w-auto bg-slate-50 dark:bg-[#111111] dark:text-white border border-slate-200 dark:border-white/5 rounded-xl p-2.5 text-sm outline-none focus:border-red-500 focus:ring-2 focus:ring-red-500/20 transition-all font-medium cursor-pointer"
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
                setCurrentPage(1);
              }}
              className="w-full sm:w-auto px-4 py-2.5 text-sm font-bold text-red-600 dark:text-rose-500 hover:bg-red-50 dark:hover:bg-rose-500/10 rounded-xl transition-colors"
            >
              Hapus Filter
            </button>
          )}
        </div>
      </div>

      <div className="overflow-hidden rounded-2xl bg-white dark:bg-slate-900/40 shadow-sm dark:shadow-none border border-slate-100 dark:border-white/5">
        <div className="overflow-x-auto">
          <table className="min-w-full border-collapse">
            <thead>
              <tr>
                <th className="px-6 py-5 text-left text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest border-b border-slate-100 dark:border-white/5">Nama</th>
                <th className="px-6 py-5 text-left text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest border-b border-slate-100 dark:border-white/5">Email</th>
                <th className="px-6 py-5 text-left text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest border-b border-slate-100 dark:border-white/5">Posisi</th>
                <th className="px-6 py-5 text-left text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest border-b border-slate-100 dark:border-white/5">Role</th>
                <th className="px-6 py-5 text-left text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest border-b border-slate-100 dark:border-white/5">Tanggal Daftar</th>
                <th className="px-6 py-5 text-right text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest border-b border-slate-100 dark:border-white/5">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {paginatedUsers.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-slate-500">
                    Tidak ada user ditemukan.
                  </td>
                </tr>
              ) : (
                paginatedUsers.map((u) => (
                  <tr key={u.id} className="group transition-all duration-300 hover:bg-slate-50 dark:hover:bg-white/5 border-b border-slate-50 dark:border-white/5 last:border-0">
                    <td className="px-6 py-5 text-sm font-bold text-slate-800 dark:text-white">{u.name}</td>
                    <td className="px-6 py-5 text-sm font-medium text-slate-600 dark:text-slate-400">{u.email}</td>
                    <td className="px-6 py-5 text-sm font-medium text-slate-600 dark:text-slate-400">
                      {u.jabatan || u.bidang ? (
                        <div className="flex flex-col">
                          {u.jabatan && <span className="font-bold text-slate-700 dark:text-slate-300">{u.jabatan}</span>}
                          {u.bidang && u.bidang !== "Tidak Ada" && <span className="text-xs text-slate-500">{u.bidang}</span>}
                        </div>
                      ) : (
                        <span className="text-slate-400 italic text-xs">Belum diatur</span>
                      )}
                    </td>
                    <td className="px-6 py-5">
                      <span
                        className={`px-3 py-1 text-xs rounded-full font-bold tracking-wider uppercase shadow-sm ${
                          u.role === "ADMIN" ? "bg-red-600 dark:bg-rose-600 text-white" : "bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300"
                        }`}
                      >
                        {u.role}
                      </span>
                    </td>
                    <td className="px-6 py-5 text-sm font-medium text-slate-400 dark:text-slate-500">{new Date(u.createdAt).toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" })}</td>
                    <td className="px-6 py-5">
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
                              <div className="text-red-500 dark:text-rose-400 font-bold hover:text-red-700 dark:hover:text-rose-300 hover:bg-red-50 dark:hover:bg-rose-950/50 px-3 py-1.5 rounded-lg transition-colors text-sm flex items-center gap-1.5">
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path>
                                </svg>
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

      {totalPages > 1 && (
        <div className="mt-8 flex justify-center items-center gap-2">
          <button
            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
            disabled={currentPage === 1}
            className="px-4 py-2 rounded-xl text-sm font-bold bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 shadow-sm border border-slate-200 dark:border-white/10 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
          >
            Sebelumnya
          </button>

          <div className="flex items-center gap-1">
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((pageNum) => (
              <button
                key={pageNum}
                onClick={() => setCurrentPage(pageNum)}
                className={`w-10 h-10 rounded-xl text-sm font-bold transition-colors ${
                  currentPage === pageNum
                    ? "bg-red-600 dark:bg-rose-600 text-white shadow-md shadow-red-600/20"
                    : "bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-white/10 hover:bg-slate-50 dark:hover:bg-slate-700"
                }`}
              >
                {pageNum}
              </button>
            ))}
          </div>

          <button
            onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
            disabled={currentPage === totalPages}
            className="px-4 py-2 rounded-xl text-sm font-bold bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 shadow-sm border border-slate-200 dark:border-white/10 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
          >
            Berikutnya
          </button>
        </div>
      )}
    </div>
  );
}
