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
  /**
   * Called with the fitted row count once measured (mount) and whenever
   * it changes (resize). Used by server/manual-pagination callers to know
   * how many rows to request per page, since in that mode DataTable can't
   * just re-slice already-loaded data — it has to ask the server for the
   * right amount up front, before the first fetch even happens.
   */
  onFitChange?: (rowsThatFit: number) => void;
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
 *
 * The fitted count itself is never a hardcoded/guessed number. The very
 * first measurement runs against a fixed one-row skeleton (rendered by
 * DataTable before any data or fetch exists), so it reflects real
 * available space from the start — not a previous guess, and not the
 * table's own current row count (which would be self-referential: the
 * table's height depends on how many rows are in it, so measuring against
 * whatever's currently rendered never reliably converges on "exactly
 * fills the viewport").
 */
export function useAutoPageSize({
  rowHeight,
  theadHeight = 48,
  bottomPadding = 24,
  fadeMs = 120,
  resetKey,
  onFitChange,
}: UseAutoPageSizeOptions) {
  const tableRef = useRef<HTMLTableElement>(null);
  const footerRef = useRef<HTMLDivElement>(null);

  const [pagination, setPagination] = useState<{ pageIndex: number; pageSize: number | null }>({
    pageIndex: 0,
    pageSize: null,
  });
  const [isFading, setIsFading] = useState(false);
  const fadeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  // Mirrors pagination.pageSize so the resize handler can compare against
  // it without going through setPagination's functional form (which can't
  // cleanly trigger the fade side effect from inside the updater).
  const pageSizeRef = useRef<number | null>(null);

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

  const computeCount = () => {
    const tableEl = tableRef.current;
    const footerEl = footerRef.current;
    if (!tableEl || !footerEl) return null;

    const tableTop = tableEl.getBoundingClientRect().top;
    const footerHeight = footerEl.offsetHeight;
    const available =
      window.innerHeight - tableTop - theadHeight - footerHeight - bottomPadding;
    return Math.max(1, Math.floor(available / rowHeight));
  };

  // Single source of truth for the fitted row count: measured once against
  // a fixed one-row skeleton that DataTable renders before any data or
  // fetch exists (see DataTable's `isMeasuring` prop). Because the
  // skeleton is always exactly one row tall regardless of what `data`
  // ends up being, tableTop/footerHeight reflect real page chrome, not a
  // table that's artificially short (loading state) or self-referentially
  // sized to whatever the previous guess happened to be. This runs once,
  // then only reacts to window resizes — it does NOT re-run when data
  // changes, since data length should never influence how much space is
  // available in the first place.
  useEffect(() => {
    const rafId = requestAnimationFrame(() => {
      const count = computeCount();
      if (count === null) return;
      pageSizeRef.current = count;
      setPagination((prev) => ({ ...prev, pageSize: count }));
      onFitChange?.(count);
    });
    return () => cancelAnimationFrame(rafId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    let rafId: number;

    // This effect only handles window resizes. The initial measurement
    // happens in the effect above, once, against the fixed one-row
    // skeleton DataTable renders before any fetch — never against real
    // data, so it can't be thrown off by how many rows a previous guess
    // happened to request.
    const applyResize = () => {
      const count = computeCount();
      if (count === null || count === pageSizeRef.current) return;

      if (fadeTimer.current) clearTimeout(fadeTimer.current);
      setIsFading(true);
      fadeTimer.current = setTimeout(() => {
        setPagination((prev) => ({ ...prev, pageSize: count }));
        pageSizeRef.current = count;
        setIsFading(false);
        onFitChange?.(count);
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