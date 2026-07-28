"use client";

import { useCallback, useRef, useState } from "react";

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

interface UseEmailSubmitOptions<TState extends string> {
  idleState: TState;
  loadingState: TState;
  rateLimitState: TState;
  /** If omitted, an invalid email on submit is silently ignored — use
   * this when the caller already shows its own inline validation
   * (e.g. auth.tsx's live touched/focused error text). */
  invalidState?: TState;
  /** Called once the email is valid and not already in the rate-limit
   * set. `state` has already been set to `loadingState` by this point —
   * the caller is responsible for the timeout/random-outcome logic and
   * calling `setState` with the result. */
  onSubmit: (normalizedEmail: string) => void;
}

/**
 * Shared submit flow for one-field email forms: validates, tracks
 * already-submitted emails for a simple client-side rate limit, and
 * hands off to the caller once a submission is accepted. The caller
 * owns whatever states come after `loadingState` (success/warning/
 * error/etc) since those differ between auth.tsx and newsletter.tsx.
 */
export function useEmailSubmit<TState extends string>({
  idleState,
  loadingState,
  rateLimitState,
  invalidState,
  onSubmit,
}: UseEmailSubmitOptions<TState>) {
  const [email, setEmail] = useState("");
  const [state, setState] = useState<TState>(idleState);
  const requestedEmailsRef = useRef<Set<string>>(new Set());

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

      if (requestedEmailsRef.current.has(normalizedEmail)) {
        setState(rateLimitState);
        return;
      }

      requestedEmailsRef.current.add(normalizedEmail);
      setState(loadingState);
      onSubmit(normalizedEmail);
    },
    [email, state, invalidState, rateLimitState, loadingState, onSubmit]
  );

  return {
    email,
    setEmail,
    state,
    setState,
    requestedEmailsRef,
    handleSubmit,
    reset,
  };
}