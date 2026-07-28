import { apiClient } from "@/services/api-client";

export type ActivityType =
  | "registered"
  | "generated"
  | "downloaded"
  | "newsletter"
  | "quiz_deleted"
  | "user_deleted"
  | "announcement_sent";

export interface ActivityLogEntry {
  id: string;
  email: string;
  description: string;
  type: ActivityType;
  timestamp: string;
}

interface ActivityLogListResponse {
  logs: ActivityLogEntry[];
  total: number;
}

const PAGE_SIZE = 20;

export async function listLogs(
  tab: string,
  page = 1
): Promise<{ logs: ActivityLogEntry[]; total: number; pageCount: number }> {
  const response = await apiClient.get<ActivityLogListResponse>(
    `/admin/logs?tab=${encodeURIComponent(tab)}&page=${page}`
  );
  return {
    logs: response.logs,
    total: response.total,
    pageCount: Math.max(1, Math.ceil(response.total / PAGE_SIZE)),
  };
}