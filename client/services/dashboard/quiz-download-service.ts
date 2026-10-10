import { API_URL, ApiError, readErrorDetail, tryRefresh } from "@/services/api-client";

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

async function fetchDownload(ids: string[]): Promise<Response> {
  const query = ids.map(encodeURIComponent).join(",");
  return fetch(`${API_URL}/quizzes/download?ids=${query}`, {
    credentials: "include",
  });
}

export async function downloadQuizzes(ids: string[], isRetry = false): Promise<DownloadResult> {
  const response = await fetchDownload(ids);

  if (response.status === 401 && !isRetry) {
    const refreshed = await tryRefresh();
    if (refreshed) {
      return downloadQuizzes(ids, true);
    }
  }

  if (!response.ok) {
    const detail = await readErrorDetail(response, "Download failed. Please try again.");
    throw new ApiError(response.status, detail);
  }

  const blob = await response.blob();
  const filename = extractFilename(
    response.headers.get("Content-Disposition"),
    ids.length === 1 ? "quiz.docx" : "quizzes.zip"
  );

  const failedTitlesHeader = response.headers.get("X-Failed-Titles");
  // The backend URL-encodes each title, so decode them before showing them.
  const failedTitles = failedTitlesHeader
    ? failedTitlesHeader.split(",").map((title) => decodeURIComponent(title))
    : [];

  return { blob, filename, failedTitles };
}