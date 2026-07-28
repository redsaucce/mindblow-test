export const userListContent = {
  columns: {
    email: "USER EMAIL",
    role: "ROLE",
    generatedQuizzes: "GENERATED QUIZZES",
    dateRegistered: "DATE REGISTERED",
    action: "ACTION",
  },
  actionLabel: "Delete",
  summaryTemplate: "Showing {shown} of {total} users",
  deleteDialog: {
    title: "Delete User",
    description:
      "Are you sure you want to delete this user? All their quizzes will also be removed.",
    cancelLabel: "Cancel",
    confirmLabel: "Delete",
    deletingLabel: "Deleting...",
  },
  feedback: {
    deleted: "User deleted",
    error: "Something went wrong. Please try again.",
  },
};