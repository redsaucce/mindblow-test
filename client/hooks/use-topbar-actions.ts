"use client";

import { useEffect, useSyncExternalStore, type ReactNode } from "react";

/**
 * Lets a page register content (e.g. a filter dropdown) into Topbar's
 * actions slot, even though Topbar lives in (dashboard)/layout.tsx — a
 * different file the page can't reach into directly. Same external-store
 * shape as hooks/use-modal.ts, just holding a ReactNode instead of
 * primitive state.
 */
let actions: ReactNode = null;
const listeners = new Set<() => void>();

function setActions(node: ReactNode) {
  actions = node;
  listeners.forEach((listener) => listener());
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function getSnapshot() {
  return actions;
}

/** Read the currently registered topbar actions. Used by Topbar itself. */
export function useTopbarActions() {
  return useSyncExternalStore(subscribe, getSnapshot, () => null);
}

/**
 * Register content to render in the topbar while this component stays
 * mounted. Clears automatically on unmount, so navigating to another
 * page never leaves a stale filter/action behind.
 */
export function useSetTopbarActions(node: ReactNode) {
  useEffect(() => {
    setActions(node);
    return () => setActions(null);
  }, [node]);
}