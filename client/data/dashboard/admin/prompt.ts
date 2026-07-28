export const promptPageContent = {
  title: "Quiz Generation Prompt",
  subtitle: "Edit the instructions the AI uses when generating a quiz.",
  fields: {
    prefix: {
      label: "Prefix",
      placeholder:
        "You are an expert instructional designer creating quiz questions for college students.",
    },
    objectives: {
      label: "Objectives",
      placeholder:
        "Test recall and understanding of the key concepts in the uploaded material.",
    },
    constraints: {
      label: "Constraints",
      placeholder:
        "Generate between 25 and 50 questions. Match the selected question format exactly. Keep language clear and unambiguous.",
    },
    suffix: {
      label: "Suffix",
      placeholder:
        "Return the quiz in the exact JSON structure expected by the application.",
    },
  },
  saveLabel: "Save Changes",
  savingLabel: "Saving...",
  savedMessage: "Prompt updated",
  errorMessage: "Something went wrong. Please try again.",
};