import SectionHeader from "@/components/ui/section-header";
import { Zap, Brain, List, Download } from "lucide-react";

const features = [
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
    desc: "Multiple Choice, True/False, or Identification. Match the format to your exam so there are no surprises on test day.",
  },
  {
    icon: Download,
    title: "Download Quiz",
    desc: "Download your quiz as a DOCX file for easy editing, printing, and sharing with anyone who needs it.",
  },
];

export default function Features() {
  const content = {
    variant: "green" as const,
    title: "Study Smarter, Not Harder",
    subtitle: "Turn your study material into ready-to-practice quizzes.",
  };

  return (
    <section id="features" className="bg-white py-28 px-6">
      <div className="max-w-5xl mx-auto">
        <div className="mb-16">
          <SectionHeader
            variant={content.variant}
            title={content.title}
            subtitle={content.subtitle}
          />
        </div>
        <div className="grid sm:grid-cols-2 gap-8">
          {features.map((f, i) => {
            const Icon = f.icon;
            const palette =
              i % 2 === 0
                ? "bg-linear-to-br from-emerald-50 to-white border-emerald-100"
                : "bg-linear-to-br from-green-50 to-white border-green-100";
            return (
              <div
                key={f.title}
                className={`relative group rounded-3xl p-7 border transition-all duration-300 ${palette}`}
              >
                <div className="w-12 h-12 rounded-2xl flex items-center justify-center mb-5 text-white shadow-lg bg-linear-to-br from-emerald-600 to-green-700 shadow-emerald-600/25">
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