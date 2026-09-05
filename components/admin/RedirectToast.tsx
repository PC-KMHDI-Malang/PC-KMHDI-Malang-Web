"use client";

import { useEffect } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";

interface RedirectToastProps {
  // Nama query param penanda (mis. "updated") — dicek nilainya "1".
  param: string;
  message: string;
}

// Untuk aksi admin yang masih pakai <form action={...}> native (redirect penuh dari server,
// bukan intersepsi client-side) — mis. halaman edit artikel — tidak ada kesempatan menampilkan
// toast SEBELUM redirect terjadi. Triknya: server action menyisipkan penanda di URL tujuan
// redirect-nya (mis. "/admin/news?updated=1"), lalu komponen kecil ini yang baca penanda itu di
// halaman tujuan, munculkan toast, dan langsung bersihkan dari URL supaya tidak muncul lagi
// kalau halamannya di-refresh manual.
export function RedirectToast({ param, message }: RedirectToastProps) {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (searchParams.get(param) !== "1") return;

    toast.success(message);

    const params = new URLSearchParams(searchParams);
    params.delete(param);
    router.replace(params.size > 0 ? `${pathname}?${params.toString()}` : pathname, { scroll: false });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams, param, message]);

  return null;
}
