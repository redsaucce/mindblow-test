import { apiClient, ApiError } from "@/services/api-client";

export interface MagicLinkRequestPayload {
  email: string;
}

export interface MagicLinkResponse {
  message: string;
}

export interface VerifyResponse {
  role: "user" | "admin";
}

export interface RefreshResponse {
  role: "user" | "admin";
}

export interface LogoutResponse {
  message: string;
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

export async function refreshSession(): Promise<RefreshResponse> {
  return apiClient.post<RefreshResponse>("/auth/refresh");
}

export async function logout(): Promise<LogoutResponse> {
  return apiClient.post<LogoutResponse>("/auth/logout");
}

export async function getMe(): Promise<MeResponse> {
  return apiClient.get<MeResponse>("/auth/me");
}

export { ApiError };