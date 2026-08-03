"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronUp, LogOut, X } from "lucide-react";
import AlertModal from "@/components/ui/alert-modal";
import { sidebarLinks, sidebarAccount } from "@/data/layout/sidebar";
import { useToggle } from "@/hooks/use-toggle";
import { getMe, logout } from "@/services/public/auth-service";

interface SidebarProps {
  open: boolean;
  onClose: () => void;
}

export default function Sidebar({ open, onClose }: SidebarProps) {
  const pathname = usePathname();
  const role: "user" | "admin" = pathname.startsWith("/admin") ? "admin" : "user";
  const links = sidebarLinks[role];

  const [email, setEmail] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    getMe()
      .then((me) => {
        if (!cancelled) setEmail(me.email);
      })
      .catch(() => {
        // Silently keep null — falls back to a static placeholder below
        // rather than showing an error in the sidebar over something this minor.
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const displayEmail = email ?? (role === "user" ? sidebarAccount.userEmail : sidebarAccount.adminEmail);

  const {
    value: accountOpen,
    toggle: toggleAccount,
    close: closeAccount,
  } = useToggle(false);

  // Keep the account dropdown from staying open underneath a closed
  // mobile sidebar — collapsing the sidebar should collapse this too.
  useEffect(() => {
    if (!open) closeAccount();
  }, [open, closeAccount]);

  const [logoutConfirmOpen, setLogoutConfirmOpen] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const handleLogoutClick = () => {
    closeAccount();
    setLogoutConfirmOpen(true);
  };

  const handleConfirmLogout = async () => {
    setIsLoggingOut(true);
    try {
      await logout();
    } catch {
      // Intentionally swallowed — see notes below. Redirect happens
      // regardless of whether the server call succeeded.
    } finally {
      setLogoutConfirmOpen(false);
      setIsLoggingOut(false);
      window.location.href = "/";
    }
  };

  return (
    <>
      <aside
        className={`fixed inset-y-0 left-0 z-[60] w-full lg:z-50 lg:w-64 shrink-0 flex flex-col bg-white lg:border-r lg:border-slate-100 shadow-2xl lg:shadow-none transform transition-transform duration-300 ease-in-out lg:static lg:translate-x-0 ${
          open ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex items-center justify-between px-6 py-5 lg:px-4 lg:py-6 border-b border-slate-100 lg:border-b-0">
          <Link
            href="/"
            onClick={onClose}
            className="font-heading font-extrabold text-xl text-green-700 tracking-tight hover:opacity-80 transition-opacity duration-200"
          >
            {sidebarAccount.brand}
          </Link>
          <button
            onClick={onClose}
            aria-label="Close menu"
            className="lg:hidden w-9 h-9 rounded-lg bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-700 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="hidden lg:block h-px bg-slate-100" />

        <nav className="flex-1 overflow-y-auto px-6 py-6 lg:px-2 lg:py-4">
          <ul className="space-y-1">
            {links.map((link) => {
              const active = pathname === link.href;
              return (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    onClick={onClose}
                    className={`flex items-center gap-3 w-full text-sm sm:text-base lg:text-sm rounded-xl lg:rounded-md px-4 py-3 transition-colors duration-200 ${
                      active
                        ? "bg-emerald-50 text-green-700 font-medium lg:border-l-2 lg:border-green-700"
                        : "text-slate-700 lg:text-slate-600 hover:bg-slate-50 hover:text-green-700"
                    }`}
                  >
                    {link.label}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        <div className="mt-auto shrink-0">
          <div className="h-px bg-slate-100" />
          <div className="relative px-2 py-2">
            <button
              onClick={toggleAccount}
              className="flex items-center justify-between w-full px-4 py-3 rounded-xl hover:bg-slate-50 transition-colors duration-200"
            >
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-10 h-10 rounded-full bg-emerald-600 text-white font-semibold text-sm flex items-center justify-center shrink-0">
                  {displayEmail.charAt(0).toUpperCase()}
                </div>
                {role === "user" ? (
                  <span className="text-sm text-slate-600 truncate">{displayEmail}</span>
                ) : (
                  <span className="text-sm font-medium text-slate-900">
                    {sidebarAccount.adminLabel}
                  </span>
                )}
              </div>
              <ChevronUp
                className={`w-4 h-4 text-slate-400 shrink-0 transition-transform duration-200 ${
                  accountOpen ? "rotate-0" : "rotate-180"
                }`}
              />
            </button>

            {accountOpen && (
              <div className="absolute bottom-full left-2 right-2 mb-2 rounded-2xl border border-slate-100 bg-white shadow-xl overflow-hidden">
                <div className="px-4 py-2 text-xs text-slate-400 truncate border-b border-slate-100">
                  {displayEmail}
                </div>
                <button
                  onClick={handleLogoutClick}
                  className="flex items-center gap-2 w-full px-4 py-2.5 text-sm text-red-500 hover:bg-red-50 transition-colors border-t border-slate-100"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  {sidebarAccount.logoutLabel}
                </button>
              </div>
            )}
          </div>
        </div>
      </aside>

      <AlertModal
        open={logoutConfirmOpen}
        onClose={() => {
          if (!isLoggingOut) setLogoutConfirmOpen(false);
        }}
        title={sidebarAccount.logoutDialog.title}
        description={sidebarAccount.logoutDialog.description}
        cancelLabel={sidebarAccount.logoutDialog.cancelLabel}
        confirmLabel={sidebarAccount.logoutDialog.confirmLabel}
        loadingLabel={sidebarAccount.logoutDialog.loggingOutLabel}
        isLoading={isLoggingOut}
        onConfirm={handleConfirmLogout}
        confirmVariant="danger"
      />
    </>
  );
}