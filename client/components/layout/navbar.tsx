"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Brain, ExternalLink, X, Menu } from "lucide-react";
import { navbar as copy } from "@/data/layout/navbar";
import { useModal } from "@/hooks/use-modal";
import { useToggle } from "@/hooks/use-toggle";

const SECTION_IDS = copy.links
  .filter((l) => l.section)
  .map((l) => l.section as string);

export default function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const { openAuth } = useModal();

  const [activeSection, setActiveSection] = useState<string | null>(null);
  const {
    value: mobileOpen,
    toggle: toggleMobile,
    close: closeMobile,
  } = useToggle(false);

  // Suppresses scroll-based active-section detection right after a nav
  // click, so the link you clicked stays highlighted through the smooth
  // scroll instead of flickering through every section it passes.
  const isNavigatingRef = useRef(false);
  const navigatingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const updateActiveSection = useCallback(() => {
    if (isNavigatingRef.current) return;

    if (pathname !== "/") {
      setActiveSection(null);
      return;
    }

    let found: string | null = null;
    for (const id of SECTION_IDS) {
      const el = document.getElementById(id);
      if (el) {
        const rect = el.getBoundingClientRect();
        if (rect.top <= 100 && rect.bottom >= 100) {
          found = id;
          break;
        }
      }
    }
    setActiveSection(found);
  }, [pathname]);

  useEffect(() => {
    updateActiveSection();
    window.addEventListener("scroll", updateActiveSection, { passive: true });
    return () => window.removeEventListener("scroll", updateActiveSection);
  }, [updateActiveSection]);

  useEffect(() => {
    return () => {
      if (navigatingTimeoutRef.current) clearTimeout(navigatingTimeoutRef.current);
    };
  }, []);

  useEffect(() => {
    closeMobile();
  }, [pathname, closeMobile]);

  const handleClick = (
    e: React.MouseEvent,
    to: string,
    section: string | null
  ) => {
    e.preventDefault();
    closeMobile();

    isNavigatingRef.current = true;
    if (navigatingTimeoutRef.current) clearTimeout(navigatingTimeoutRef.current);
    navigatingTimeoutRef.current = setTimeout(() => {
      isNavigatingRef.current = false;
    }, 700);

    if (!section) {
      // Only Home relies on activeSection === null to look active — a
      // click on any other no-section link (e.g. About Us) must never
      // touch activeSection, or Home would briefly flash active during
      // the page transition (pathname hasn't updated yet on this tick).
      if (to === "/") {
        setActiveSection(null);
      }
      if (to === pathname) {
        window.scrollTo({ top: 0, behavior: "instant" });
      } else {
        router.push(to);
      }
      return;
    }

    setActiveSection(section);

    if (pathname === "/") {
      document.getElementById(section)?.scrollIntoView({ behavior: "smooth" });
    } else {
      // scroll: false stops Next's default scroll-to-top on navigation —
      // without it, the page briefly renders at the top of Home before
      // our own scrollIntoView jumps to the section, which reads as an
      // unwanted scroll animation instead of landing directly there.
      router.push("/", { scroll: false });
      setTimeout(() => {
        document.getElementById(section)?.scrollIntoView({ behavior: "instant" });
      }, 100);
    }
  };

  const isLinkActive = (link: (typeof copy.links)[number]) => {
    if (link.section) {
      return pathname === "/" && activeSection === link.section;
    }

    if (link.label === "Home") {
      return pathname === "/" && activeSection === null;
    }

    return pathname === link.to;
  };

  return (
    <>
      <nav className="sticky top-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-lg border-b border-slate-100 shadow-sm shadow-slate-200/50">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-emerald-600 to-green-700 flex items-center justify-center shadow-md shadow-emerald-700/20 md:shadow-lg md:shadow-emerald-600/30">
              <Brain className="w-4 h-4 text-white" strokeWidth={2.2} />
            </div>
            <span className="font-heading font-bold text-lg text-slate-700">
              {copy.brand}
            </span>
          </Link>

          <div className="hidden lg:flex items-center gap-8">
            {copy.links.map((link) => {
              const active = isLinkActive(link);
              return (
                <a
                  key={link.label}
                  href={link.section ? `#${link.section}` : link.to}
                  onClick={(e) => handleClick(e, link.to, link.section)}
                  className={`pb-1 border-b-2 text-sm font-medium transition-colors duration-200 focus-visible:outline-none focus-visible:border-green-700 focus-visible:text-green-700 focus-visible:ring-2 focus-visible:ring-green-700/20 focus-visible:ring-offset-2 focus-visible:ring-offset-white ${
                    active
                      ? "text-green-700 border-green-700"
                      : "text-slate-600 border-transparent hover:text-green-700 hover:border-green-700"
                  }`}
                >
                  {link.label}
                </a>
              );
            })}
          </div>

          <button
            onClick={openAuth}
            className="hidden lg:inline-flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold px-5 py-2.5 rounded-xl shadow-lg shadow-emerald-600/25 transition-all hover:shadow-emerald-600/40"
          >
            {copy.ctaLabel}
            <ExternalLink className="w-4 h-4" />
          </button>

          <button
            onClick={toggleMobile}
            aria-label="Toggle menu"
            className="lg:hidden w-9 h-9 rounded-lg bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-700 transition-colors"
          >
            {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </nav>

      <div
        className={`lg:hidden fixed inset-0 z-[60] w-full bg-white shadow-2xl transform transition-transform duration-300 ease-in-out ${
          mobileOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex h-full flex-col">
          <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-emerald-600 to-green-700 flex items-center justify-center shadow-md shadow-emerald-700/20">
                <Brain className="w-4 h-4 text-white" strokeWidth={2.2} />
              </div>
              <span className="font-heading font-bold text-lg text-slate-700">
                {copy.brand}
              </span>
            </div>
            <button
              onClick={closeMobile}
              aria-label="Close menu"
              className="w-9 h-9 rounded-lg bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-700 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto px-6 py-6 flex flex-col">
            {copy.links.map((link) => {
              const active = isLinkActive(link);
              return (
                <a
                  key={link.label}
                  href={link.section ? `#${link.section}` : link.to}
                  onClick={(e) => handleClick(e, link.to, link.section)}
                  className={`py-3 px-4 rounded-xl text-sm sm:text-base font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-green-700/25 ${
                    active
                      ? "text-green-700 bg-emerald-50"
                      : "text-slate-700 hover:text-green-700 hover:bg-slate-50"
                  }`}
                >
                  {link.label}
                </a>
              );
            })}

            <div className="my-4 h-px bg-slate-200" />

            <button
              onClick={() => {
                closeMobile();
                openAuth();
              }}
              className="w-full inline-flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold px-5 py-3 rounded-xl shadow-lg shadow-emerald-600/25 transition-all"
            >
              {copy.ctaLabel}
              <ExternalLink className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </>
  );
}