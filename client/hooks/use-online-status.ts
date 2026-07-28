"use client";

import { useEffect, useState } from "react";

/**
 * Wraps navigator.onLine + the online/offline browser events. Fully
 * standalone — no dependency on services/ or any fetch wrapper, since
 * that layer doesn't exist yet. Once real services exist and start
 * throwing { code: "NETWORK" } on failed requests, this hook and that
 * classification can work side by side: this catches "the browser
 * itself has no connection," that catches "a specific request failed."
 *
 * Note: navigator.onLine only reflects whether the device is connected
 * to *a* network, not whether that network actually has working
 * internet — so this can report `true` while a request still fails.
 */
export function useOnlineStatus() {
  // Defaults to true to avoid a hydration mismatch (navigator isn't
  // available during SSR) — corrected immediately in the effect below.
  const [isOnline, setIsOnline] = useState(true);

  useEffect(() => {
    setIsOnline(navigator.onLine);

    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  return isOnline;
}