import type { LucideIcon } from "lucide-react";
import { Zap, Brain, List, Download } from "lucide-react";

export interface FeatureItem {
  icon: LucideIcon;
  title: string;
  desc: string;
}

export const features: FeatureItem[] = [
  {
    icon: Zap,
    title: "Easy File Upload",
    desc: "Upload your PDF and DOCX files in a few clicks and turn them into quiz-ready study material.",
  },
  {
    icon: Brain,
    title: "AI Quiz Generation",
    desc: "The AI model behind MindBlow identifies key concepts in your material and builds a complete, ready-to-use quiz.",
  },
  {
    icon: List,
    title: "Multiple Question Formats",
    desc: "Multiple Choice, True/False, Fill in the Blank, or Identification. Match the format to your exam so there are no surprises on test day.",
  },
  {
    icon: Download,
    title: "Download Quiz",
    desc: "Download your quiz as a DOCX file for easy editing, printing, and sharing with anyone who needs it.",
  },
];