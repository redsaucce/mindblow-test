"use client";

import { useEffect, useState } from "react";
import { ExternalLink, ChevronDown, ArrowDown } from "lucide-react";
import { heroContent } from "@/data/public/hero";
import { useModal } from "@/hooks/use-modal";

/* ------------------------------------------------------------------ */
/*  Skeleton primitives                                                */
/* ------------------------------------------------------------------ */

function SkeletonBlock({ className = "" }: { className?: string }) {
  return (
    <div
      className={`animate-pulse rounded-md bg-slate-200/80 ${className}`}
    />
  );
}

function ProcessIllustrationSkeleton() {
  return (
    <div className="relative mx-auto w-full max-w-xl">
      <div className="space-y-3">
        {Array.from({ length: 3 }).map((_, index) => (
          <div key={index}>
            <div className="flex items-center gap-4 rounded-2xl border border-slate-100 bg-white p-8 shadow-sm">
              <SkeletonBlock className="h-10 w-10 shrink-0 rounded-lg" />
              <div className="min-w-0 flex-1 space-y-2">
                <SkeletonBlock className="h-3.5 w-1/2" />
                <SkeletonBlock className="h-3 w-3/4" />
              </div>
            </div>
            {index < 2 ? (
              <div className="flex justify-center py-1.5">
                <ArrowDown className="h-6 w-6 text-slate-200" />
              </div>
            ) : null}
          </div>
        ))}
      </div>
    </div>
  );
}

