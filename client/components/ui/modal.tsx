"use client";

import { useEffect, type ReactNode } from "react";
import { X } from "lucide-react";

interface ModalProps {
  open: boolean;
  onClose: () => void;
  children: ReactNode;
  maxWidthClassName?: string;
  panelClassName?: string;
  contentClassName?: string;
  showCloseButton?: boolean;
}

export default function Modal({
  open,
  onClose,
  children,
  maxWidthClassName = "max-w-md",
  panelClassName = "",
  contentClassName = "",
  showCloseButton = true,
}: ModalProps) {
  // Locks background scroll while open, and caps the panel so only its
  // inner content scrolls if it overflows — same treatment as legal.tsx,
  // now shared here so every modal built on this primitive gets it too.
  useEffect(() => {
    if (!open) return;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
        onClick={onClose}
      />
      <div
        className={`relative w-full ${maxWidthClassName} max-h-[85vh] flex flex-col overflow-hidden rounded-3xl bg-white shadow-2xl ${panelClassName}`}
      >
        {showCloseButton ? (
          <button
            onClick={onClose}
            className="absolute top-4 right-4 z-10 flex h-8 w-8 items-center justify-center rounded-lg bg-slate-100 text-slate-500 transition-colors hover:bg-slate-200 hover:text-slate-700"
            aria-label="Close modal"
          >
            <X className="h-4 w-4" />
          </button>
        ) : null}
        <div className={`overflow-y-auto flex-1 ${contentClassName}`}>
          {children}
        </div>
      </div>
    </div>
  );
}