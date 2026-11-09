import { apiClient, ApiError } from "@/services/api-client";
import { formatDate } from "@/services/format-date";

export interface Quiz {
  id: string;
  documentName: string;
  category: string;
  quantity: number;
  date: string;
}

interface QuizResponse {
  id: string;
  title: string;
  questionCount: number;
  quizType: "multiple_choice" | "identification" | "true_false" | "mixed";
  createdAt: string;
  questions?: {
    number: number;
    text: string;
    type: "multiple_choice" | "identification" | "true_false";
    options?: string[] | null;
  }[];
}

interface QuizListResponse {
  quizzes: QuizResponse[];
}

interface DeleteQuizResponse {
  message: string;
}

export interface QuizQuestionDetail {
  number: number;
  text: string;
  type: "mcq" | "tf" | "identification";
  options?: string[];
}

export interface QuizDetail extends Quiz {
  questions: QuizQuestionDetail[];
}

const QUIZ_TYPE_LABELS: Record<QuizResponse["quizType"], string> = {
  multiple_choice: "Multiple Choice",
  identification: "Identification",
  true_false: "True or False",
  mixed: "Mixed",
};

const SERVER_QUESTION_TO_LOCAL: Record<"multiple_choice" | "identification" | "true_false", QuizQuestionDetail["type"]> = {
  multiple_choice: "mcq",
  true_false: "tf",
  identification: "identification",
};

function toQuiz(response: QuizResponse): Quiz {
  return {
    id: response.id,
    documentName: response.title,
    category: QUIZ_TYPE_LABELS[response.quizType],
    quantity: response.questionCount,
    date: formatDate(response.createdAt),
  };
}

export async function listQuizzes(): Promise<Quiz[]> {
  const { quizzes } = await apiClient.get<QuizListResponse>("/quizzes");
  return quizzes.map(toQuiz);
}

export async function getQuizDetail(id: string): Promise<QuizDetail> {
  const response = await apiClient.get<QuizResponse>(`/quizzes/${encodeURIComponent(id)}`);
  const mapped = toQuiz(response);

  return {
    ...mapped,
    questions: (response.questions ?? []).map((q) => ({
      number: q.number,
      text: q.text,
      type: SERVER_QUESTION_TO_LOCAL[q.type],
      options: q.options ?? undefined,
    })),
  };
}

export async function deleteQuiz(id: string): Promise<DeleteQuizResponse> {
  return apiClient.delete<DeleteQuizResponse>(`/quizzes/${encodeURIComponent(id)}`);
}

export { ApiError };

export interface CheckAnswerInput {
  number: number;
  answer: string;
}

export interface QuestionCheckResult {
  number: number;
  type: string;
  userAnswer: string;
  correctAnswer: string;
  correct: boolean;
}

export interface SectionScore {
  type: string;
  total: number;
  correct: number;
}

export interface CheckQuizResult {
  total: number;
  correct: number;
  percentage: number;
  results: QuestionCheckResult[];
  sections: SectionScore[];
}

/** Sends the user's answers to the server, which grades them against the stored answer key. */
export async function checkQuiz(id: string, answers: CheckAnswerInput[]): Promise<CheckQuizResult> {
  return apiClient.post<CheckQuizResult>(`/quizzes/${encodeURIComponent(id)}/check`, { answers });
}