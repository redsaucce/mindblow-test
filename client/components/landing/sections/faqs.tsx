"use client";

import { useState } from "react";
import Accordion from "@/components/ui/accordion";
import SectionHeader from "@/components/ui/section-header";
import { faqsHeader, faqs } from "@/data/landing/faqs";

export default function Faqs() {
  const [openIndex, setOpenIndex] = useState<number | null>(null);
  const content = faqsHeader;

  return (
    <section id="faqs" className="bg-white px-6 py-28">
      <div className="max-w-5xl mx-auto">
        <div className="mb-12">
          <SectionHeader
            variant={content.variant}
            title={content.title}
          />
        </div>
        <div className="max-w-2xl mx-auto">
          <Accordion
            items={faqs}
            openIndex={openIndex}
            onToggle={(index) =>
              setOpenIndex(openIndex === index ? null : index)
            }
          />
        </div>
      </div>
    </section>
  );
}