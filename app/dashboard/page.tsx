import { auth } from "@/lib/auth";

export default async function DashboardHome() {
  const session = await auth();

  return (
    <div>
      <h1 className="text-3xl font-bold mb-4">Selamat Datang, {session?.user?.name}!</h1>
      <p className="text-gray-600 mb-8">Ini adalah panel admin untuk mengelola website KMHDI Malang.</p>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-lg shadow-sm border border-l-4 border-l-blue-500">
          <h2 className="text-lg font-semibold text-gray-700">Akses Cepat</h2>
          <p className="text-gray-500 text-sm mt-2">Gunakan menu di samping kiri untuk menavigasi ke bagian yang Anda butuhkan.</p>
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow-sm border border-l-4 border-l-green-500">
          <h2 className="text-lg font-semibold text-gray-700">Role Anda</h2>
          <p className="text-gray-500 text-sm mt-2">Anda login sebagai: <strong className="text-green-600">{session?.user?.role}</strong></p>
        </div>
      </div>
    </div>
  );
}
