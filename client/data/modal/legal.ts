import { terms, type LegalContentItem } from "./legal/terms";
import { privacy } from "./legal/privacy";
import { disclaimer } from "./legal/disclaimer";

// Keys must match the labels in components/layout/footer.tsx (`copy.legalLinks`)
export const LEGAL_DATA: Record<string, LegalContentItem> = {
  "Privacy Policy": privacy,
  "Terms of Service": terms,
  Disclaimer: disclaimer,
};

export const legalModalFooter = {
  lastUpdatedLabel: "Last updated:",
  lastUpdated: "January 2026",
  separator: "•",
  contactLabel: "Questions? Contact",
  contactEmail: "mindblow@mindblow.online",
} as const;

export type { LegalContentItem };