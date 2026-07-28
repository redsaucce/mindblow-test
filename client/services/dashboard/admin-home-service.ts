import { apiClient } from "@/services/api-client";

export interface StatData {
  current: number;
  previous: number | null;
}

export interface LineChartPoint {
  month: string;
  quizzes: number;
}

export interface DonutChartSlice {
  name: string;
  value: number;
}

interface AdminStatsResponse {
  totalUsers: StatData;
  quizzesGenerated: StatData;
  downloadedQuizzes: StatData;
  newsletterSubscribers: StatData;
  lineChart: LineChartPoint[];
  donutChart: DonutChartSlice[];
}

export async function getStats(): Promise<AdminStatsResponse> {
  return apiClient.get<AdminStatsResponse>("/admin/stats");
}