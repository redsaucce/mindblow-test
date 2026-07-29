"use client";

import { useEffect, useRef, useState } from "react";

interface UseAutoPageSizeOptions {
  rowHeight: number;
  /** Exact Tailwind value for the table's thead row height (h-12 = 48). */
  theadHeight?: number;
  /** Exact pixel height of whatever sits below the scroll wrapper (e.g. page bottom padding). */
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
 * Shared logic behind user-list.tsx and activity-logs.tsx's tables.
 *
 * Same measurement approach as useAutoScrollHeight (behind quiz-list.tsx):
 * measures the scroll wrapper's real on-screen position via
 * getBoundingClientRect().top, not guessed pixel constants for
 * topbar/page-padding/etc. That gives a real `maxHeight` for the wrapper
 * — DataTable applies it as `maxHeight` + `overflow-y-auto` on the
 * element `wrapperRef` is attached to, so the table becomes an actual
 * scrollable region exactly like quiz-list's list, instead of silently
 * growing to however many rows fit and pushing the whole page taller.
 *
 * The row count used for pagination (`pageSize`) is then derived from
 * that same height: `Math.floor(maxHeight / rowHeight)`. Deriving it
 * from the wrapper's real measured height — the same number driving the
 * scroll cap — keeps the two in sync: the page always requests exactly
 * as many rows as the scrollable area can show without needing its own
 * internal scroll, while the wrapper's maxHeight remains the single
 * source of truth for both concerns.
 *
 * The measured height is never a hardcoded/guessed number. The very
 * first measurement runs against a fixed one-row skeleton (rendered by
 * DataTable before any data or fetch exists), so it reflects real
 * available space from the start — not a previous guess, and not the
 * table's own current row count (which would be self-referential: the
 * wrapper's natural height depends on how many rows are in it, so
 * measuring against whatever's currently rendered never reliably
 * converges on "exactly fills the viewport").
 */
export function useAutoPageSize({
  rowHeight,
  theadHeight = 48,
  bottomPadding = 24,
  fadeMs = 120,
  resetKey,
  onFitChange,
}: UseAutoPageSizeOptions) {
  // Attached to the scroll wrapper div that surrounds the table (mirrors
  // useAutoScrollHeight's containerRef) — NOT the <table> element itself,
  // since maxHeight/overflow need to live on the wrapper to actually cap
  // and scroll the table's rendered content.
  const wrapperRef = useRef<HTMLDivElement>(null);
  // The pagination/summary bar renders as a sibling BELOW the scroll
  // wrapper, not inside it, so it still consumes real vertical space that
  // has to be subtracted from the available height — same reasoning as
  // the old tableTop/footerHeight measurement, just relative to the
  // wrapper's top instead of the table's.
  const footerRef = useRef<HTMLDivElement>(null);

  const [pagination, setPagination] = useState<{ pageIndex: number; pageSize: number | null }>({
    pageIndex: 0,
    pageSize: null,
  });
  const [maxHeight, setMaxHeight] = useState<number | null>(null);
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

  // Height-first, same as useAutoScrollHeight: measure the wrapper's real
  // top, subtract from the viewport to get how much vertical space is
  // actually available, and only then convert that into a row count.
  const computeMeasurements = () => {
    const wrapperEl = wrapperRef.current;
    const footerEl = footerRef.current;
    if (!wrapperEl || !footerEl) return null;

    const wrapperTop = wrapperEl.getBoundingClientRect().top;
    const footerHeight = footerEl.offsetHeight;
    const available = window.innerHeight - wrapperTop - footerHeight - bottomPadding;
    const bodyHeight = Math.max(rowHeight, available - theadHeight);
    const rowCount = Math.max(1, Math.floor(bodyHeight / rowHeight));
    return { maxHeight: Math.floor(available), rowCount };
  };

  // Single source of truth for both the scroll cap and the fitted row
  // count: measured once against a fixed one-row skeleton that DataTable
  // renders before any data or fetch exists (see DataTable's `isMeasuring`
  // prop). Because the skeleton is always exactly one row tall regardless
  // of what `data` ends up being, wrapperTop reflects real page chrome,
  // not a wrapper that's artificially short (loading state) or
  // self-referentially sized to whatever the previous guess happened to
  // be. This runs once, then only reacts to window resizes — it does NOT
  // re-run when data changes, since data length should never influence
  // how much space is available in the first place.
  useEffect(() => {
    const rafId = requestAnimationFrame(() => {
      const result = computeMeasurements();
      if (result === null) return;
      pageSizeRef.current = result.rowCount;
      setMaxHeight(result.maxHeight);
      setPagination((prev) => ({ ...prev, pageSize: result.rowCount }));
      onFitChange?.(result.rowCount);
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
      const result = computeMeasurements();
      if (result === null || result.rowCount === pageSizeRef.current) return;

      if (fadeTimer.current) clearTimeout(fadeTimer.current);
      setIsFading(true);
      fadeTimer.current = setTimeout(() => {
        setPagination((prev) => ({ ...prev, pageSize: result.rowCount }));
        setMaxHeight(result.maxHeight);
        pageSizeRef.current = result.rowCount;
        setIsFading(false);
        onFitChange?.(result.rowCount);
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

  return { pagination, setPagination, maxHeight, isFading, goToPage, wrapperRef, footerRef };
}