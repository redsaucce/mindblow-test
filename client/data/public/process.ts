import { Upload, Brain, Zap, type LucideIcon } from "lucide-react";

export interface StepItem {
  num: string;
  title: string;
  desc: string;
  icon: LucideIcon;
}

export const processHeader = {
  variant: "green" as const,
  prefix: "Simple Process",
  title: "From Upload to Quiz in 3 Steps",
  subtitle: "No setup, no tutorials — just results.",
};

export const steps: StepItem[] = [
  {
    num: "01",
    title: "Upload Your Document",
    desc: "Upload your PDF or DOCX files, then pick the quiz category and number of questions.",
    icon: Upload,
  },
  {
    num: "02",
    title: "AI Processes in Seconds",
    desc: "Quizzes are built entirely from your uploaded content, focused only on the topics that matter.",
    icon: Brain,
  },
  {
    num: "03",
    title: "Take Your Quiz",
    desc: "Review and practice using your generated quizzes whenever it's convenient for you.",
    icon: Zap,
  },
];