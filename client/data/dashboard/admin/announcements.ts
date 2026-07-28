export const announcementPageContent = {
  title: "Send Announcement",
  subtitle: "Compose a message that will be shown to all MindBlow users.",
  fields: {
    title: { label: "Title", placeholder: "e.g. New feature: Identification quizzes!" },
    subject: { label: "Subject", placeholder: "e.g. Product Update" },
    message: { label: "Message", placeholder: "Write your announcement..." },
  },
  sendLabel: "Send Announcement",
  sendingLabel: "Sending...",
  confirmDialog: {
    title: "Send this announcement?",
    description: "This will be shown to every MindBlow user immediately.",
    cancelLabel: "Cancel",
    confirmLabel: "Send",
  },
  feedback: {
    sent: "Announcement sent to all users",
    error: "Something went wrong. Please try again.",
    validation: "Add a title and message before sending.",
  },
};