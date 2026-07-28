"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  WifiOff,
  LockKeyhole,
  ServerCrash,
  ShieldAlert,
  AlertTriangle,
  RefreshCw,
  ArrowRight,
  type LucideIcon,
} from "lucide-react";
import { useOnlineStatus } from "@/hooks/use-online-status";

type ErrorState = "network" | "auth" | "downtime" | "forbidden" | "generic";

/**
 * Errors thrown anywhere in the tree should carry a typed `code` so this
 * boundary can classify them without string-matching `error.message`.
 * e.g. `throw Object.assign(new Error("..."), { code: "NETWORK" })`
 */
interface AppError extends Error {
  code?: "NETWORK" | "AUTH" | "DOWNTIME" | "FORBIDDEN";
}

type ErrorAction = "retry" | "login" | "back";

interface ErrorStateConfig {
  icon: LucideIcon;
  code?: string;
  title: string;
  message: string;
  actionLabel: string;
  action: ErrorAction;
}

const ERROR_STATES: Record<ErrorState, ErrorStateConfig> = {
  network: {
    icon: WifiOff,
    title: "Check your connection",
    message: "We couldn't reach MindBlow. Check your internet connection and try again.",
    actionLabel: "Retry",
    action: "retry",
  },
  auth: {
    icon: LockKeyhole,
    code: "401",
    title: "Your session has ended",
    message: "Please sign in again to continue where you left off.",
    actionLabel: "Go to login",
    action: "login",
  },
  downtime: {
    icon: ServerCrash,
    code: "503",
    title: "We're briefly unavailable",
    message:
      "MindBlow is undergoing maintenance right now. This usually resolves within a few minutes.",
    actionLabel: "Retry",
    action: "retry",
  },
  forbidden: {
    icon: ShieldAlert,
    code: "403",
    title: "Access restricted",
    message: "You don't have permission to view this page.",
    actionLabel: "Go back",
    action: "back",
  },
  generic: {
    icon: AlertTriangle,
    title: "Something went wrong",
    message: "An unexpected error occurred. Please try again.",
    actionLabel: "Try again",
    action: "retry",
  },
};

function classifyError(error: AppError): ErrorState {
  switch (error.code) {
    case "NETWORK":
      return "network";
    case "AUTH":
      return "auth";
    case "DOWNTIME":
      return "downtime";
    case "FORBIDDEN":
      return "forbidden";
    default:
      return "generic";
  }
}

export default function Error({
  error,
  reset,
}: {
  error: AppError;
  reset: () => void;
}) {
  const router = useRouter();
  const isOnline = useOnlineStatus();
  // A confirmed offline browser is a stronger signal than error.code —
  // if there's truly no connection, show the network state regardless
  // of how the thrown error happened to be tagged.
  const state = !isOnline ? "network" : classifyError(error);
  const { icon: Icon, code, title, message, actionLabel, action } = ERROR_STATES[state];

  useEffect(() => {
    console.error(error);
  }, [error]);

  // Downtime is the one state that also retries itself in the background,
  // on top of the manual button below.
  useEffect(() => {
    if (state !== "downtime") return;
    const timer = setTimeout(() => reset(), 8000);
    return () => clearTimeout(timer);
  }, [state, reset]);

  const handleAction = () => {
    switch (action) {
      case "retry":
        reset();
        break;
      case "back":
        router.back();
        break;
      case "login":
        // TODO(dev): no dedicated /login route yet, and AuthModal lives
        // in (landing)/layout.tsx rather than this root-level boundary,
        // so it isn't guaranteed to be mounted here. Sending home for
        // now — swap for router.push("/login") once that route exists.
        router.push("/");
        break;
    }
  };

  const ActionIcon = action === "retry" ? RefreshCw : ArrowRight;

  return (
    <main className="relative overflow-hidden bg-gradient-to-br from-white via-emerald-50/70 to-slate-50 min-h-screen flex items-center justify-center px-6">
      <div className="absolute top-1/4 left-1/4 w-[420px] h-[420px] rounded-full bg-emerald-500/10 blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-[360px] h-[360px] rounded-full bg-green-500/12 blur-3xl pointer-events-none" />

      <div className="relative max-w-md mx-auto text-center">
        <div className="mx-auto mb-6 w-16 h-16 rounded-3xl bg-gradient-to-br from-emerald-500 to-green-600 flex items-center justify-center shadow-lg shadow-emerald-500/20">
          <Icon className="w-7 h-7 text-white" strokeWidth={2.2} />
        </div>

        {code && (
          <span className="block text-xs md:text-sm font-bold uppercase tracking-widest text-emerald-600 mb-2">
            Error {code}
          </span>
        )}

        <h1 className="font-heading text-2xl md:text-3xl font-black text-green-950 mb-3 leading-tight">
          {title}
        </h1>

        <p className="text-slate-600 text-sm md:text-base leading-relaxed mb-8">
          {message}
        </p>

        <button
          type="button"
          onClick={handleAction}
          className="inline-flex items-center justify-center gap-2 bg-gradient-to-r from-emerald-600 to-green-700 hover:from-emerald-500 hover:to-green-600 text-white font-bold px-6 py-3 rounded-2xl shadow-lg shadow-emerald-600/25 transition-all duration-200 hover:-translate-y-0.5"
        >
          {actionLabel}
          <ActionIcon className="w-4 h-4" />
        </button>

        {state === "downtime" && (
          <p className="mt-4 text-xs text-slate-400">
            We'll automatically retry shortly.
          </p>
        )}
      </div>
    </main>
  );
}