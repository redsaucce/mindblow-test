"use client";
import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Loader2, CheckCircle2, ShieldAlert, type LucideIcon } from "lucide-react";
import { verifyToken, ApiError } from "@/services/public/auth-service";

type VerifyState = "verifying" | "success" | "error";

function VerifyContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [state, setState] = useState<VerifyState>("verifying");
  const [errorMessage, setErrorMessage] = useState("");
  useEffect(() => {
    const token = searchParams.get("token");
    if (!token) {
      setState("error");
      setErrorMessage("This link is missing a token. Please request a new one.");
      return;
    }
    let cancelled = false;
    verifyToken(token)
      .then(({ role }) => {
        if (cancelled) return;
        setState("success");
        router.replace(role === "admin" ? "/admin" : "/user");
      })
      .catch((err) => {
        if (cancelled) return;
        setState("error");
        setErrorMessage(
          err instanceof ApiError
            ? err.detail
            : "Something went wrong verifying your link."
        );
      });
    return () => {
      cancelled = true;
    };
  }, [searchParams, router]);
  const config: { icon: LucideIcon; spin?: boolean; title: string; message: string } =
    state === "verifying"
      ? {
          icon: Loader2,
          spin: true,
          title: "Verifying your link",
          message: "Just a moment while we sign you in.",
        }
      : state === "success"
        ? {
            icon: CheckCircle2,
            title: "You're signed in",
            message: "Redirecting you now…",
          }
        : {
            icon: ShieldAlert,
            title: "Link expired or invalid",
            message: errorMessage,
          };
  const Icon = config.icon;
  return (
    <main className="relative overflow-hidden bg-gradient-to-br from-white via-emerald-50/70 to-slate-50 min-h-screen flex items-center justify-center px-6">
      <div className="absolute top-1/4 left-1/4 w-[420px] h-[420px] rounded-full bg-emerald-500/10 blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-[360px] h-[360px] rounded-full bg-green-500/12 blur-3xl pointer-events-none" />
      <div className="relative max-w-md mx-auto text-center">
        <div className="mx-auto mb-6 w-16 h-16 rounded-3xl bg-gradient-to-br from-emerald-500 to-green-600 flex items-center justify-center shadow-lg shadow-emerald-500/20">
          <Icon
            className={`w-7 h-7 text-white ${config.spin ? "animate-spin" : ""}`}
            strokeWidth={2.2}
          />
        </div>
        <h1 className="font-heading text-2xl md:text-3xl font-black text-green-950 mb-3 leading-tight">
          {config.title}
        </h1>
        <p className="text-slate-600 text-sm md:text-base leading-relaxed mb-8">
          {config.message}
        </p>
        {state === "error" && (
          <button
            type="button"
            onClick={() => router.push("/")}
            className="inline-flex items-center justify-center gap-2 bg-gradient-to-r from-emerald-600 to-green-700 hover:from-emerald-500 hover:to-green-600 text-white font-bold px-6 py-3 rounded-2xl shadow-lg shadow-emerald-600/25 transition-all duration-200 hover:-translate-y-0.5"
          >
            Back to home
          </button>
        )}
      </div>
    </main>
  );
}

export default function VerifyPage() {
  return (
    <Suspense fallback={null}>
      <VerifyContent />
    </Suspense>
  );
}