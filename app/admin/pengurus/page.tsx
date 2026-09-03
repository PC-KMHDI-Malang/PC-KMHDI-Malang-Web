import { supabaseAdmin } from "@/lib/supabase";
import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import Image from "next/image";
import { AddPengurusModal } from "@/components/admin/AddPengurusModal";
import { EditPengurusModal } from "@/components/admin/EditPengurusModal";
import { SubmitWithConfirm } from "@/components/ui/SubmitWithConfirm";
import { deleteFromBucketByUrl } from "@/lib/storage";
import { allMembers, Member } from "@/data/organization";
import { Users, GraduationCap, Trash2, Sparkles, AlertCircle, HardDrive, Hash, Info, CheckCircle2 } from "lucide-react";

export default async function AdminPengurusPage() {
  const session = await auth();

  if (session?.user?.role !== "ADMIN") {
    return (
      <div className="p-8">
        <h1 className="text-2xl font-bold text-red-600 dark:text-rose-500">Akses Ditolak</h1>
        <p className="mt-2 text-gray-700 dark:text-gray-300">Halaman ini hanya dapat diakses oleh Administrator.</p>
      </div>
    );
  }

  // Ambil data pengurus dari database Supabase
  const { data: dbMembers, error: dbError } = await supabaseAdmin.from("Pengurus").select("*").order("orderIndex", { ascending: true });

  // Ambil data file & kapasitas storage dari bucket organization-photos
  let storageFilesCount = 0;
  let storageTotalBytes = 0;
  try {
    const { data: storageFiles } = await supabaseAdmin.storage.from("organization-photos").list("", { limit: 1000 });
    if (storageFiles) {
      storageFilesCount = storageFiles.length;
      storageTotalBytes = storageFiles.reduce((acc, file) => acc + (file.metadata?.size || 0), 0);
    }
  } catch (err) {
    console.error("Gagal mengambil data storage:", err);
  }

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return "0 B";
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  };

  const totalMaxBytes = 50 * 1024 * 1024; // 50 MB batas kapasitas bucket Supabase
  const usedPercent = Math.min(100, parseFloat(((storageTotalBytes / totalMaxBytes) * 100).toFixed(2)));

  const members: Member[] = (dbMembers || []).map((m) => ({
    id: m.id,
    name: m.name,
    role: m.role,
    department: m.department,
    level: m.level || "staf",
    campus: m.campus,
    major: m.major,
    imageUrl: m.imageUrl,
    instagram: m.instagram || "pc.kmhdimalang",
    orderIndex: m.orderIndex || 0,
    period: m.period || "2024 - 2026",
  }));

  // Server Action: Tambah Pengurus
  async function addPengurusAction(formData: FormData) {
    "use server";
    const name = formData.get("name") as string;
    const role = formData.get("role") as string;
    const department = formData.get("department") as string;
    const level = (formData.get("level") as string) || "staf";
    const campus = formData.get("campus") as string;
    const major = formData.get("major") as string;
    const orderIndex = parseInt((formData.get("orderIndex") as string) || "10", 10);
    const imageUrl = (formData.get("imageUrl") as string) || null;
    const instagramRaw = (formData.get("instagram") as string) || "";
    const instagram = instagramRaw.trim().replace(/^@/, "") || "pc.kmhdimalang";

    if (!name || !role || !department || !campus || !major) return;

    const insertPayload: Record<string, unknown> = {
      name,
      role,
      department,
      level,
      campus,
      major,
      orderIndex: isNaN(orderIndex) ? 10 : orderIndex,
      period: "2024 - 2026",
      imageUrl,
      instagram,
    };

    let { error: insertErr } = await supabaseAdmin.from("Pengurus").insert([insertPayload]);
    if (insertErr && insertErr.message.includes("instagram")) {
      delete insertPayload.instagram;
      const res = await supabaseAdmin.from("Pengurus").insert([insertPayload]);
      insertErr = res.error;
    }
    if (insertErr) {
      throw new Error("Gagal menambah pengurus: " + insertErr.message);
    }

    revalidatePath("/admin/pengurus");
    revalidatePath("/profil");
  }

  // Server Action: Edit Pengurus
  async function editPengurusAction(formData: FormData) {
    "use server";
    const id = formData.get("id") as string;
    const name = formData.get("name") as string;
    const role = formData.get("role") as string;
    const department = formData.get("department") as string;
    const level = (formData.get("level") as string) || "staf";
    const campus = formData.get("campus") as string;
    const major = formData.get("major") as string;
    const orderIndex = parseInt((formData.get("orderIndex") as string) || "10", 10);
    const imageUrl = (formData.get("imageUrl") as string) || null;
    const instagramRaw = (formData.get("instagram") as string) || "";
    const instagram = instagramRaw.trim().replace(/^@/, "") || "pc.kmhdimalang";

    if (!id || !name || !role) return;

    const updatePayload: Record<string, unknown> = {
      name,
      role,
      department,
      level,
      campus,
      major,
      orderIndex: isNaN(orderIndex) ? 10 : orderIndex,
      instagram,
      updatedAt: new Date().toISOString(),
    };
    if (imageUrl) {
      updatePayload.imageUrl = imageUrl;
    }

    let { error: updateErr } = await supabaseAdmin.from("Pengurus").update(updatePayload).eq("id", id);
    if (updateErr && updateErr.message.includes("instagram")) {
      delete updatePayload.instagram;
      const res = await supabaseAdmin.from("Pengurus").update(updatePayload).eq("id", id);
      updateErr = res.error;
    }
    if (updateErr) {
      throw new Error("Gagal update data pengurus: " + updateErr.message);
    }

    revalidatePath("/admin/pengurus");
    revalidatePath("/profil");
  }

  // Server Action: Hapus Pengurus
  async function deletePengurusAction(formData: FormData) {
    "use server";
    const id = formData.get("id") as string;
    if (!id) return;

    const { data: member } = await supabaseAdmin.from("Pengurus").select("imageUrl").eq("id", id).single();
    await supabaseAdmin.from("Pengurus").delete().eq("id", id);

    if (member?.imageUrl) {
      await deleteFromBucketByUrl("organization-photos", member.imageUrl);
    }

    revalidatePath("/admin/pengurus");
    revalidatePath("/profil");
  }

  // Server Action: Impor Data Awal Otomatis (Seed) jika masih kosong
  async function seedInitialDataAction() {
    "use server";
    const payload = allMembers.map((m) => ({
      name: m.name,
      role: m.role,
      department: m.department,
      level: m.level,
      campus: m.campus,
      major: m.major,
      imageUrl: m.imageUrl || null,
      orderIndex: m.orderIndex,
      period: m.period,
    }));

    await supabaseAdmin.from("Pengurus").insert(payload);

    revalidatePath("/admin/pengurus");
    revalidatePath("/profil");
  }

  const deptLabels: Record<string, string> = {
    bph: "Badan Pengurus Harian",
    organisasi: "Bidang Organisasi",
    kaderisasi: "Bidang Kaderisasi",
    litbang: "Bidang Litbang",
    sosmas: "Bidang Sosmas",
    ddi: "Bidang DDI",
    kewirausahaan: "Lembaga Kewirausahaan",
  };

  return (
    <div className="max-w-7xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-slate-900 dark:text-white">Struktur Pengurus Organisasi</h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm sm:text-base mt-1">Kelola data kader, bagan kepengurusan, dan unggah foto resmi untuk halaman profil.</p>
        </div>

        <div className="flex items-center gap-3">
          {members.length === 0 && !dbError && (
            <form action={seedInitialDataAction}>
              <button
                type="submit"
                className="px-4 py-2.5 rounded-xl border border-amber-300 dark:border-amber-700 bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:text-amber-200 text-xs font-bold hover:bg-amber-100 transition flex items-center gap-2 cursor-pointer shadow-xs"
              >
                <Sparkles size={14} />
                <span>Muat Data Awal</span>
              </button>
            </form>
          )}

          <AddPengurusModal action={addPengurusAction} />
        </div>
      </div>

      {/* Peringatan Jika Tabel Belum Dibuat di Supabase */}
      {dbError && (
        <div className="p-6 rounded-2xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/40 text-amber-900 dark:text-amber-200 space-y-2">
          <div className="flex items-center gap-2 font-bold text-sm">
            <AlertCircle size={18} className="text-amber-600 shrink-0" />
            <span>Tabel Database &ldquo;Pengurus&rdquo; Belum Dibuat di Supabase</span>
          </div>
          <p className="text-xs text-amber-800/80 dark:text-amber-200/80 leading-relaxed">
            Silakan buka <strong>Supabase Dashboard &gt; SQL Editor</strong>, lalu salin dan jalankan skrip migrasi yang telah disiapkan di file:{" "}
            <code className="px-1.5 py-0.5 rounded bg-amber-100 dark:bg-amber-900/60 font-mono text-[11px]">supabase/migrations/006_create_pengurus_table.sql</code>. Setelah itu, muat ulang halaman ini.
          </p>
        </div>
      )}

      {/* 2 KARTU INFORMASI: STATUS STORAGE & PANDUAN PENOMORAN */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Card 1: Kapasitas Storage Bucket organization-photos */}
        <div className="lg:col-span-5 rounded-3xl border border-slate-200/90 dark:border-white/10 bg-white dark:bg-[#121215] p-6 shadow-sm flex flex-col justify-between space-y-4">
          <div>
            <div className="flex items-center justify-between gap-2 mb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-red-50 dark:bg-red-950/40 text-red-600 dark:text-red-400 flex items-center justify-center">
                  <HardDrive size={17} />
                </div>
                <div>
                  <h3 className="font-bold text-slate-800 dark:text-white text-sm">Storage Foto Profil</h3>
                  <p className="text-[11px] text-slate-400 font-mono">bucket: organization-photos</p>
                </div>
              </div>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/40">Aktif (Public)</span>
            </div>

            <div className="mt-4 space-y-2">
              <div className="flex justify-between items-baseline text-xs">
                <span className="text-slate-500 dark:text-slate-400">Total File Foto:</span>
                <span className="font-bold text-slate-800 dark:text-white">{storageFilesCount} foto terunggah</span>
              </div>

              <div className="flex justify-between items-baseline text-xs">
                <span className="text-slate-500 dark:text-slate-400">Kapasitas Terpakai:</span>
                <span className="font-bold text-slate-800 dark:text-white">
                  {formatBytes(storageTotalBytes)} <span className="text-slate-400 font-normal">/ 50 MB</span>
                </span>
              </div>

              {/* Progress Bar */}
              <div className="w-full bg-slate-100 dark:bg-white/5 h-2.5 rounded-full overflow-hidden mt-2">
                <div className="bg-gradient-to-r from-red-600 to-rose-500 h-full rounded-full transition-all duration-500" style={{ width: `${Math.max(1, usedPercent)}%` }} />
              </div>

              <div className="flex justify-between items-center text-[10px] text-slate-400 pt-0.5">
                <span>{usedPercent}% terpakai</span>
                <span>Maks. 2 MB / foto</span>
              </div>
            </div>
          </div>

          <div className="pt-3 border-t border-slate-100 dark:border-white/5 text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
            <CheckCircle2 size={13} className="text-red-500 shrink-0" />
            <span>Format foto didukung: JPG, PNG, WEBP dengan rasio pasfoto resmi.</span>
          </div>
        </div>

        {/* Card 2: Panduan Alokasi Nomor Urut */}
        <div className="lg:col-span-7 rounded-3xl border border-slate-200/90 dark:border-white/10 bg-white dark:bg-[#121215] p-6 shadow-sm flex flex-col justify-between space-y-4">
          <div>
            <div className="flex items-center justify-between gap-2 mb-2">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-red-50 dark:bg-red-950/40 text-red-600 dark:text-red-400 flex items-center justify-center">
                  <Hash size={17} />
                </div>
                <div>
                  <h3 className="font-bold text-slate-800 dark:text-white text-sm">Panduan Alokasi Nomor Urut</h3>
                  <p className="text-[11px] text-slate-400">Sistem alokasi blok angka (kelipatan 10) per departemen</p>
                </div>
              </div>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 dark:bg-white/5 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-white/10">Number Spacing</span>
            </div>

            <p className="text-xs text-slate-600 dark:text-slate-300 mt-2 leading-relaxed">
              Nomor urut menentukan posisi tampil di bagan pohon &amp; katalog kader. Nomor diberi jeda antar-bidang agar admin dapat menyisipkan kader baru tanpa menggeser nomor pengurus lainnya:
            </p>

            {/* Grid Blok Penomoran */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-3">
              <div className="p-2 rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-100 dark:border-white/5 text-center">
                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">BPH Cabang</span>
                <span className="text-xs font-black text-red-600 dark:text-red-400">1 - 5</span>
              </div>
              <div className="p-2 rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-100 dark:border-white/5 text-center">
                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Organisasi</span>
                <span className="text-xs font-black text-slate-800 dark:text-white">10 - 19</span>
              </div>
              <div className="p-2 rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-100 dark:border-white/5 text-center">
                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Kaderisasi</span>
                <span className="text-xs font-black text-slate-800 dark:text-white">20 - 29</span>
              </div>
              <div className="p-2 rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-100 dark:border-white/5 text-center">
                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Litbang</span>
                <span className="text-xs font-black text-slate-800 dark:text-white">30 - 39</span>
              </div>
              <div className="p-2 rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-100 dark:border-white/5 text-center">
                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Sosmas</span>
                <span className="text-xs font-black text-slate-800 dark:text-white">40 - 49</span>
              </div>
              <div className="p-2 rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-100 dark:border-white/5 text-center">
                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">DDI</span>
                <span className="text-xs font-black text-slate-800 dark:text-white">50 - 59</span>
              </div>
              <div className="p-2 rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-100 dark:border-white/5 text-center col-span-2 sm:col-span-2">
                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Lembaga Kewirausahaan</span>
                <span className="text-xs font-black text-slate-800 dark:text-white">60 - 69</span>
              </div>
            </div>
          </div>

          <div className="pt-3 border-t border-slate-100 dark:border-white/5 text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
            <Info size={13} className="text-red-500 shrink-0" />
            <span>Admin tetap bebas menggunakan nomor berapapun (misal 1, 2, 3...) sesuai kebutuhan.</span>
          </div>
        </div>
      </div>

      {/* Tabel Pengurus */}
      <div className="bg-white dark:bg-[#121215] rounded-3xl border border-slate-200/80 dark:border-white/10 shadow-lg overflow-hidden transition-colors">
        <div className="p-6 border-b border-slate-100 dark:border-white/5 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-red-50 dark:bg-red-950/40 text-red-600 dark:text-red-400 flex items-center justify-center">
              <Users size={18} />
            </div>
            <div>
              <h3 className="font-bold text-slate-800 dark:text-white text-base">Daftar Kader Pengurus</h3>
              <p className="text-xs text-slate-400">Total {members.length} kader terdaftar</p>
            </div>
          </div>
        </div>

        {members.length === 0 ? (
          <div className="p-12 text-center text-slate-400">
            <Users size={36} className="mx-auto mb-3 opacity-40" />
            <p className="font-medium text-sm">Belum ada pengurus yang ditambahkan.</p>
            <p className="text-xs text-slate-500 mt-1">Gunakan tombol &ldquo;Tambah Pengurus&rdquo; atau &ldquo;Muat Data Awal&rdquo; untuk mulai mengisi.</p>
          </div>
        ) : (
          <>
            {/* TAMPILAN MOBILE (CARD VIEW TOUCH-FRIENDLY) */}
            <div className="block md:hidden p-4 space-y-3">
              {members.map((member) => (
                <div key={member.id} className="rounded-2xl border border-slate-200/90 dark:border-white/10 bg-slate-50/50 dark:bg-white/2 p-4 shadow-xs space-y-3">
                  {/* Baris Atas: Foto, Nama, ID, & Badge Urutan */}
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="relative w-12 h-14 rounded-xl overflow-hidden bg-slate-100 dark:bg-white/5 shrink-0 border border-slate-200 dark:border-white/10 flex items-center justify-center">
                        {member.imageUrl ? (
                          <Image src={member.imageUrl} alt={member.name} fill className="object-cover" />
                        ) : (
                          <span className="text-xs font-black text-red-600 dark:text-red-400">
                            {member.name
                              .split(" ")
                              .map((n) => n[0])
                              .slice(0, 2)
                              .join("")}
                          </span>
                        )}
                      </div>
                      <div className="min-w-0">
                        <h4 className="font-bold text-slate-900 dark:text-white text-sm leading-snug truncate">{member.name}</h4>
                        <span className="text-[10px] text-slate-400 font-mono">ID: {member.id.slice(0, 8)}</span>
                      </div>
                    </div>

                    <span className="px-2.5 py-1 rounded-lg text-xs font-mono font-bold bg-slate-100 dark:bg-white/10 text-slate-700 dark:text-slate-300 shrink-0">#{member.orderIndex}</span>
                  </div>

                  {/* Baris Tengah: Lencana Jabatan & Departemen */}
                  <div className="flex flex-wrap items-center gap-1.5">
                    <span className="inline-block px-2.5 py-1 rounded-full text-xs font-bold bg-slate-100 dark:bg-white/5 text-slate-700 dark:text-slate-300">{member.role}</span>
                    <span className="inline-block px-2.5 py-1 rounded-full text-xs font-bold bg-red-50 dark:bg-red-950/30 text-red-700 dark:text-red-300 border border-red-100 dark:border-red-900/40">
                      {deptLabels[member.department] || member.department.toUpperCase()}
                    </span>
                  </div>

                  {/* Kampus & Jurusan */}
                  <div className="text-xs text-slate-500 dark:text-slate-400 space-y-0.5">
                    <p className="font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                      <GraduationCap size={14} className="text-red-500 shrink-0" />
                      <span className="truncate">{member.campus}</span>
                    </p>
                    <p className="text-slate-400 pl-5 truncate">{member.major}</p>
                  </div>

                  {/* Baris Tombol Aksi */}
                  <div className="pt-3 border-t border-slate-200/60 dark:border-white/5 flex items-center justify-end gap-2">
                    <EditPengurusModal member={member} action={editPengurusAction} />
                    <SubmitWithConfirm
                      action={deletePengurusAction}
                      id={member.id}
                      modalTitle="Hapus Data Pengurus?"
                      modalDesc={`Apakah Anda yakin ingin menghapus data "${member.name}" (${member.role}) dari struktur kepengurusan?`}
                      confirmText="Ya, Hapus"
                      buttonElement={
                        <div className="p-2 rounded-xl bg-slate-100 dark:bg-white/5 hover:bg-red-50 dark:hover:bg-red-950/30 text-slate-500 hover:text-red-600 dark:hover:text-red-400 transition cursor-pointer">
                          <Trash2 size={15} />
                        </div>
                      }
                    />
                  </div>
                </div>
              ))}
            </div>

            {/* TAMPILAN TABLE DESKTOP & TABLET */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-100 dark:border-white/5 bg-slate-50/50 dark:bg-white/2 text-[11px] font-extrabold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                    <th className="py-4 px-6">Foto &amp; Nama</th>
                    <th className="py-4 px-6">Jabatan</th>
                    <th className="py-4 px-6">Departemen</th>
                    <th className="py-4 px-6">Kampus / Jurusan</th>
                    <th className="py-4 px-6 text-center">Urutan</th>
                    <th className="py-4 px-6 text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-white/5 text-sm">
                  {members.map((member) => (
                    <tr key={member.id} className="hover:bg-slate-50/70 dark:hover:bg-white/2 transition">
                      {/* Foto & Nama */}
                      <td className="py-4 px-6">
                        <div className="flex items-center gap-3.5">
                          <div className="relative w-12 h-14 rounded-xl overflow-hidden bg-slate-100 dark:bg-white/5 shrink-0 border border-slate-200 dark:border-white/10 flex items-center justify-center">
                            {member.imageUrl ? (
                              <Image src={member.imageUrl} alt={member.name} fill className="object-cover" />
                            ) : (
                              <span className="text-xs font-black text-red-600 dark:text-red-400">
                                {member.name
                                  .split(" ")
                                  .map((n) => n[0])
                                  .slice(0, 2)
                                  .join("")}
                              </span>
                            )}
                          </div>
                          <div>
                            <h4 className="font-bold text-slate-900 dark:text-white leading-snug">{member.name}</h4>
                            <span className="text-[11px] text-slate-400 font-mono">ID: {member.id.slice(0, 8)}</span>
                          </div>
                        </div>
                      </td>

                      {/* Jabatan */}
                      <td className="py-4 px-6 font-semibold text-slate-800 dark:text-slate-200">
                        <span className="inline-block px-2.5 py-1 rounded-full text-xs font-bold bg-slate-100 dark:bg-white/5 text-slate-700 dark:text-slate-300">{member.role}</span>
                      </td>

                      {/* Departemen */}
                      <td className="py-4 px-6">
                        <span className="inline-block px-2.5 py-1 rounded-full text-xs font-bold bg-red-50 dark:bg-red-950/30 text-red-700 dark:text-red-300 border border-red-100 dark:border-red-900/40">
                          {deptLabels[member.department] || member.department.toUpperCase()}
                        </span>
                      </td>

                      {/* Kampus & Jurusan */}
                      <td className="py-4 px-6">
                        <div className="text-xs space-y-0.5">
                          <p className="font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-1">
                            <GraduationCap size={13} className="text-red-500" />
                            {member.campus}
                          </p>
                          <p className="text-slate-400">{member.major}</p>
                        </div>
                      </td>

                      {/* Urutan */}
                      <td className="py-4 px-6 text-center font-mono text-xs text-slate-500">{member.orderIndex}</td>

                      {/* Aksi Edit / Hapus */}
                      <td className="py-4 px-6 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <EditPengurusModal member={member} action={editPengurusAction} />

                          <SubmitWithConfirm
                            action={deletePengurusAction}
                            id={member.id}
                            modalTitle="Hapus Data Pengurus?"
                            modalDesc={`Apakah Anda yakin ingin menghapus data "${member.name}" (${member.role}) dari struktur kepengurusan?`}
                            confirmText="Ya, Hapus"
                            buttonElement={
                              <div className="p-2 rounded-xl bg-slate-100 dark:bg-white/5 hover:bg-red-50 dark:hover:bg-red-950/30 text-slate-500 hover:text-red-600 dark:hover:text-red-400 transition cursor-pointer">
                                <Trash2 size={15} />
                              </div>
                            }
                          />
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
