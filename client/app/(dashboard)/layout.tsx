"use client";

import { useState } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
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

  // useState (not a module-level constant) so each browser session gets its
  // own QueryClient instance, avoiding cache leakage across users under SSR.
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 60 * 1000, // data considered fresh for 60s before a background refetch
            refetchOnWindowFocus: false,
          },
        },
      })
  );

  return (
    <QueryClientProvider client={queryClient}>
      <div className="flex min-h-screen bg-slate-50">
        <Sidebar open={sidebarOpen} onClose={closeSidebar} />
        <div className="flex-1 flex flex-col min-w-0">
          <Topbar onOpenSidebar={openSidebar} />
          <main className="flex-1 flex flex-col p-6">{children}</main>
        </div>
      </div>
    </QueryClientProvider>
  );
}