import { ChevronDown } from "lucide-react";

export interface AccordionItemData {
  q: string;
  a: string;
}

interface AccordionProps {
  items: AccordionItemData[];
  openIndex: number | null;
  onToggle: (index: number) => void;
}

function AccordionItem({
  q,
  a,
  open,
  onToggle,
}: {
  q: string;
  a: string;
  open: boolean;
  onToggle: () => void;
}) {
  return (
    <div className="border-b border-slate-200 px-6">
      <button
        onClick={onToggle}
        className="w-full group flex items-center justify-between gap-4 py-4 text-left bg-white transition-colors"
      >
        <span className="pb-1 border-b-2 border-transparent font-semibold text-slate-900 text-sm md:text-base transition-colors duration-200 group-hover:text-green-700 group-hover:border-green-700">
          {q}
        </span>
        <ChevronDown
          className={`w-5 h-5 text-slate-400 flex-shrink-0 transition-transform duration-200 group-hover:text-green-700 ${
            open ? "rotate-180" : ""
          }`}
        />
      </button>
      <div
        className={`grid overflow-hidden transition-[grid-template-rows,opacity] duration-300 ease-in-out ${
          open ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"
        }`}
      >
        <div className="overflow-hidden">
          <div className="pb-5 text-sm text-slate-500 leading-relaxed bg-white">
            {a}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function Accordion({ items, openIndex, onToggle }: AccordionProps) {
  return (
    <div>
      {items.map((item, index) => (
        <AccordionItem
          key={`${item.q}-${index}`}
          q={item.q}
          a={item.a}
          open={openIndex === index}
          onToggle={() => onToggle(index)}
        />
      ))}
    </div>
  );
}