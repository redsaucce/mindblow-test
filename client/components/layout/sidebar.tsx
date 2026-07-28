"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { ChevronUp, LogOut } from "lucide-react";
import AlertModal from "@/components/ui/alert-modal";
import { sidebarLinks, sidebarAccount } from "@/data/layout/sidebar";
import { useToggle } from "@/hooks/use-toggle";
import { logout } from "@/services/auth-service";

interface SidebarProps {
  open: boolean;
  onClose: () => void;
}

export default function Sidebar({ open, onClose }: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const role: "user" | "admin" = pathname.startsWith("/admin") ? "admin" : "user";
  const links = sidebarLinks[role];
  const email = role === "user" ? sidebarAccount.userEmail : sidebarAccount.adminEmail;

  const {
    value: accountOpen,
    toggle: toggleAccount,
    close: closeAccount,
  } = useToggle(false);

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
      router.push("/");
    }
  };

  return (
    <>
      {open && (
        <div
          className="fixed inset-0 z-40 bg-slate-900/40 lg:hidden"
          onClick={onClose}
        />
      )}

      <aside
        className={`fixed inset-y-0 left-0 z-50 w-64 shrink-0 flex flex-col bg-white border-r border-slate-100 transform transition-transform duration-300 ease-in-out lg:static lg:translate-x-0 ${
          open ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="px-4 py-6">
          <Link
            href="/"
            className="font-heading font-extrabold text-xl text-green-700 tracking-tight hover:opacity-80 transition-opacity duration-200"
          >
            {sidebarAccount.brand}
          </Link>
        </div>

        <div className="h-px bg-slate-100" />

        <nav className="flex-1 overflow-y-auto px-2 py-4">
          <ul className="space-y-1">
            {links.map((link) => {
              const active = pathname === link.href;
              return (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    onClick={onClose}
                    className={`flex items-center gap-3 w-full text-sm rounded-md px-4 py-3 transition-colors duration-200 ${
                      active
                        ? "bg-emerald-50 text-green-700 font-medium border-l-2 border-green-700"
                        : "text-slate-600 hover:bg-slate-50 hover:text-green-700"
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
                  {email.charAt(0).toUpperCase()}
                </div>
                {role === "user" ? (
                  <span className="text-sm text-slate-600 truncate">{email}</span>
                ) : (
                  <span className="text-sm font-medium text-slate-900">
                    {sidebarAccount.adminLabel}
                  </span>
                )}
              </div>
              <ChevronUp className="w-4 h-4 text-slate-400 shrink-0" />
            </button>

            {accountOpen && (
              <div className="absolute bottom-full left-2 right-2 mb-2 rounded-2xl border border-slate-100 bg-white shadow-xl overflow-hidden">
                <div className="px-4 py-2 text-xs text-slate-400 truncate border-b border-slate-100">
                  {email}
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