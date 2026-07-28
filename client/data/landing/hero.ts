import type { LucideIcon } from "lucide-react";
import { Upload, Brain, FileCheck2 } from "lucide-react";

export interface ProcessStep {
  icon: LucideIcon;
  title: string;
  desc: string;
  tone: string;
}

export interface HeroContent {
  titleStart: string;
  titleHighlight: string;
  titleMiddle: string;
  titleAccent: string;
  subtitle: string;
  primaryCta: string;
  secondaryCta: string;
  process: ProcessStep[];
}

export const heroContent: HeroContent = {
  titleStart: "Turn Your",
  titleHighlight: "Course Materials",
  titleMiddle: "Into a",
  titleAccent: "Quiz",
  subtitle:
    "From PDF or DOCX to a ready-made quiz — no prompting required. Study smarter, retain more, score higher.",
  primaryCta: "Generate Your First Quiz",
  secondaryCta: "Explore Features",
  
  process: [
    {
      icon: Upload,
      title: "Upload File",
      desc: "PDF or DOCX",
      tone: "from-emerald-500 to-green-600",
    },
    {
      icon: Brain,
      title: "AI Processing",
      desc: "Concept extraction",
      tone: "from-green-600 to-green-700",
    },
    {
      icon: FileCheck2,
      title: "Quiz Ready",
      desc: "Practice instantly",
      tone: "from-lime-500 to-emerald-600",
    },
  ],
};