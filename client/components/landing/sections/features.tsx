import SectionHeader from "@/components/ui/section-header";
import { sectionHeaders } from "@/data/landing/section-headers";
import { features } from "@/data/landing/features";

export default function Features() {
  const content = sectionHeaders.features;

  return (
    <section id="features" className="bg-white py-28 px-6">
      <div className="max-w-5xl mx-auto">
        <div className="mb-16">
          <SectionHeader
            variant={content.variant}
            prefix={content.prefix}
            title={content.title}
            subtitle={content.subtitle}
          />
        </div>
        <div className="grid sm:grid-cols-2 gap-8">
          {features.map((f, i) => {
            const Icon = f.icon;
            const palette =
              i % 2 === 0
                ? "bg-gradient-to-br from-emerald-50 to-white border-emerald-100"
                : "bg-gradient-to-br from-green-50 to-white border-green-100";
            return (
              <div
                key={i}
                className={`relative group rounded-3xl p-7 border transition-all duration-300 ${palette}`}
              >
                <div className="w-12 h-12 rounded-2xl flex items-center justify-center mb-5 text-white shadow-lg bg-gradient-to-br from-emerald-600 to-green-700 shadow-emerald-600/25">
                  <Icon className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-bold text-slate-900 mb-2">
                  {f.title}
                </h3>
                <p className="text-slate-500 text-sm leading-relaxed">
                  {f.desc}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}