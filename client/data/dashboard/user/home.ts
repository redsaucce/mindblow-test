export const generatePanelContent = {
  upload: {
    label: "Upload your PDF or DOCX, up to 10MB",
    maxSizeBytes: 10 * 1024 * 1024,
    invalidTypeMessage: "Only PDF or DOCX files are supported.",
    tooLargeMessage: "File is too large — max size is 10MB.",
    changeLabel: "Change",
  },
  quizType: {
    label: "Quiz Type",
    options: [
      { value: "mcq", label: "Multiple Choice" },
      { value: "tf", label: "True or False" },
      { value: "identification", label: "Identification" },
    ],
  },
  quantity: {
    label: "Number of Questions",
    hint: "min 25 · max 50",
    min: 25,
    max: 50,
  },
  generateLabel: "Generate Quiz",
  generatingDialog: {
    title: "Generating your quiz",
    progressLabel: "Generating...",
  },
  errorDialog: {
    title: "Quiz generation failed",
    description:
      "Something went wrong while generating your quiz. Please try again.",
    retryLabel: "Try Again",
    chooseDifferentFileLabel: "Choose a Different File",
    aiFailureMessage:
      "The AI had trouble generating your quiz this time. This can happen occasionally — try again.",
    sessionExpiredMessage: "Your session expired. Please sign in again.",
    networkErrorMessage:
      "Couldn't reach the server. Check your connection and try again.",
  },
  resultModal: {
    title: "Quiz Generated!",
    answerKeyLabel: "Answer Key",
    downloadPrompt: "Download for the full quiz and answer key",
    generateAnotherLabel: "Generate Another",
    viewQuizzesLabel: "View My Quizzes",
    downloadLabel: "Download Quiz",
    downloadingLabel: "Preparing download...",
    downloadSuccessMessage: "Download started",
    downloadErrorMessage: "Download failed. Please try again.",
  },
};