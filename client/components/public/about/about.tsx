"use client";

import { useEffect, useState } from "react";
import { ChevronDown, ImageOff } from "lucide-react";
import { useToggle } from "@/hooks/use-toggle";
import SkeletonBlock from "@/components/ui/skeleton-block";

const aboutHero = {
  title: "Building the Future of ",
  highlight: "Smart Learning",
  subtitle:
    "MindBlow started with a simple question — what if you could turn any document into an interactive quiz in seconds?",
} as const;

const aboutMedia = {
  placeholderLabel: "Team photo coming soon",
  placeholderLocation: "Bayombong, Nueva Vizcaya",
} as const;

const storyToggleLabels = {
  more: "Read more",
  less: "Read less",
} as const;

const storyIntro = {
  title: "How It All Started",
  preview:
    "MindBlow started with a simple student problem: turning dense notes into useful quiz practice without wasting study time.",
  previewSecondary:
    "Built for college and undergraduate students, it helps turn uploaded study files into focused quiz material without the manual work.",
  detail:
    "At its core, MindBlow is built to make exam prep faster, clearer, and more accessible through AI-powered quiz generation.",
};

const aboutInfoCards = [
  {
    title: "What Drives Us",
    description:
      "We believe everyone deserves access to smart study tools — not just those who can afford expensive tutors or prep courses. Education should be a level playing field. Our mission is to democratize active learning by giving students, teachers, and self-learners a free AI-powered tool that turns any document into a personalized quiz in seconds.",
  },
  {
    title: "Where We're Headed",
    description:
      "MindBlow is just getting started. We're building the future of document-powered learning, one quiz at a time. Our roadmap includes collaborative study rooms, spaced-repetition scheduling, LMS integrations for schools and universities, and deeper analytics to help learners pinpoint exactly where they need to focus.",
  },
];

/* ------------------------------------------------------------------ */
/*  Skeleton primitives                                                 */
/* ------------------------------------------------------------------ */

function InfoCardSkeleton() {
  return (
    <div className="rounded-3xl border border-emerald-100 bg-white p-6 md:p-8 shadow-sm">
      <SkeletonBlock className="h-6 w-2/3 mb-4" />
      <div className="space-y-2">
        <SkeletonBlock className="h-4 w-full" />
        <SkeletonBlock className="h-4 w-full" />
        <SkeletonBlock className="h-4 w-3/4" />
      </div>
    </div>
  );
}

function StorylineSkeleton() {
  return (
    <div className="flex h-full flex-col justify-center">
      <SkeletonBlock className="h-8 w-2/3 md:h-10 mt-3 mb-4" />
      <div className="space-y-3">
        <SkeletonBlock className="h-4 w-full" />
        <SkeletonBlock className="h-4 w-full" />
        <SkeletonBlock className="h-4 w-5/6" />
        <SkeletonBlock className="h-4 w-full" />
        <SkeletonBlock className="h-4 w-2/3" />
      </div>
      <SkeletonBlock className="h-4 w-24 mt-5" />
    </div>
  );
}

function AboutSkeleton() {
  return (
    <main className="font-sans text-slate-900 bg-slate-50">
      <section className="relative overflow-hidden bg-linear-to-br from-white via-emerald-50/70 to-slate-50 py-24 md:py-32 px-6">
        <div className="absolute top-1/4 left-1/4 w-125 h-125 rounded-full bg-emerald-500/10 blur-3xl pointer-events-none" />
        <div className="absolute bottom-1/4 right-1/4 w-105 h-105 rounded-full bg-green-500/12 blur-3xl pointer-events-none" />
        <div className="absolute top-1/2 right-1/3 w-80 h-80 rounded-full bg-emerald-300/14 blur-3xl pointer-events-none" />
        <div className="absolute top-[16%] right-[12%] w-32 h-32 rounded-full bg-green-300/14 blur-3xl pointer-events-none" />
        <div className="absolute bottom-[18%] left-[12%] w-24 h-24 rounded-full bg-emerald-500/10 blur-2xl pointer-events-none" />

        <div className="relative mx-auto flex flex-col items-center text-center">
          <SkeletonBlock className="h-9 w-4/5 max-w-2xl md:h-14 mb-6" />
          <SkeletonBlock className="h-9 w-2/3 max-w-xl md:h-14 mb-6" />
          <div className="flex w-full flex-col items-center gap-2">
            <SkeletonBlock className="h-4 w-full max-w-3xl" />
            <SkeletonBlock className="h-4 w-5/6 max-w-2xl" />
          </div>
        </div>
      </section>

      <section className="py-20 px-6">
        <div className="max-w-6xl mx-auto space-y-12">
          <div className="grid md:grid-cols-2 gap-10 lg:gap-14 items-start">
            <div className="aspect-4/3 rounded-3xl bg-linear-to-br from-emerald-100 to-green-100 border border-emerald-100 animate-pulse" />

            <div className="grid md:grid-cols-2 gap-8 md:gap-10 items-start">
              <div className="md:col-span-2">
                <StorylineSkeleton />
              </div>
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-8 md:gap-10 items-start">
            <InfoCardSkeleton />
            <InfoCardSkeleton />
          </div>
        </div>
      </section>
    </main>
  );
}

