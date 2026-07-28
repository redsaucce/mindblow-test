"use client";

import { useSyncExternalStore } from "react";

interface ModalState {
  authOpen: boolean;
  legalOpen: boolean;
  legalType: string;
}

let state: ModalState = {
  authOpen: false,
  legalOpen: false,
  legalType: "",
};

const listeners = new Set<() => void>();

function setState(partial: Partial<ModalState>) {
  state = { ...state, ...partial };
  listeners.forEach((listener) => listener());
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function getSnapshot() {
  return state;
}

export function openAuth() {
  setState({ authOpen: true });
}

export function closeAuth() {
  setState({ authOpen: false });
}

export function openLegal(type: string) {
  setState({ legalOpen: true, legalType: type });
}

export function closeLegal() {
  setState({ legalOpen: false, legalType: "" });
}

/**
 * Shared modal state, toggle-style. No Provider needed — just call
 * useModal() in any client component and it reads/writes the same
 * state as every other caller.
 */
export function useModal() {
  const snapshot = useSyncExternalStore(subscribe, getSnapshot, getSnapshot);

  return {
    ...snapshot,
    openAuth,
    closeAuth,
    openLegal,
    closeLegal,
  };
}