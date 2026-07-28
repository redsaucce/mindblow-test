"use client";

import { useEffect, useLayoutEffect, useState } from "react";
import { X } from "lucide-react";
import Accordion from "@/components/ui/accordion";
import { LEGAL_DATA, legalModalFooter } from "@/data/modal/legal";
import { useModal } from "@/hooks/use-modal";

export default function LegalModal() {
  const { legalOpen, legalType, closeLegal } = useModal();
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  // useLayoutEffect (not useEffect) so this resets before the browser
  // paints — otherwise the previously-open item flashes visible for a
  // frame, then collapses, whenever the modal reopens or switches type
  // (openLegal() can swap legalType directly without closing first).
  useLayoutEffect(() => {
    setOpenIndex(null);
  }, [legalOpen, legalType]);

  useEffect(() => {
    if (!legalOpen) return;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "";
    };
  }, [legalOpen]);

  if (!legalOpen || !LEGAL_DATA[legalType]) return null;

  const data = LEGAL_DATA[legalType];

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
        onClick={closeLegal}
      />
      <div className="relative bg-white rounded-3xl shadow-2xl w-full max-w-3xl max-h-[85vh] flex flex-col overflow-hidden">
        <div className="flex items-center justify-between px-5 md:px-8 pt-6 pb-4 border-b border-slate-100">
          <div>
            <h2 className="font-heading text-xl md:text-[22px] font-bold text-slate-900">
              {legalType}
            </h2>
          </div>
          <button
            onClick={closeLegal}
            className="w-8 h-8 rounded-lg bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-500 hover:text-slate-700 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
        <div className="px-5 md:px-8 py-6 overflow-y-auto flex-1">
          <Accordion
            items={data.sections}
            openIndex={openIndex}
            onToggle={(index) =>
              setOpenIndex(openIndex === index ? null : index)
            }
          />
        </div>
        <div className="px-5 md:px-8 py-4 border-t border-slate-100">
          <p className="text-[11px] text-slate-400 text-center">
            {legalModalFooter.lastUpdatedLabel} {legalModalFooter.lastUpdated}{" "}
            {legalModalFooter.separator} {legalModalFooter.contactLabel}{" "}
            {legalModalFooter.contactEmail}
          </p>
        </div>
      </div>
    </div>
  );
}