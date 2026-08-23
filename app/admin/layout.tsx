import Sidebar from "@/components/admin/Sidebar";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen bg-slate-50 text-slate-900">
      <Sidebar />

      <main className="flex-1 p-8 ml-64">
        {children}
      </main>
    </div>
  );
}
