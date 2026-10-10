import { apiClient } from "@/services/api-client";
import { formatDate } from "@/services/format-date";

export interface AdminUser {
  id: string;
  email: string;
  role: "user" | "admin";
  generatedQuizzes: number;
  dateRegistered: string;
}

interface AdminUserResponse {
  id: string;
  email: string;
  role: "user" | "admin";
  generatedQuizzes: number;
  createdAt: string;
}

interface AdminUserListResponse {
  users: AdminUserResponse[];
  total: number;
}

interface DeleteUserResponse {
  message: string;
}

function toAdminUser(response: AdminUserResponse): AdminUser {
  return {
    id: response.id,
    email: response.email,
    role: response.role,
    generatedQuizzes: response.generatedQuizzes,
    dateRegistered: formatDate(response.createdAt),
  };
}

export async function listUsers(): Promise<AdminUser[]> {
  const response = await apiClient.get<AdminUserListResponse>(`/admin/users`);
  return response.users.map(toAdminUser);
}

export async function deleteUser(id: string): Promise<DeleteUserResponse> {
  return apiClient.delete<DeleteUserResponse>(`/admin/users/${encodeURIComponent(id)}`);
}