/** Formats an ISO datetime as "Oct 9, 2026" in Manila time, for display in admin and user tables. */
export function formatDate(isoDatetime: string): string {
  return new Date(isoDatetime).toLocaleDateString("en-US", {
    timeZone: "Asia/Manila",
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}