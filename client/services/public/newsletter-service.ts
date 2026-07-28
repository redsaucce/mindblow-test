import { apiClient } from "@/services/api-client";

export interface NewsletterSubscribeResponse {
  message: string;
}

export async function subscribe(email: string): Promise<NewsletterSubscribeResponse> {
  return apiClient.post<NewsletterSubscribeResponse>("/newsletter/subscribe", { email });
}