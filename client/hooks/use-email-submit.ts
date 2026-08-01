"use client";

import { useCallback, useState } from "react";

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

interface UseEmailSubmitOptions<TState extends string> {
  idleState: TState;
  loadingState: TState;
  /** Set by the caller's own onSubmit when the server returns a real
   * rate-limit response (e.g. a 429) — this hook no longer guesses at
   * rate limiting client-side, since the server's cooldown is time-bound
   * (e.g. a magic link's expiry) and a permanent in-memory guess can't
   * reflect that: it never resets on its own, so a genuinely valid resend
   * after the server-side window passed would still get blocked locally
   * before ever reaching the server. */
  rateLimitState: TState;
  /** If omitted, an invalid email on submit is silently ignored — use
   * this when the caller already shows its own inline validation
   * (e.g. auth.tsx's live touched/focused error text). */
  invalidState?: TState;
  /** Called once the email passes local format validation. `state` has
   * already been set to `loadingState` by this point — the caller owns
   * the request itself and is responsible for calling `setState` with
   * the outcome, including routing a real server rate-limit response to
   * `rateLimitState`. */
  onSubmit: (normalizedEmail: string) => void;
}

/**
 * Shared submit flow for one-field email forms: validates the email
 * format and hands off to the caller once it's valid. The caller owns
 * whatever states come after `loadingState` (success/rate-limit/error/
 * etc), and rate limiting itself is a server decision, not something
 * this hook can correctly infer client-side.
 */
export function useEmailSubmit<TState extends string>({
  idleState,
  loadingState,
  invalidState,
  onSubmit,
}: UseEmailSubmitOptions<TState>) {
  const [email, setEmail] = useState("");
  const [state, setState] = useState<TState>(idleState);

  const reset = useCallback(() => {
    setEmail("");
    setState(idleState);
  }, [idleState]);

  const handleSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      if (state === loadingState) return;

      if (!email.trim() || !EMAIL_REGEX.test(email)) {
        if (invalidState) setState(invalidState);
        return;
      }

      const normalizedEmail = email.trim().toLowerCase();

      setState(loadingState);
      onSubmit(normalizedEmail);
    },
    [email, state, invalidState, loadingState, onSubmit]
  );

  return {
    email,
    setEmail,
    state,
    setState,
    handleSubmit,
    reset,
  };
}