"use client";

import { useEffect, useMemo, useRef, useState, type RefObject } from "react";
import { usePathname } from "next/navigation";

interface ScrollMetrics {
  scrollPos: number;
  maxScroll: number;
  viewportHeight: number;
  scrollable: boolean;
}

interface ScrollBarProps {
  /**
   * When provided, tracks this element's own scroll instead of the
   * window's. The element needs `position: relative` (or similar) so
   * the thumb — positioned `absolute` in this mode — tracks correctly
   * within it, rather than `fixed` to the viewport.
   */
  containerRef?: RefObject<HTMLElement | null>;
}

export default function ScrollBar({ containerRef }: ScrollBarProps = {}) {
  const pathname = usePathname();
  const hideTimer = useRef<number | null>(null);
  const [metrics, setMetrics] = useState<ScrollMetrics>({
    scrollPos: 0,
    maxScroll: 1,
    viewportHeight: 0,
    scrollable: false,
  });
  const [scrolling, setScrolling] = useState(false);

  useEffect(() => {
    const target = containerRef?.current;

    const update = () => {
      let scrollPos: number;
      let maxScroll: number;
      let viewportHeight: number;

      if (target) {
        viewportHeight = target.clientHeight;
        scrollPos = target.scrollTop;
        maxScroll = Math.max(target.scrollHeight - viewportHeight, 1);
      } else {
        const doc = document.documentElement;
        viewportHeight = window.innerHeight;
        scrollPos = window.scrollY || doc.scrollTop;
        maxScroll = Math.max(doc.scrollHeight - viewportHeight, 1);
      }

      setMetrics({
        scrollPos,
        maxScroll,
        viewportHeight,
        scrollable: maxScroll > 32,
      });
      setScrolling(true);
      if (hideTimer.current) window.clearTimeout(hideTimer.current);
      hideTimer.current = window.setTimeout(() => {
        setScrolling(false);
      }, 650);
    };

    update();

    const scrollTarget: HTMLElement | Window = target ?? window;
    scrollTarget.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", update);
    return () => {
      scrollTarget.removeEventListener("scroll", update);
      window.removeEventListener("resize", update);
      if (hideTimer.current) window.clearTimeout(hideTimer.current);
    };
  }, [pathname, containerRef]);

  const trackHeight = useMemo(() => {
    return Math.max(metrics.viewportHeight, 160);
  }, [metrics.viewportHeight]);

  const thumbHeight = useMemo(() => {
    const pageHeight = metrics.maxScroll + metrics.viewportHeight;
    const ratio = metrics.viewportHeight / pageHeight;
    return Math.max(trackHeight * ratio, 56);
  }, [metrics.maxScroll, metrics.viewportHeight, trackHeight]);

  const thumbTop = useMemo(() => {
    const progress = metrics.scrollPos / metrics.maxScroll;
    return progress * Math.max(trackHeight - thumbHeight, 0);
  }, [metrics.scrollPos, metrics.maxScroll, trackHeight, thumbHeight]);

  if (!metrics.scrollable) return null;

  const wrapperClassName = containerRef
    ? "absolute inset-y-0 right-[2px] z-20 transition-opacity duration-300 pointer-events-none"
    : "fixed inset-y-0 right-[2px] z-[70] hidden md:block transition-opacity duration-300 pointer-events-none";

  return (
    <div
      className={`${wrapperClassName} ${scrolling ? "opacity-100" : "opacity-0"}`}
      aria-hidden="true"
    >
      <div className="relative h-full w-2 overflow-visible">
        <div
          className="absolute right-0 w-2 rounded-l-full bg-gradient-to-b from-emerald-500 to-green-700 shadow-[0_0_0_1px_rgba(255,255,255,0.14)]"
          style={{
            top: thumbTop,
            height: thumbHeight,
          }}
        />
      </div>
    </div>
  );
}