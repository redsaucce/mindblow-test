"use client";

import Sidebar from "@/components/layout/sidebar";
import Topbar from "@/components/layout/topbar";
import { useToggle } from "@/hooks/use-toggle";

export default function DashboardLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const {
    value: sidebarOpen,
    open: openSidebar,
    close: closeSidebar,
  } = useToggle(false);

  return (
    <div className="flex min-h-screen bg-slate-50">
      <Sidebar open={sidebarOpen} onClose={closeSidebar} />
      <div className="flex-1 flex flex-col min-w-0">
        <Topbar onOpenSidebar={openSidebar} />
        <main className="flex-1 flex flex-col p-6">{children}</main>
      </div>
    </div>
  );
}