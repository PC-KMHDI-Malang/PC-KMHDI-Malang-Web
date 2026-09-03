import { auth } from "@/lib/auth";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import { SessionAutoLogout } from "@/components/auth/SessionAutoLogout";

export default async function PublicLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const session = await auth();

  return (
    <>
      <SessionAutoLogout isLoggedIn={!!session?.user} timeoutMinutes={120} />
      <Navbar user={session?.user} />
      <div className="min-h-screen">{children}</div>
      <Footer />
    </>
  );
}
