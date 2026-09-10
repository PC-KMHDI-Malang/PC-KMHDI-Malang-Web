"use client";

import { useSession } from "next-auth/react";
import { Eye, Download } from "lucide-react";
import { LoginPromptModal } from "@/components/ui/LoginPromptModal";
import { isProtectedAccountEmail } from "@/lib/protectedAccounts";

interface EbookAccessButtonsProps {
  hasPdf: boolean;
  fileHref: string;
  downloadHref: string;
  readLoginHref: string;
  downloadLoginHref: string;
}

// Status login dibaca di client (bukan lagi lewat auth() di server) supaya halaman e-book bisa
// di-cache — lihat catatan yang sama di app/(public)/layout.tsx. Ini aman karena akses filenya
// sendiri tetap diperiksa ulang di server oleh app/api/ebook/[id]/file/[filename]/route.ts —
// komponen ini cuma menentukan tombol MANA yang ditampilkan, bukan gerbang keamanan yang
// sebenarnya.
export function EbookAccessButtons({ hasPdf, fileHref, downloadHref, readLoginHref, downloadLoginHref }: EbookAccessButtonsProps) {
  const { data: session, status } = useSession();

  if (!hasPdf) {
    return (
      <div className="inline-flex items-center gap-2 bg-slate-100 dark:bg-slate-800/50 text-slate-500 dark:text-slate-400 font-bold py-2.5 px-5 rounded-xl text-sm border border-slate-200 dark:border-white/5">
        File PDF belum tersedia
      </div>
    );
  }

  // Selama status sesi belum diketahui, tampilkan placeholder netral — supaya tidak sempat
  // menampilkan salah satu set tombol lalu berganti ke set lain begitu sesi datang.
  if (status === "loading") {
    return (
      <>
        <div className="h-11 w-36 rounded-xl bg-slate-100 dark:bg-slate-800/50 animate-pulse" />
        <div className="h-11 w-40 rounded-xl bg-slate-100 dark:bg-slate-800/50 animate-pulse" />
      </>
    );
  }

  // Akun bersama untuk /informasi-akun sengaja diperlakukan seperti belum login di sini —
  // aksesnya dibatasi hanya untuk melihat halaman itu, tidak untuk baca/unduh e-book.
  const isLoggedIn = !!session?.user && !isProtectedAccountEmail(session.user.email);

  if (isLoggedIn) {
    return (
      <>
        <a
          href={fileHref}
          target="_blank"
          rel="noreferrer"
          className="inline-flex items-center gap-2 bg-red-600 text-white font-bold py-2.5 px-5 rounded-xl hover:bg-red-700 transition-colors shadow-sm text-sm"
        >
          <Eye size={16} />
          Baca Online
        </a>
        <a
          href={downloadHref}
          className="inline-flex items-center gap-2 bg-slate-800 dark:bg-slate-700 text-white font-bold py-2.5 px-5 rounded-xl hover:bg-slate-900 dark:hover:bg-slate-600 transition-colors shadow-sm text-sm"
        >
          <Download size={16} />
          Download PDF
        </a>
      </>
    );
  }

  return (
    <>
      <LoginPromptModal
        loginHref={readLoginHref}
        triggerLabel="Baca Online"
        triggerIcon={<Eye size={16} />}
        triggerClassName="inline-flex items-center gap-2 bg-red-600 text-white font-bold py-2.5 px-5 rounded-xl hover:bg-red-700 transition-colors shadow-sm text-sm"
      />
      <LoginPromptModal
        loginHref={downloadLoginHref}
        triggerLabel="Download PDF"
        triggerIcon={<Download size={16} />}
        triggerClassName="inline-flex items-center gap-2 bg-slate-800 dark:bg-slate-700 text-white font-bold py-2.5 px-5 rounded-xl hover:bg-slate-900 dark:hover:bg-slate-600 transition-colors shadow-sm text-sm"
      />
    </>
  );
}
