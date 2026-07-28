"use client";

import { useEffect, useRef, useState } from "react";

interface UseAutoPageSizeOptions {
  rowHeight: number;
  /** Exact Tailwind value for the table's thead row height (h-12 = 48). */
  theadHeight?: number;
  /** Exact Tailwind value for the page's bottom padding below the table. */
  bottomPadding?: number;
  fadeMs?: number;
  /** Reset to page 0 whenever this changes — e.g. a filter/tab value. */
  resetKey?: unknown;
}

/**
 * Shared logic behind user-list.tsx and activity-logs.tsx's tables:
 * auto-fills the table with as many rows as actually fit on screen
 * (never scrollable), and fades between page/row-count changes instead
 * of jumping instantly.
 *
 * Row count is computed by measuring the table's real on-screen position
 * and the footer's real rendered height directly (via the returned refs),
 * not by subtracting guessed pixel constants for topbar/page-padding/etc
 * — those guesses drift out of sync whenever a page's chrome changes.
 * theadHeight/bottomPadding are the only two constants used here, and
 * both are exact Tailwind values, not guesses.
 */
export function useAutoPageSize({
  rowHeight,
  theadHeight = 48,
  bottomPadding = 24,
  fadeMs = 120,
  resetKey,
}: UseAutoPageSizeOptions) {
  const tableRef = useRef<HTMLTableElement>(null);
  const footerRef = useRef<HTMLDivElement>(null);

  const [pagination, setPagination] = useState({ pageIndex: 0, pageSize: 9 });
  const [isFading, setIsFading] = useState(false);
  const fadeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  // Mirrors pagination.pageSize so the resize handler can compare against
  // it without going through setPagination's functional form (which can't
  // cleanly trigger the fade side effect from inside the updater).
  const pageSizeRef = useRef(pagination.pageSize);

  const goToPage = (targetIndex: number) => {
    if (fadeTimer.current) clearTimeout(fadeTimer.current);
    setIsFading(true);
    fadeTimer.current = setTimeout(() => {
      setPagination((prev) => ({ ...prev, pageIndex: targetIndex }));
      setIsFading(false);
    }, fadeMs);
  };

  useEffect(() => {
    return () => {
      if (fadeTimer.current) clearTimeout(fadeTimer.current);
    };
  }, []);

  // Reset to page 1 whenever resetKey changes (e.g. switching filter tabs).
  useEffect(() => {
    setPagination((prev) => ({ ...prev, pageIndex: 0 }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [resetKey]);

  useEffect(() => {
    let rafId: number;

    const computeCount = () => {
      const tableEl = tableRef.current;
      const footerEl = footerRef.current;
      if (!tableEl || !footerEl) return pageSizeRef.current;

      const tableTop = tableEl.getBoundingClientRect().top;
      const footerHeight = footerEl.offsetHeight;
      const available =
        window.innerHeight - tableTop - theadHeight - footerHeight - bottomPadding;
      return Math.max(1, Math.floor(available / rowHeight));
    };

    const initialCount = computeCount();
    setPagination((prev) =>
      prev.pageSize === initialCount ? prev : { pageIndex: 0, pageSize: initialCount }
    );
    pageSizeRef.current = initialCount;

    const applyResize = () => {
      const count = computeCount();
      if (count === pageSizeRef.current) return;

      if (fadeTimer.current) clearTimeout(fadeTimer.current);
      setIsFading(true);
      fadeTimer.current = setTimeout(() => {
        setPagination({ pageIndex: 0, pageSize: count });
        pageSizeRef.current = count;
        setIsFading(false);
      }, fadeMs);
    };

    const onResize = () => {
      cancelAnimationFrame(rafId);
      rafId = requestAnimationFrame(applyResize);
    };

    window.addEventListener("resize", onResize);
    return () => {
      window.removeEventListener("resize", onResize);
      cancelAnimationFrame(rafId);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return { pagination, setPagination, isFading, goToPage, tableRef, footerRef };
}