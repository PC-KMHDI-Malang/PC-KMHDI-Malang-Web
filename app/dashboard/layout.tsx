import UserSidebar from "@/components/user/UserSidebar";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 transition-colors">
      <UserSidebar />

      <main className="flex-1 p-8 ml-64">
        {children}
      </main>
    </div>
  );
}