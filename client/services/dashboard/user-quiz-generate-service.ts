import { apiClient, ApiError } from "@/services/api-client";

export type QuizTypeInput = "multiple_choice" | "identification" | "true_false";

interface QuestionResponse {
  number: number;
  text: string;
  type: QuizTypeInput;
  options: string[] | null;
  answer: string;
}

interface GenerateQuizResponse {
  id: string;
  title: string;
  questionCount: number;
  quizType: QuizTypeInput;
  createdAt: string;
  direction: string | null;
  questions: QuestionResponse[] | null;
}

export interface GeneratedQuiz {
  id: string;
  title: string;
  questionCount: number;
  quizType: QuizTypeInput;
  createdAt: string;
  direction: string | null;
}

export async function generateQuiz(
  file: File,
  quizType: QuizTypeInput,
  questionCount: number
): Promise<GeneratedQuiz> {
  const formData = new FormData();
  formData.append("file", file);
  formData.append("quizType", quizType);
  formData.append("questionCount", String(questionCount));

  const response = await apiClient.post<GenerateQuizResponse>("/quizzes", formData);

  return {
    id: response.id,
    title: response.title,
    questionCount: response.questionCount,
    quizType: response.quizType,
    createdAt: response.createdAt,
    direction: response.direction,
  };
}

export { ApiError };