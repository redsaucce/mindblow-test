import { apiClient, ApiError } from "@/services/api-client";

export interface MagicLinkResponse {
  message: string;
}

export interface VerifyResponse {
  role: "user" | "admin";
}

export interface MeResponse {
  id: string;
  email: string;
  role: "user" | "admin";
}

export async function requestMagicLink(email: string): Promise<MagicLinkResponse> {
  return apiClient.post<MagicLinkResponse>("/auth/magic-link", {
    email,
  });
}

export async function verifyToken(token: string): Promise<VerifyResponse> {
  return apiClient.get<VerifyResponse>(`/auth/verify?token=${encodeURIComponent(token)}`);
}

export interface LogoutResponse {
  message: string;
}

export async function logout(): Promise<LogoutResponse> {
  return apiClient.post<LogoutResponse>("/auth/logout");
}

export async function getMe(): Promise<MeResponse> {
  return apiClient.get<MeResponse>("/auth/me");
}

export { ApiError };