"use client";

import { useEffect, useRef, type ReactNode, type RefObject } from "react";
import { X } from "lucide-react";
import ScrollBar from "@/components/ui/scroll-bar";

interface ModalProps {
  open: boolean;
  onClose: () => void;
  children: ReactNode;
  maxWidthClassName?: string;
  panelClassName?: string;
  contentClassName?: string;
  showCloseButton?: boolean;
  /**
   * Optional sticky header, rendered above the scrollable body and
   * outside the scroll container — stays fixed while children scroll.
   */
  header?: ReactNode;
  headerClassName?: string;
  /**
   * Optional sticky footer, rendered below the scrollable body and
   * outside the scroll container — stays fixed while children scroll.
   */
  footer?: ReactNode;
  footerClassName?: string;
  /**
   * When provided, the modal's scroll container uses this ref and
   * renders the custom ScrollBar instead of the browser's native
   * scrollbar (native scrollbar is hidden via inline style).
   */
  scrollContainerRef?: RefObject<HTMLDivElement | null>;
}

const FOCUSABLE =
  'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

function getFocusable(container: HTMLElement): HTMLElement[] {
  return Array.from(container.querySelectorAll<HTMLElement>(FOCUSABLE)).filter(
    (el) => !el.hasAttribute("inert") && el.offsetParent !== null
  );
}

export default function Modal({
  open,
  onClose,
  children,
  maxWidthClassName = "max-w-md",
  panelClassName = "",
  contentClassName = "",
  showCloseButton = true,
  header,
  headerClassName = "",
  footer,
  footerClassName = "",
  scrollContainerRef,
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

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  // Focus management: move focus into the dialog on open, keep Tab inside it,
  // and return focus to the element that opened it on close.
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const opener = document.activeElement as HTMLElement | null;
    const panel = panelRef.current;
    const focusables = panel ? getFocusable(panel) : [];
    (focusables[0] ?? panel)?.focus();
    return () => {
      opener?.focus();
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onTab = (e: KeyboardEvent) => {
      if (e.key !== "Tab" || !panelRef.current) return;
      const focusables = getFocusable(panelRef.current);
      if (focusables.length === 0) {
        e.preventDefault();
        return;
      }
      const first = focusables[0];
      const last = focusables[focusables.length - 1];
      const active = document.activeElement;
      if (e.shiftKey && (active === first || !panelRef.current.contains(active))) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && (active === last || !panelRef.current.contains(active))) {
        e.preventDefault();
        first.focus();
      }
    };
    document.addEventListener("keydown", onTab);
    return () => document.removeEventListener("keydown", onTab);
  }, [open]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-100 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
        onClick={onClose}
      />
      <div
        ref={panelRef}
        tabIndex={-1}
        role="dialog"
        aria-modal="true"
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
        {header ? (
          <div className={`shrink-0 ${headerClassName}`}>{header}</div>
        ) : null}
        <div
          ref={scrollContainerRef}
          className={`overflow-y-auto flex-1 ${contentClassName}`}
          style={
            scrollContainerRef
              ? { scrollbarWidth: "none", msOverflowStyle: "none" }
              : undefined
          }
        >
          {children}
        </div>
        {scrollContainerRef ? (
          <ScrollBar containerRef={scrollContainerRef} />
        ) : null}
        {footer ? (
          <div className={`shrink-0 ${footerClassName}`}>{footer}</div>
        ) : null}
      </div>
    </div>
  );
}