import { apiClient, ApiError } from "@/services/api-client";

export interface MagicLinkRequestPayload {
  email: string;
  optInMarketing: boolean;
}

export interface MagicLinkResponse {
  message: string;
}

export interface VerifyResponse {
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

export async function requestMagicLink(
  email: string,
  optInMarketing: boolean
): Promise<MagicLinkResponse> {
  return apiClient.post<MagicLinkResponse>("/auth/magic-link", {
    email,
    optInMarketing,
  });
}

export async function verifyToken(token: string): Promise<VerifyResponse> {
  return apiClient.get<VerifyResponse>(`/auth/verify?token=${encodeURIComponent(token)}`);
}

export async function logout(): Promise<LogoutResponse> {
  return apiClient.post<LogoutResponse>("/auth/logout");
}

export async function getMe(): Promise<MeResponse> {
  return apiClient.get<MeResponse>("/auth/me");
}

export { ApiError };