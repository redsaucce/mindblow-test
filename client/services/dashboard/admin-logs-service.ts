import { apiClient } from "@/services/api-client";

export type ActivityType =
  | "registered"
  | "generated"
  | "downloaded"
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

export async function listLogs(tab: string): Promise<ActivityLogEntry[]> {
  const response = await apiClient.get<ActivityLogListResponse>(
    `/admin/logs?tab=${encodeURIComponent(tab)}`
  );
  return response.logs;
}