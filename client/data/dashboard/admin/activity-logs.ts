export interface ActivityTab {
  label: string;
  value: string;
}

export const activityTabs: ActivityTab[] = [
  { label: "All", value: "all" },
  { label: "Registered", value: "registered" },
  { label: "Generated", value: "generated" },
  { label: "Downloaded", value: "downloaded" },
  { label: "Quiz Deleted", value: "quiz_deleted" },
  { label: "User Deleted", value: "user_deleted" },
  { label: "Announcement Sent", value: "announcement_sent" },
];

export const activityLogsContent = {
  columns: {
    email: "USER EMAIL",
    activity: "ACTIVITY",
  },
  summaryTemplate: "Showing {shown} of {total} entries",
};