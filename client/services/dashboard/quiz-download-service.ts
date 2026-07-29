import { ApiError } from "@/services/api-client";

export interface DownloadResult {
  blob: Blob;
  filename: string;
  failedTitles: string[];
}

function extractFilename(contentDisposition: string | null, fallback: string): string {
  if (!contentDisposition) return fallback;
  const match = contentDisposition.match(/filename="([^"]+)"/);
  return match ? match[1] : fallback;
}

export async function downloadQuizzes(ids: string[]): Promise<DownloadResult> {
  const query = ids.map(encodeURIComponent).join(",");
  const response = await fetch(`/api/quizzes/download?ids=${query}`, {
    credentials: "include",
  });

  if (!response.ok) {
    let detail = "Download failed. Please try again.";
    try {
      const body = await response.json();
      if (body?.detail) detail = body.detail;
    } catch {
      // response body wasn't JSON
    }
    throw new ApiError(response.status, detail);
  }

  const blob = await response.blob();
  const filename = extractFilename(
    response.headers.get("Content-Disposition"),
    ids.length === 1 ? "quiz.docx" : "quizzes.zip"
  );

  const failedTitlesHeader = response.headers.get("X-Failed-Titles");
  const failedTitles = failedTitlesHeader ? failedTitlesHeader.split(",") : [];

  return { blob, filename, failedTitles };
}