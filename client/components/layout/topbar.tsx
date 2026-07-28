"use client";

import { usePathname } from "next/navigation";
import { Menu } from "lucide-react";
import { pageTitles, defaultPageTitle } from "@/data/layout/topbar";
import { useTopbarActions } from "@/hooks/use-topbar-actions";

interface TopbarProps {
  onOpenSidebar: () => void;
}

export default function Topbar({ onOpenSidebar }: TopbarProps) {
  const pathname = usePathname();
  const pageTitle = pageTitles[pathname] ?? defaultPageTitle;
  const actions = useTopbarActions();

  return (
    <>
      {(pageTitle || actions) && (
        <header className="hidden lg:flex sticky top-0 z-10 h-16 items-center justify-between px-6 bg-white border-b border-slate-100 shrink-0">
          {pageTitle && (
            <h1 className="text-lg lg:text-xl font-heading font-semibold text-slate-900 shrink-0">
              {pageTitle}
            </h1>
          )}
          {actions && <div className="flex items-center gap-2 ml-6">{actions}</div>}
        </header>
      )}

      <header className="flex lg:hidden sticky top-0 z-10 h-14 items-center gap-3 px-4 bg-white border-b border-slate-100 shrink-0">
        <button
          onClick={onOpenSidebar}
          aria-label="Open navigation"
          className="w-9 h-9 rounded-lg bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-700 transition-colors shrink-0"
        >
          <Menu className="w-5 h-5" />
        </button>

        {pageTitle && (
          <h1 className="text-lg font-heading font-semibold text-slate-900 truncate flex-1">
            {pageTitle}
          </h1>
        )}

        {actions && (
          <div className="w-full flex items-center gap-2 flex-wrap pb-1">{actions}</div>
        )}
      </header>
    </>
  );
}