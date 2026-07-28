export const generatePanelContent = {
  upload: {
    label: "Upload your PDF or DOCX",
    hint: "or click to browse files",
    maxSizeLabel: "Max 10MB",
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
  },
  resultModal: {
    title: "Quiz Generated!",
    answerKeyLabel: "Answer Key",
    captionPrefix: "Showing",
    captionMiddle: "of",
    captionSuffix: "questions — download for the full quiz and answer key",
    generateAnotherLabel: "Generate Another",
    viewQuizzesLabel: "View My Quizzes",
    downloadLabel: "Download Quiz",
    downloadingLabel: "Preparing download...",
    downloadSuccessMessage: "Download started",
    downloadErrorMessage: "Download failed. Please try again.",
  },
};