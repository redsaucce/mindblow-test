export interface FAQItem {
  q: string;
  a: string;
}

export const faqsHeader = {
  variant: "green" as const,
  title: "Frequently Asked Questions",
};

export const faqs: FAQItem[] = [
  {
    q: "What file formats are supported?",
    a: "MindBlow supports PDF and DOCX files. Simply upload your content and we handle the rest — note that text within images is not extracted.",
  },
  {
    q: "How accurate are the generated quizzes?",
    a: "Our engine uses a RAG-based approach to extract key concepts with high accuracy. You can always review and edit questions before sharing or taking a quiz.",
  },
  {
    q: "Is there a limit on quiz length?",
    a: "You can generate quizzes with up to 30 questions per document. Longer documents are automatically chunked for the best results.",
  },
  {
    q: "Can I take quizzes directly inside MindBlow?",
    a: "MindBlow is designed for quiz generation and downloading only. Once your quiz is generated, you can download it and study at your own pace offline.",
  },
  {
    q: "Will there be a paid plan in the future?",
    a: "We're exploring premium features like advanced analytics, team dashboards, and LMS integration. The core quiz generation will always have a generous free tier.",
  },
];