import type { LegalContentItem } from "./terms";

export const privacy: LegalContentItem = {
  sections: [
    {
      q: "What information do we collect?",
      a: "We collect your email address and basic usage data needed to run and improve MindBlow. We do not sell your personal data.",
    },
    {
      q: "How do we use your data?",
      a: "Your data is used solely to provide and improve the MindBlow service. This includes generating quizzes, tracking your progress, and sending you relevant service updates via email.",
    },
    {
      q: "How do we store your data?",
      a: "All data is encrypted at rest and in transit using industry-standard protocols. We use secure cloud infrastructure and regularly audit our systems for vulnerabilities.",
    },
    {
      q: "Third-party services",
      a: "We use trusted third-party services like OpenAI for quiz generation and analytics tools for anonymous usage insights.",
    },
    {
      q: "Your rights",
      a: "You can request a copy of your data, ask us to delete your account and all associated data, or opt out of non-essential communications at any time by contacting hello@mindblow.com.",
    },
  ],
};