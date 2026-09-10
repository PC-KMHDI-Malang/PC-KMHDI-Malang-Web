import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import { SessionAutoLogout } from "@/components/auth/SessionAutoLogout";
import { ChatBot } from "@/components/ui/ChatBotLoader";

// Sengaja tidak lagi memanggil auth() di sini: itu membaca cookie sesi, dan begitu server
// component mana pun di halaman ini melakukannya, Next.js memaksa SELURUH halaman dianggap
// dinamis — walau isinya sama untuk setiap pengunjung — sehingga halaman seperti galeri/mitra/
// profil tidak pernah bisa di-cache. Status login sekarang dibaca di client oleh Navbar &
// SessionAutoLogout sendiri lewat useSession() (lihat komentar di masing-masing file).
export default function PublicLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <>
      <SessionAutoLogout timeoutMinutes={120} />
      <Navbar />
      <div className="min-h-screen">{children}</div>
      <ChatBot />
      <Footer />
    </>
  );
}
