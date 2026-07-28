import SectionHeader from "@/components/ui/section-header";
import { processHeader, steps } from "@/data/public/process";

export default function Process() {
  const content = processHeader;

  return (
    <section id="how-it-works" className="bg-slate-50 py-28 px-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-20">
          <SectionHeader
            variant={content.variant}
            title={content.title}
            subtitle={content.subtitle}
          />
        </div>
        <div className="relative grid gap-14 md:grid-cols-3 md:gap-10">
          <div className="absolute left-[16.66%] right-[16.66%] top-10 hidden h-px bg-gradient-to-r from-transparent via-emerald-300 to-transparent md:block" />
          {steps.map((step, i) => {
            const Icon = step.icon;
            return (
              <div key={i} className="relative flex flex-col items-center text-center">
                <div className="relative mb-6 md:mb-8 flex items-center justify-center">
                  <div className="flex h-16 w-16 md:h-20 md:w-20 items-center justify-center rounded-[1.35rem] md:rounded-[1.75rem] bg-gradient-to-br from-emerald-500 to-green-600 text-white shadow-lg md:shadow-xl shadow-emerald-500/20 md:shadow-emerald-500/25">
                    <Icon className="h-6 w-6 md:h-8 md:w-8" />
                  </div>
                  <div className="absolute -right-3 -top-3 md:-right-4 md:-top-4 flex h-9 min-w-9 md:h-11 md:min-w-11 items-center justify-center rounded-full bg-emerald-500 px-2.5 md:px-3 text-xs md:text-sm font-black tracking-wide text-white shadow-lg shadow-emerald-500/25 md:shadow-emerald-500/30">
                    {step.num}
                  </div>
                </div>
                <h3 className="mb-3 font-heading text-lg md:text-2xl font-black text-slate-900">
                  {step.title}
                </h3>
                <p className="max-w-sm text-slate-500 leading-relaxed text-sm md:text-base">
                  {step.desc}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}