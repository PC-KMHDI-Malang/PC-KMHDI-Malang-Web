import Link from "next/link";
import { auth, signOut } from "@/lib/auth";
import { 
  LayoutDashboard, 
  BookOpen, 
  Image as ImageIcon, 
  Users, 
  KeyRound, 
  LogOut 
} from "lucide-react";

export default async function Sidebar() {
  const session = await auth();
  const role = session?.user?.role || "USER";

  return (
    <aside className="w-64 bg-white border-r min-h-screen flex flex-col">
      <div className="p-6 border-b">
        <h2 className="text-xl font-bold text-gray-800">Admin Panel</h2>
        <p className="text-sm text-gray-500 mt-1">KMHDI Malang</p>
      </div>

      <nav className="flex-1 p-4 space-y-2">
        <Link 
          href="/dashboard" 
          className="flex items-center gap-3 px-4 py-3 text-gray-700 hover:bg-neutral-100 rounded-lg transition-colors"
        >
          <LayoutDashboard className="w-5 h-5" />
          <span>Beranda</span>
        </Link>

        <Link 
          href="/dashboard/ebooks" 
          className="flex items-center gap-3 px-4 py-3 text-gray-700 hover:bg-neutral-100 rounded-lg transition-colors"
        >
          <BookOpen className="w-5 h-5" />
          <span>Manajemen Ebook</span>
        </Link>

        <Link 
          href="/dashboard/gallery" 
          className="flex items-center gap-3 px-4 py-3 text-gray-700 hover:bg-neutral-100 rounded-lg transition-colors"
        >
          <ImageIcon className="w-5 h-5" />
          <span>Manajemen Galeri</span>
        </Link>

        {role === "ADMIN" && (
          <Link 
            href="/dashboard/users" 
            className="flex items-center gap-3 px-4 py-3 text-gray-700 hover:bg-neutral-100 rounded-lg transition-colors"
          >
            <Users className="w-5 h-5" />
            <span>Manajemen User</span>
          </Link>
        )}

        <Link 
          href="/dashboard/profile" 
          className="flex items-center gap-3 px-4 py-3 text-gray-700 hover:bg-neutral-100 rounded-lg transition-colors"
        >
          <KeyRound className="w-5 h-5" />
          <span>Ganti Password</span>
        </Link>
      </nav>

      <div className="p-4 border-t">
        <form
          action={async () => {
            "use server";
            await signOut({ redirectTo: "/login" });
          }}
        >
          <button 
            type="submit" 
            className="flex items-center gap-3 px-4 py-3 w-full text-red-600 hover:bg-red-50 rounded-lg transition-colors"
          >
            <LogOut className="w-5 h-5" />
            <span>Logout</span>
          </button>
        </form>
      </div>
    </aside>
  );
}