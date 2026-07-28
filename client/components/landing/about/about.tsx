"use client";

import { ChevronDown, ImageOff } from "lucide-react";
import {
  storyIntro,
  aboutInfoCards,
  aboutHero,
  aboutMedia,
  storyToggleLabels,
} from "@/data/landing/about";
import { useToggle } from "@/hooks/use-toggle";

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

export default function About() {
  return (
    <main className="font-sans text-slate-900 bg-slate-50">
      <section className="relative overflow-hidden bg-gradient-to-br from-white via-emerald-50/70 to-slate-50 py-24 md:py-32 px-6">
        <div className="absolute top-1/4 left-1/4 w-[500px] h-[500px] rounded-full bg-emerald-500/10 blur-3xl pointer-events-none" />
        <div className="absolute bottom-1/4 right-1/4 w-[420px] h-[420px] rounded-full bg-green-500/12 blur-3xl pointer-events-none" />
        <div className="absolute top-1/2 right-1/3 w-[320px] h-[320px] rounded-full bg-emerald-300/14 blur-3xl pointer-events-none" />
        <div className="absolute top-[16%] right-[12%] w-32 h-32 rounded-full bg-green-300/14 blur-3xl pointer-events-none" />
        <div className="absolute bottom-[18%] left-[12%] w-24 h-24 rounded-full bg-emerald-500/10 blur-2xl pointer-events-none" />

        <div className="relative mx-auto text-center">
          <h1 className="font-heading text-3xl md:text-6xl font-black text-green-950 mb-6 leading-tight">
            {aboutHero.title}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-600 to-green-700">
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
            <div className="aspect-[4/3] rounded-3xl bg-gradient-to-br from-slate-200 to-slate-100 border border-slate-200 flex flex-col items-center justify-center text-slate-400 overflow-hidden">
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