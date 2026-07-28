import { apiClient, ApiError } from "@/services/api-client";

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
  quizType: "multiple_choice" | "identification" | "true_false";
  createdAt: string;
  questions?: {
    number: number;
    text: string;
    options?: string[] | null;
    answer: string;
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
  answer: string;
}

export interface QuizDetail extends Quiz {
  questions: QuizQuestionDetail[];
}

const QUIZ_TYPE_LABELS: Record<QuizResponse["quizType"], string> = {
  multiple_choice: "Multiple Choice",
  identification: "Identification",
  true_false: "True or False",
};

const SERVER_TYPE_TO_LOCAL: Record<QuizResponse["quizType"], QuizQuestionDetail["type"]> = {
  multiple_choice: "mcq",
  true_false: "tf",
  identification: "identification",
};

function formatDate(isoDatetime: string): string {
  return new Date(isoDatetime).toLocaleDateString("en-US", {
    timeZone: "Asia/Manila",
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

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

export async function getQuiz(id: string): Promise<Quiz> {
  const response = await apiClient.get<QuizResponse>(`/quizzes/${encodeURIComponent(id)}`);
  return toQuiz(response);
}

export async function getQuizDetail(id: string): Promise<QuizDetail> {
  const response = await apiClient.get<QuizResponse>(`/quizzes/${encodeURIComponent(id)}`);
  const mapped = toQuiz(response);

  return {
    ...mapped,
    questions: (response.questions ?? []).map((q) => ({
      number: q.number,
      text: q.text,
      type: SERVER_TYPE_TO_LOCAL[response.quizType],
      options: q.options ?? undefined,
      answer: q.answer,
    })),
  };
}

export async function deleteQuiz(id: string): Promise<DeleteQuizResponse> {
  return apiClient.delete<DeleteQuizResponse>(`/quizzes/${encodeURIComponent(id)}`);
}

export { ApiError };