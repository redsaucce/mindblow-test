import { apiClient } from "@/services/api-client";

export interface PromptFields {
  prefix: string;
  objectives: string;
  constraints: string;
  suffix: string;
}

interface UpdatePromptResponse {
  message: string;
}

export async function getPrompt(): Promise<PromptFields> {
  return apiClient.get<PromptFields>("/admin/prompt");
}

export async function updatePrompt(fields: PromptFields): Promise<UpdatePromptResponse> {
  return apiClient.put<UpdatePromptResponse>("/admin/prompt", fields);
}