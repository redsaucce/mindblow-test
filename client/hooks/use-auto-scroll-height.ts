"use client";

import { useEffect, useRef, useState } from "react";

interface UseAutoScrollHeightOptions {
  /** Exact pixel height of whatever sits below the scroll container (e.g. page bottom padding). */
  bottomPadding?: number;
  /** Minimum height to fall back to, in case the measured space is very small. */
  minHeight?: number;
}

/**
 * Same measurement approach as useAutoPageSize (behind user-list.tsx and
 * activity-logs.tsx): measures the container's real on-screen position via
 * getBoundingClientRect().top, not guessed pixel constants for topbar/page
 * padding/etc.
 *
 * Important: the ref returned here must be placed on the OUTER scrollable
 * boundary (the element that should stop growing and start scrolling),
 * not just an inner list. A max-height on a child does nothing to stop
 * page scroll if nothing between it and <body> is height-constrained —
 * the browser will grow the document instead of respecting the child's
 * cap. Giving the outer element itself `max-height` + `overflow-y-auto`
 * makes IT the clipping boundary, so the page can no longer grow past
 * this point and the scrollbar appears here instead of on <body>.
 */
export function useAutoScrollHeight({
  bottomPadding = 24,
  minHeight = 160,
  recomputeKey,
}: UseAutoScrollHeightOptions & { recomputeKey?: unknown } = {}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [maxHeight, setMaxHeight] = useState<number | null>(null);

  useEffect(() => {
    let rafId: number;

    const computeHeight = () => {
      const el = containerRef.current;
      if (!el) return;

      const top = el.getBoundingClientRect().top;
      const viewport = document.documentElement.clientHeight;
      const available = viewport - top - bottomPadding;
      setMaxHeight(Math.max(minHeight, Math.floor(available)));
    };

    // Run after paint so containerRef is attached (it may not exist yet on
    // the very first render, e.g. while a loading/empty state is showing
    // instead of the real list).
    rafId = requestAnimationFrame(computeHeight);

    const onResize = () => {
      cancelAnimationFrame(rafId);
      rafId = requestAnimationFrame(computeHeight);
    };

    window.addEventListener("resize", onResize);
    return () => {
      window.removeEventListener("resize", onResize);
      cancelAnimationFrame(rafId);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [recomputeKey]);

  return { containerRef, maxHeight };
}