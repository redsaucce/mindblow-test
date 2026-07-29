import { apiClient } from "@/services/api-client";

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

const DEFAULT_PAGE_SIZE = 20;

function formatDate(isoDatetime: string): string {
  return new Date(isoDatetime).toLocaleDateString("en-US", {
    timeZone: "Asia/Manila",
    month: "short",
    day: "numeric",
    year: "numeric",
  });
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

export async function listUsers(
  page = 1,
  pageSize = DEFAULT_PAGE_SIZE
): Promise<{ users: AdminUser[]; total: number; pageCount: number }> {
  const response = await apiClient.get<AdminUserListResponse>(
    `/admin/users?page=${page}&pageSize=${pageSize}`
  );
  return {
    users: response.users.map(toAdminUser),
    total: response.total,
    pageCount: Math.max(1, Math.ceil(response.total / pageSize)),
  };
}

export async function deleteUser(id: string): Promise<DeleteUserResponse> {
  return apiClient.delete<DeleteUserResponse>(`/admin/users/${encodeURIComponent(id)}`);
}