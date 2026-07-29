"use client";

import { useCallback, useMemo, useState } from "react";
import {
  Mail,
  ArrowRight,
  Sparkles,
  Loader2,
  CheckCircle2,
  AlertTriangle,
  ShieldAlert,
} from "lucide-react";
import Modal from "@/components/ui/modal";
import { authModal as copy } from "@/data/modal/auth";
import { useModal } from "@/hooks/use-modal";
import { useEmailSubmit } from "@/hooks/use-email-submit";
import { requestMagicLink, ApiError } from "@/services/public/auth-service";

type ModalState = "form" | "loading" | "success" | "warning" | "error" | "rate-limit";

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function renderWithEmail(template: string, email: string) {
  const [before, after] = template.split("{email}");
  if (after === undefined) return <>{template}</>;
  return (
    <>
      {before}
      <span className="font-semibold text-slate-700">{email}</span>
      {after}
    </>
  );
}

export default function AuthModal() {
  const { authOpen, closeAuth } = useModal();

  const [touched, setTouched] = useState(false);
  const [focused, setFocused] = useState(false);
  const [agreedToTerms, setAgreedToTerms] = useState(false);

  const {
    email,
    setEmail,
    state,
    setState,
    handleSubmit: submitEmail,
    reset: resetEmailState,
  } = useEmailSubmit<ModalState>({
    idleState: "form",
    loadingState: "loading",
    rateLimitState: "rate-limit",
    // No invalidState — auth.tsx already blocks submission via its own
    // live touched/focused validation below, so an invalid submit is a
    // silent no-op here, matching the original behavior.
    onSubmit: async (normalizedEmail) => {
      try {
        await requestMagicLink(normalizedEmail);
        setState("success");
      } catch (err) {
        if (err instanceof ApiError && err.status === 429) {
          setState("rate-limit");
          return;
        }
        setState("error");
      }
    },
  });

  const emailError = useMemo(() => {
    if (!touched || focused) return "";
    if (!email.trim()) return copy.emailField.errors.required;
    if (!EMAIL_REGEX.test(email)) return copy.emailField.errors.invalid;
    return "";
  }, [email, touched, focused]);

  const reset = useCallback(() => {
    resetEmailState();
    setTouched(false);
    setFocused(false);
    setAgreedToTerms(false);
  }, [resetEmailState]);

  const handleClose = () => {
    reset();
    closeAuth();
  };

  const handleSubmit = (e: React.FormEvent) => {
    setTouched(true);
    setFocused(false);
    submitEmail(e);
  };

  const handleRetry = () => {
    setState("form");
    setTouched(false);
    setFocused(false);
  };

  const handleUseDifferentEmail = () => {
    setEmail("");
    setState("form");
    setTouched(false);
    setFocused(false);
  };

  const feedbackContent: Record<
    Exclude<ModalState, "form" | "loading">,
    {
      icon: React.ReactNode;
      bg: string;
      title: string;
      desc: React.ReactNode;
      retry?: boolean;
      differentEmail?: boolean;
    }
  > = {
    success: {
      icon: <CheckCircle2 className="w-7 h-7 text-emerald-500" />,
      bg: "bg-emerald-50",
      title: copy.feedback.success.title,
      desc: renderWithEmail(copy.feedback.success.description, email),
    },
    warning: {
      icon: <AlertTriangle className="w-7 h-7 text-amber-500" />,
      bg: "bg-amber-50",
      title: copy.feedback.warning.title,
      desc: copy.feedback.warning.description,
      retry: true,
    },
    error: {
      icon: <ShieldAlert className="w-7 h-7 text-red-500" />,
      bg: "bg-red-50",
      title: copy.feedback.error.title,
      desc: copy.feedback.error.description,
      retry: true,
    },
    "rate-limit": {
      icon: <ShieldAlert className="w-7 h-7 text-orange-500" />,
      bg: "bg-orange-50",
      title: copy.feedback.rateLimit.title,
      desc: renderWithEmail(copy.feedback.rateLimit.description, email),
      differentEmail: true,
    },
  };

  const isForm = state === "form" || state === "loading";
  const isLoading = state === "loading";
  const feedback = !isForm
    ? feedbackContent[state as Exclude<ModalState, "form" | "loading">]
    : null;

  return (
    <Modal
      open={authOpen}
      onClose={handleClose}
      maxWidthClassName="max-w-md"
      contentClassName="p-8 flex flex-col"
      header={
        isForm ? (
          <div className="flex items-center gap-3 px-8 pt-6">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-green-600 flex items-center justify-center shadow-lg shadow-emerald-500/20">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <h2 className="font-heading text-xl font-bold text-slate-900">
              {copy.header.title}
            </h2>
          </div>
        ) : undefined
      }
    >
      {isForm ? (
        <>
          <p className="text-slate-500 text-sm leading-relaxed mb-6">
            {copy.header.subtitle}
          </p>

          <form onSubmit={handleSubmit} className="space-y-4 flex-1 flex flex-col">
            <div>
              <label
                htmlFor="auth-email"
                className="block text-xs font-semibold text-slate-700 mb-1.5 uppercase tracking-wider"
              >
                {copy.emailField.label}
              </label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  id="auth-email"
                  type="email"
                  required
                  placeholder={copy.emailField.placeholder}
                  value={email}
                  onFocus={() => setFocused(true)}
                  onBlur={() => {
                    setFocused(false);
                    setTouched(true);
                  }}
                  onChange={(e) => setEmail(e.target.value)}
                  className={`w-full pl-10 pr-4 py-3 rounded-xl border bg-slate-50 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 transition-all ${
                    emailError
                      ? "border-red-300 focus:ring-red-500/20 focus:border-red-400"
                      : "border-slate-200 focus:ring-emerald-500/30 focus:border-emerald-400"
                  }`}
                />
              </div>
              <p
                className={`mt-1.5 text-[11px] ${
                  emailError ? "text-red-500" : "text-slate-400"
                }`}
              >
                {emailError || copy.emailField.helper}
              </p>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full inline-flex items-center justify-center gap-2 bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-400 hover:to-green-500 text-white font-bold py-3.5 rounded-xl shadow-lg shadow-emerald-500/25 transition-all duration-200 mt-2 disabled:opacity-60 disabled:hover:translate-y-0"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  {copy.submit.loading}
                </>
              ) : (
                <>
                  {copy.submit.idle}
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>

            <p className="text-[11px] text-slate-400 text-center pb-4 leading-relaxed">
              {copy.disclaimer}
            </p>
          </form>
        </>
      ) : feedback ? (
        <div className="flex-1 flex flex-col items-center justify-center text-center">
          <div
            className={`w-16 h-16 rounded-full ${feedback.bg} flex items-center justify-center mb-5`}
          >
            {feedback.icon}
          </div>
          <h2 className="font-heading text-xl font-bold text-slate-900 mb-2">
            {feedback.title}
          </h2>
          <p className="text-slate-500 text-sm leading-relaxed max-w-xs mx-auto">
            {feedback.desc}
          </p>
          {feedback.retry && (
            <button
              onClick={handleRetry}
              className="mt-6 inline-flex items-center gap-2 bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-400 hover:to-green-500 text-white text-sm font-bold px-5 py-2.5 rounded-xl shadow-lg shadow-emerald-500/20 transition-all duration-200 hover:-translate-y-0.5"
            >
              {copy.retryLabel}
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          )}
          {feedback.differentEmail && (
            <button
              onClick={handleUseDifferentEmail}
              className="mt-6 inline-flex items-center gap-2 bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-400 hover:to-green-500 text-white text-sm font-bold px-5 py-2.5 rounded-xl shadow-lg shadow-emerald-500/20 transition-all duration-200 hover:-translate-y-0.5"
            >
              {copy.differentEmailLabel}
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      ) : null}
    </Modal>
  );
}