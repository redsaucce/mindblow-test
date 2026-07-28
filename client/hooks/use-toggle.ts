"use client";

import { useCallback, useState } from "react";

/**
 * Local boolean toggle — each call is its own independent state,
 * unlike useModal() which shares one state across every caller.
 */
export function useToggle(initial = false) {
  const [value, setValue] = useState(initial);

  const toggle = useCallback(() => setValue((v) => !v), []);
  const open = useCallback(() => setValue(true), []);
  const close = useCallback(() => setValue(false), []);

  return { value, toggle, open, close } as const;
}