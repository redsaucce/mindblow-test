"use client";

import { Brain } from "lucide-react";
import Newsletter from "@/components/landing/newsletter/newsletter";
import { footer as copy } from "@/data/layout/footer";
import { useModal } from "@/hooks/use-modal";

interface FooterProps {
  showNewsletter?: boolean;
}

export default function Footer({ showNewsletter = false }: FooterProps) {
  const { openLegal } = useModal();

  return (
    <footer className="bg-green-900 text-slate-300 py-16 px-6">
      <div className="max-w-7xl mx-auto">
        {showNewsletter ? <Newsletter /> : null}

        {/* ── Grid ── */}
        <div className="grid md:grid-cols-3 gap-10 mb-8">
          {/* Brand column */}
          <div>
            <div className="flex items-center gap-2.5 mb-4">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-emerald-600 to-green-700 flex items-center justify-center">
                <Brain className="w-4 h-4 text-white" strokeWidth={2.2} />
              </div>
              <span className="font-heading text-white/90 font-bold text-lg">
                {copy.brand.name}
              </span>
            </div>
            <p className="text-sm leading-relaxed max-w-sm">
              {copy.brand.tagline}
            </p>
          </div>

          {/* Legal column */}
          <div>
            <h4 className="text-white font-semibold text-sm mb-4">Legal</h4>
            <ul className="space-y-2.5">
              {copy.legalLinks.map((l) => (
                <li key={l}>
                  <button
                    onClick={() => openLegal(l)}
                    className="text-sm text-left underline-offset-4 hover:text-white hover:underline focus-visible:text-white focus-visible:underline transition-colors"
                  >
                    {l}
                  </button>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact column */}
          <div>
            <h4 className="text-white font-semibold text-sm mb-4">Contact</h4>
            <ul className="space-y-3">
              {copy.contactInfo.map(({ text, href }) => (
                <li key={text}>
                  <a
                    href={href}
                    className="text-sm underline-offset-4 hover:text-white hover:underline focus-visible:text-white focus-visible:underline transition-colors"
                  >
                    {text}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* ── Inset divider + Bottom bar ── */}
        <div className="px-4 md:px-8">
          <div className="h-px bg-white/15 shadow-[0_0_0_1px_rgba(255,255,255,0.02)]" />
        </div>
        <div className="pt-8 text-center">
          <p className="text-sm text-white/80">
            © {new Date().getFullYear()} {copy.brand.name}. {copy.copyrightSuffix}
          </p>
        </div>
      </div>
    </footer>
  );
}