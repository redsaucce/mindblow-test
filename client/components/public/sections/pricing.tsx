"use client";

import { ExternalLink } from "lucide-react";
import SectionHeader from "@/components/ui/section-header";
import { pricingHeader, pricingCta } from "@/data/public/pricing";
import { useModal } from "@/hooks/use-modal";

export default function Pricing() {
  const { openAuth } = useModal();

  const content = pricingHeader;

  return (
    <section id="pricing" className="bg-white">
      <div className="relative overflow-hidden px-6 py-28">
        <div className="absolute inset-0 bg-gradient-to-br from-emerald-700 via-green-700 to-green-900" />
        <div className="absolute -top-20 -right-20 w-64 h-64 rounded-full bg-white/10 blur-3xl pointer-events-none" />
        <div className="absolute -bottom-20 -left-20 w-64 h-64 rounded-full bg-green-300/10 blur-3xl pointer-events-none" />
        <div className="relative max-w-5xl mx-auto">
          <SectionHeader
            variant={content.variant}
            title={content.title}
            subtitle={content.subtitle}
          />
          <div className="mt-8 text-center max-w-sm mx-auto sm:max-w-none">
            <button
              type="button"
              onClick={openAuth}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-white hover:bg-emerald-50 text-emerald-700 font-bold px-6 sm:px-8 py-3 sm:py-4 rounded-2xl shadow-xl shadow-emerald-900/20 transition-all duration-200 text-sm sm:text-base"
            >
              {pricingCta}
              <ExternalLink className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}