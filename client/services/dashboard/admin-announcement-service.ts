import { apiClient } from "@/services/api-client";

interface SendAnnouncementResponse {
  message: string;
}

export async function sendAnnouncement(
  title: string,
  subject: string,
  message: string
): Promise<SendAnnouncementResponse> {
  return apiClient.post<SendAnnouncementResponse>("/admin/announcements", {
    title,
    subject,
    message,
  });
}