function HeroSkeleton() {
  return (
    <section className="relative overflow-hidden bg-gradient-to-br from-white via-emerald-50/70 to-slate-50 min-h-[calc(100vh-65px)] flex items-center">
      {/* Glowing blobs (kept for visual continuity) */}
      <div className="absolute top-1/4 left-1/4 h-[500px] w-[500px] rounded-full bg-emerald-500/10 blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 h-[420px] w-[420px] rounded-full bg-green-500/12 blur-3xl pointer-events-none" />
      <div className="absolute top-1/2 right-1/3 h-[320px] w-[320px] rounded-full bg-emerald-300/14 blur-3xl pointer-events-none" />
      <div className="absolute top-[16%] right-[12%] h-32 w-32 rounded-full bg-green-300/14 blur-3xl pointer-events-none" />
      <div className="absolute bottom-[18%] left-[12%] h-24 w-24 rounded-full bg-emerald-500/10 blur-2xl pointer-events-none" />

      <div className="relative max-w-7xl mx-auto px-6 pt-16 pb-24 w-full">
        <div className="grid items-center gap-10 lg:grid-cols-[65%_35%] lg:gap-12">
          <div className="max-w-3xl text-center lg:text-left">
            {/* Title lines */}
            <div className="mb-6 flex flex-col items-center gap-3 lg:items-start">
              <SkeletonBlock className="h-10 w-3/4 md:h-14 md:w-2/3 xl:h-16" />
              <SkeletonBlock className="h-10 w-2/3 md:h-14 md:w-1/2 xl:h-16" />
            </div>

            {/* Subtitle */}
            <div className="mx-auto mb-10 flex max-w-2xl flex-col items-center gap-2 lg:items-start">
              <SkeletonBlock className="h-4 w-full" />
              <SkeletonBlock className="h-4 w-11/12" />
              <SkeletonBlock className="h-4 w-2/3" />
            </div>

            {/* Buttons */}
            <div className="mx-auto flex w-full max-w-sm flex-col items-stretch gap-3 sm:flex-row sm:items-center sm:justify-center sm:gap-4 lg:mx-0 lg:justify-start sm:max-w-none sm:w-auto mb-14">
              <SkeletonBlock className="h-12 w-full rounded-2xl sm:h-14 sm:w-40" />
              <SkeletonBlock className="h-12 w-full rounded-2xl sm:h-14 sm:w-40" />
            </div>
          </div>

          <div className="hidden lg:flex w-full items-center justify-center">
            <ProcessIllustrationSkeleton />
          </div>
        </div>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/*  Real content                                                       */
/* ------------------------------------------------------------------ */

function ProcessIllustration() {
  return (
    <div className="relative mx-auto w-full max-w-xl">
      <div className="relative">
        <div className="space-y-3">
          {heroContent.process.map((item, index) => {
            const Icon = item.icon;
            const isProcessing = index === 1;
            return (
              <div key={item.title}>
                <div
                  className={`flex items-center gap-4 rounded-2xl p-8 shadow-sm ${
                    isProcessing
                      ? "border border-emerald-700 bg-gradient-to-r from-emerald-600 to-green-700"
                      : "border border-slate-100 bg-white"
                  }`}
                >
                  <div
                    className={`flex h-10 w-10 items-center justify-center rounded-lg shadow-lg ${
                      isProcessing
                        ? "bg-white text-emerald-700 shadow-emerald-900/20"
                        : `bg-gradient-to-br ${item.tone} text-white shadow-emerald-500/20`
                    }`}
                  >
                    <Icon className="h-5 w-5" />
                  </div>
                  <div className="min-w-0">
                    <p className={`text-sm font-bold ${isProcessing ? "text-white" : "text-slate-900"}`}>
                      {item.title}
                    </p>
                    <p className={`text-xs ${isProcessing ? "text-white/75" : "text-slate-500"}`}>
                      {item.desc}
                    </p>
                  </div>
                </div>
                {index < heroContent.process.length - 1 ? (
                  <div className="flex justify-center py-1.5 text-emerald-400">
                    <ArrowDown className="h-6 w-6" />
                  </div>
                ) : null}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Hero                                                                */
/* ------------------------------------------------------------------ */

export default function Hero({ isLoading }: { isLoading?: boolean } = {}) {
  const { openAuth } = useModal();

  // Falls back to a "mounted" flag so the skeleton shows briefly on
  // initial page load even if no external isLoading prop is passed in.
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);

  const showSkeleton = isLoading ?? !mounted;

  if (showSkeleton) {
    return <HeroSkeleton />;
  }

  return (
    <section className="relative overflow-hidden bg-gradient-to-br from-white via-emerald-50/70 to-slate-50 min-h-[calc(100vh-65px)] flex items-center">
      {/* Glowing blobs */}
      <div className="absolute top-1/4 left-1/4 h-[500px] w-[500px] rounded-full bg-emerald-500/10 blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 h-[420px] w-[420px] rounded-full bg-green-500/12 blur-3xl pointer-events-none" />
      <div className="absolute top-1/2 right-1/3 h-[320px] w-[320px] rounded-full bg-emerald-300/14 blur-3xl pointer-events-none" />
      <div className="absolute top-[16%] right-[12%] h-32 w-32 rounded-full bg-green-300/14 blur-3xl pointer-events-none" />
      <div className="absolute bottom-[18%] left-[12%] h-24 w-24 rounded-full bg-emerald-500/10 blur-2xl pointer-events-none" />

      <div className="relative max-w-7xl mx-auto px-6 pt-16 pb-24 w-full">
        <div className="grid items-center gap-10 lg:grid-cols-[65%_35%] lg:gap-12">
          <div className="max-w-3xl text-center lg:text-left">
            <h1 className="font-heading text-4xl md:text-6xl xl:text-7xl font-black text-green-950 leading-[1.05] tracking-tight mb-6">
              {heroContent.titleStart}{" "}
              <span className="relative inline-block">
                <span className="relative z-10 text-transparent bg-clip-text bg-gradient-to-r from-emerald-600 to-green-700">
                  {heroContent.titleHighlight}
                </span>
                <span className="absolute -bottom-1 left-0 right-0 h-1 bg-gradient-to-r from-emerald-500 to-green-700 rounded-full opacity-40" />
              </span>
              <br />
              {heroContent.titleMiddle}{" "}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-lime-500 to-emerald-600">
                {heroContent.titleAccent}
              </span>
            </h1>

            <p className="max-w-2xl text-lg leading-relaxed text-slate-600 mb-10 lg:max-w-2xl">
              {heroContent.subtitle}
            </p>

            <div className="mx-auto flex w-full max-w-sm flex-col items-stretch gap-3 sm:flex-row sm:items-center sm:justify-center sm:gap-4 lg:mx-0 lg:justify-start sm:max-w-none sm:w-auto mb-14">
              <button
                type="button"
                onClick={openAuth}
                className="inline-flex w-full sm:w-auto items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-emerald-600 to-green-700 px-6 py-3 text-sm font-bold text-white shadow-xl shadow-emerald-500/25 transition-all duration-200 hover:from-emerald-500 hover:to-green-600 hover:shadow-emerald-500/40 sm:px-8 sm:py-4 sm:text-base"
              >
                {heroContent.primaryCta}
                <ExternalLink className="h-5 w-5" />
              </button>
              <a
                href="#features"
                onClick={(e) => {
                  e.preventDefault();
                  document
                    .getElementById("features")
                    ?.scrollIntoView({ behavior: "smooth" });
                }}
                className="inline-flex w-full sm:w-auto items-center justify-center gap-2 rounded-2xl border border-green-200 bg-white/70 px-6 py-3 text-sm font-semibold text-green-900 backdrop-blur-sm transition-all duration-200 hover:border-green-300 hover:bg-white hover:text-green-950 sm:py-4"
              >
                {heroContent.secondaryCta}
                <ChevronDown className="h-4 w-4" />
              </a>
            </div>
          </div>

          <div className="hidden lg:flex w-full items-center justify-center">
            <ProcessIllustration />
          </div>
        </div>
      </div>
    </section>
  );
}