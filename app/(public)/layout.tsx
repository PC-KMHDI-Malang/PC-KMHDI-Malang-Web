import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import { SessionAutoLogout } from "@/components/auth/SessionAutoLogout";
import { ChatBot } from "@/components/ui/ChatBotLoader";
import { AnnouncementPopup } from "@/components/ui/AnnouncementPopup";
import { getPopupAd } from "@/lib/queries";

// Sengaja tidak lagi memanggil auth() di sini: itu membaca cookie sesi, dan begitu server
// component mana pun di halaman ini melakukannya, Next.js memaksa SELURUH halaman dianggap
// dinamis — walau isinya sama untuk setiap pengunjung — sehingga halaman seperti galeri/mitra/
// profil tidak pernah bisa di-cache. Status login sekarang dibaca di client oleh Navbar &
// SessionAutoLogout sendiri lewat useSession() (lihat komentar di masing-masing file).
// getPopupAd aman dipanggil di sini (tidak ikut memaksa dinamis) karena tidak menyentuh
// cookies()/headers() — cuma query Supabase biasa, sama seperti getStatisticSection di beranda.
export default async function PublicLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const popup = await getPopupAd();

  return (
    <>
      <SessionAutoLogout timeoutMinutes={120} />
      <Navbar />
      <div className="min-h-screen">{children}</div>
      <ChatBot />
      <Footer />
      <AnnouncementPopup imageUrl={popup?.imageUrl ?? null} linkUrl={popup?.linkUrl ?? null} isActive={popup?.isActive ?? false} />
    </>
  );
}