/* ------------------------------------------------------------------ */
/*  Real content                                                       */
/* ------------------------------------------------------------------ */

function Storyline() {
  const { value: expanded, toggle: toggleExpanded } = useToggle(false);

  return (
    <div className="flex h-full flex-col justify-center">
      <h2 className="font-heading text-2xl md:text-4xl font-black text-green-800 mt-3 mb-4">
        {storyIntro.title}
      </h2>
      <div className="space-y-4 text-slate-600 leading-relaxed text-base md:text-lg">
        <p>{storyIntro.preview}</p>
        <p>{storyIntro.previewSecondary}</p>
      </div>

      <div
        className={`grid transition-all duration-300 ease-in-out ${
          expanded ? "grid-rows-[1fr] opacity-100 mt-4" : "grid-rows-[0fr] opacity-0"
        }`}
      >
        <div className="overflow-hidden">
          <p className="text-slate-500 text-sm md:text-base leading-relaxed">
            {storyIntro.detail}
          </p>
        </div>
      </div>

      <button
        onClick={toggleExpanded}
        className="inline-flex w-fit items-center gap-1.5 mt-5 text-green-800 hover:text-green-900 text-sm font-semibold transition-colors"
      >
        {expanded ? storyToggleLabels.less : storyToggleLabels.more}
        <ChevronDown
          className={`w-4 h-4 transition-transform duration-200 ${
            expanded ? "rotate-180" : ""
          }`}
        />
      </button>
    </div>
  );
}

function InfoCard({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <div className="rounded-3xl border border-emerald-100 bg-white p-6 md:p-8 shadow-sm">
      <h3 className="font-heading text-2xl md:text-2xl font-black text-green-800 mb-3">
        {title}
      </h3>
      <p className="text-slate-600 leading-relaxed">{description}</p>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  About                                                               */
/* ------------------------------------------------------------------ */

export default function About({ isLoading }: { isLoading?: boolean } = {}) {
  const [minDurationElapsed, setMinDurationElapsed] = useState(false);
  useEffect(() => {
    const timer = setTimeout(() => setMinDurationElapsed(true), 1000);
    return () => clearTimeout(timer);
  }, []);

  const showSkeleton = isLoading ?? !minDurationElapsed;

  if (showSkeleton) {
    return <AboutSkeleton />;
  }

  return (
    <main className="font-sans text-slate-900 bg-slate-50">
      <section className="relative overflow-hidden bg-linear-to-br from-white via-emerald-50/70 to-slate-50 py-24 md:py-32 px-6">
        <div className="absolute top-1/4 left-1/4 w-125 h-125 rounded-full bg-emerald-500/10 blur-3xl pointer-events-none" />
        <div className="absolute bottom-1/4 right-1/4 w-105 h-105 rounded-full bg-green-500/12 blur-3xl pointer-events-none" />
        <div className="absolute top-1/2 right-1/3 w-80 h-80 rounded-full bg-emerald-300/14 blur-3xl pointer-events-none" />
        <div className="absolute top-[16%] right-[12%] w-32 h-32 rounded-full bg-green-300/14 blur-3xl pointer-events-none" />
        <div className="absolute bottom-[18%] left-[12%] w-24 h-24 rounded-full bg-emerald-500/10 blur-2xl pointer-events-none" />

        <div className="relative mx-auto text-center">
          <h1 className="font-heading text-3xl md:text-6xl font-black text-green-950 mb-6 leading-tight">
            {aboutHero.title}
            <span className="text-transparent bg-clip-text bg-linear-to-r from-emerald-600 to-green-700">
              {aboutHero.highlight}
            </span>
          </h1>
          <p className="text-slate-600 text-lg leading-relaxed max-w-none mx-auto">
            {aboutHero.subtitle}
          </p>
        </div>
      </section>

      <section className="py-20 px-6">
        <div className="max-w-6xl mx-auto space-y-12">
          <div className="grid md:grid-cols-2 gap-10 lg:gap-14 items-start">
            <div className="aspect-4/3 rounded-3xl bg-linear-to-br from-slate-200 to-slate-100 border border-slate-200 flex flex-col items-center justify-center text-slate-400 overflow-hidden">
              <ImageOff className="w-16 h-16 mb-3 text-slate-300" />
              <span className="text-sm font-medium">{aboutMedia.placeholderLabel}</span>
              <span className="text-xs mt-1 text-slate-300">
                {aboutMedia.placeholderLocation}
              </span>
            </div>

            <div className="grid md:grid-cols-2 gap-8 md:gap-10 items-start">
              <div className="md:col-span-2">
                <Storyline />
              </div>
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-8 md:gap-10 items-start">
            {aboutInfoCards.map((item) => (
              <InfoCard
                key={item.title}
                title={item.title}
                description={item.description}
              />
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}