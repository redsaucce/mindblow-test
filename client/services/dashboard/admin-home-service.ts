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

export type LineChartGranularity = "day" | "week" | "month" | "year";

interface AdminStatsResponse {
  totalUsers: StatData;
  quizzesGenerated: StatData;
  avgQuestionsPerQuiz: StatData;
  lineChart: LineChartPoint[];
  donutChart: DonutChartSlice[];
}

export async function getStats(
  granularity: LineChartGranularity = "day"
): Promise<AdminStatsResponse> {
  return apiClient.get<AdminStatsResponse>(
    `/admin/stats?granularity=${encodeURIComponent(granularity)}`
  );
}