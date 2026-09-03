import UserSidebar from "@/components/user/UserSidebar";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex flex-col md:flex-row min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 transition-colors">
      <UserSidebar />

      <div className="flex-1 min-w-0 md:ml-64 p-4 sm:p-6 lg:p-8">{children}</div>
    </div>
  );
}
