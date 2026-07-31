export const quizListContent = {
  selectAllLabel: "Select all",
  downloadLabel: "Download",
  deleteLabel: "Delete",
  deleteAllLabel: "Delete",
  deleteDialog: {
    singleTitle: "Delete quiz?",
    singleDescription:
      "This will permanently delete this quiz. This action cannot be undone.",
    allTitle: "Delete all quizzes?",
    allDescriptionTemplate:
      "This will permanently delete all {count} quizzes in your history. This action cannot be undone.",
    someTitleTemplate: "Delete {count} quizzes?",
    someDescription:
      "This will permanently delete the selected quizzes. This action cannot be undone.",
    cancelLabel: "Cancel",
    confirmLabel: "Delete",
    deletingLabel: "Deleting...",
  },
  downloadDialog: {
    singleTitle: "Download quiz?",
    singleDescription: "This will download the selected quiz as a DOCX file.",
    manyTitleTemplate: "Download {count} quizzes?",
    manyDescriptionTemplate: "This will download {count} quizzes as DOCX files.",
    cancelLabel: "Cancel",
    confirmLabel: "Download",
    downloadingLabel: "Downloading...",
  },
  feedback: {
    quizDeletedSingle: "Quiz deleted",
    quizDeletedManyTemplate: "{count} quizzes deleted",
    deleteError: "Something went wrong. Please try again.",
    downloadStartedSingle: "Download started",
    downloadStartedManyTemplate: "{count} quizzes downloading",
    downloadError: "Download failed. Please try again.",
  },
  previewModal: {
    downloadLabel: "Download Quiz",
  },
};