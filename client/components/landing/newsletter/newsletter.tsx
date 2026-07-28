"use client";

import { Loader2, Send } from "lucide-react";
import SectionHeader from "@/components/ui/section-header";
import { sectionHeaders } from "@/data/landing/section-headers";
import { newsletter as copy } from "@/data/landing/newsletter";
import { useEmailSubmit } from "@/hooks/use-email-submit";
import { subscribe as subscribeToNewsletter } from "@/services/public/newsletter-service";

type NewsletterState =
  | "idle"
  | "loading"
  | "success"
  | "warning"
  | "error"
  | "rate-limit";

export default function Newsletter() {
  const content = sectionHeaders.newsletter;

  const { email, setEmail, state, setState, handleSubmit } =
    useEmailSubmit<NewsletterState>({
      idleState: "idle",
      loadingState: "loading",
      rateLimitState: "rate-limit",
      invalidState: "warning",
      onSubmit: async (normalizedEmail) => {
        try {
          await subscribeToNewsletter(normalizedEmail);
          setState("success");
          setEmail("");
        } catch {
          setState("error");
        }
      },
    });

  const isLoading = state === "loading";

  const message =
    state === "rate-limit"
      ? copy.rateLimitMessage
      : state === "warning"
        ? copy.validationMessage
        : state === "error"
          ? copy.errorMessage
          : state === "success"
            ? copy.successMessage
            : copy.idleMessage;

  return (
    <div className="mb-12 w-full max-w-4xl mx-auto rounded-[2rem] border border-white/22 bg-white/12 px-4 sm:px-6 py-12 backdrop-blur-2xl shadow-[0_20px_60px_rgba(0,0,0,0.16),inset_0_1px_0_rgba(255,255,255,0.18)]">
      <SectionHeader
        variant={content.variant}
        title={content.title}
        subtitle={content.subtitle}
      />
      <form
        onSubmit={handleSubmit}
        className="mt-8 mx-auto flex w-full max-w-2xl flex-col gap-3 sm:flex-row sm:items-end"
      >
        <label className="flex-1 text-left">
          <span className="mb-2 block text-xs font-semibold uppercase tracking-widest text-white/75">
            {copy.emailLabel}
          </span>
          <input
            type="email"
            value={email}
            onChange={(e) => {
              setEmail(e.target.value);
              if (state !== "idle" && state !== "loading") setState("idle");
            }}
            placeholder={copy.placeholder}
            className="w-full rounded-2xl border border-white/25 bg-white/14 px-4 py-3.5 text-sm text-white/95 placeholder:text-white/45 outline-none transition-all focus:border-emerald-300 focus:bg-white/18"
          />
        </label>
        <button
          type="submit"
          disabled={isLoading}
          className="inline-flex items-center justify-center gap-2 rounded-2xl bg-white hover:bg-emerald-50 px-6 py-3.5 text-sm font-bold text-emerald-700 shadow-xl shadow-emerald-900/20 transition-all duration-200 disabled:opacity-70"
        >
          {isLoading ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              {copy.loadingLabel}
            </>
          ) : (
            <>
              {copy.submitLabel}
              <Send className="h-4 w-4" />
            </>
          )}
        </button>
      </form>
      <p className="mt-3 text-center text-xs text-white/60">{message}</p>
    </div>
  );
}