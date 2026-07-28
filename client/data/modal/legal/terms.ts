export interface LegalSection {
  q: string;
  a: string;
}

export interface LegalContentItem {
  title?: string;
  sections: LegalSection[];
}

export const terms: LegalContentItem = {
  sections: [
    {
      q: "Acceptance of terms",
      a: "By accessing or using MindBlow, you agree to be bound by these terms. If you do not agree, you may not use the service. We reserve the right to update these terms at any time.",
    },
    {
      q: "Use of the service",
      a: "MindBlow is provided for personal and educational use. You may not use the service for any illegal purpose, to distribute malware, or to infringe on the intellectual property rights of others.",
    },
    {
      q: "Content ownership",
      a: "You retain full ownership of any documents you upload. Quizzes generated from your content are yours to use, share, and export. MindBlow does not claim ownership over your content.",
    },
    {
      q: "Service availability",
      a: "We strive to keep MindBlow available 24/7, but we do not guarantee uninterrupted access. We may perform maintenance or updates that temporarily affect availability.",
    },
    {
      q: "Limitation of liability",
      a: "MindBlow is provided as-is. We are not responsible for losses, errors, or outcomes resulting from use of the service.",
    },
  ],
};