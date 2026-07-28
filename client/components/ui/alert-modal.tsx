"use client";

import { Loader2, type LucideIcon } from "lucide-react";
import Modal from "@/components/ui/modal";

interface AlertModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  description: string;
  cancelLabel: string;
  confirmLabel: string;
  loadingLabel?: string;
  isLoading?: boolean;
  onConfirm: () => void;
  /** "danger" for destructive actions (delete), "primary" for everything else. */
  confirmVariant?: "danger" | "primary";
  /** Optional icon shown before the confirm label, hidden while loading. */
  confirmIcon?: LucideIcon;
}

export default function AlertModal({
  open,
  onClose,
  title,
  description,
  cancelLabel,
  confirmLabel,
  loadingLabel,
  isLoading = false,
  onConfirm,
  confirmVariant = "primary",
  confirmIcon: ConfirmIcon,
}: AlertModalProps) {
  const confirmClassName =
    confirmVariant === "danger"
      ? "bg-red-500 hover:bg-red-600"
      : "bg-gradient-to-r from-emerald-600 to-green-700 hover:from-emerald-500 hover:to-green-600";

  return (
    <Modal open={open} onClose={onClose} contentClassName="p-6">
      <h2 className="font-heading text-lg font-bold text-slate-900 mb-2">{title}</h2>
      <p className="text-sm text-slate-500 leading-relaxed mb-6">{description}</p>
      <div className="flex items-center justify-end gap-3">
        <button
          type="button"
          onClick={onClose}
          disabled={isLoading}
          className="rounded-full px-5 py-2.5 text-sm font-medium text-slate-600 hover:bg-slate-50 disabled:opacity-50 transition-colors"
        >
          {cancelLabel}
        </button>
        <button
          type="button"
          onClick={onConfirm}
          disabled={isLoading}
          className={`inline-flex items-center gap-2 rounded-full disabled:opacity-60 text-white text-sm font-bold px-5 py-2.5 transition-all ${confirmClassName}`}
        >
          {isLoading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              {loadingLabel ?? confirmLabel}
            </>
          ) : (
            <>
              {ConfirmIcon && <ConfirmIcon className="w-4 h-4" />}
              {confirmLabel}
            </>
          )}
        </button>
      </div>
    </Modal>
  );
}