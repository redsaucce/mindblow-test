"use client";

import { useState, useRef, useCallback, useEffect, type ChangeEvent, type DragEvent } from "react";
import { Upload, Wand2 } from "lucide-react";
import Modal from "@/components/ui/modal";
import {
  generateQuiz as generateQuizRequest,
  ApiError,
  type QuizTypeInput,
} from "@/services/dashboard/user-quiz-generate-service";
import { getQuizDetail } from "@/services/dashboard/user-quiz-list-service";
import {
  QuizResultModal,
  type QuizResult,
} from "@/components/dashboard/user/quiz-result-modal";

const copy = {
  upload: {
    label: "Upload PDF or DOCX files, up to 10 files",
    maxSizeBytes: 10 * 1024 * 1024,
    maxFiles: 10,
    maxTotalBytes: 30 * 1024 * 1024,
    invalidTypeMessage: "Only PDF or DOCX files are supported.",
    tooLargeMessage: "File is too large — max size is 10MB.",
    tooManyMessage: "You can add up to 10 files per quiz.",
    duplicateMessage: "That file is already added.",
    totalTooLargeMessage: "Together these files are over the 30MB limit.",
    addLabel: "Add files",
    removeLabel: "Remove",
  },
  quizType: {
    label: "Quiz Type",
    options: [
      { value: "mcq", label: "Multiple Choice" },
      { value: "tf", label: "True or False" },
      { value: "identification", label: "Identification" },
      { value: "mixed", label: "Mixed" },
    ],
  },
  quantity: {
    label: "Number of Questions",
    hint: "min 25 · max 50",
    min: 25,
    max: 50,
  },
  quantityMixed: {
    hint: "min 30 · max 60",
    min: 30,
    max: 60,
  },
  generateLabel: "Generate Quiz",
  generatingDialog: {
    title: "Generating your quiz",
    progressLabel: "Generating...",
  },
  errorDialog: {
    title: "Quiz generation failed",
    description:
      "Something went wrong while generating your quiz. Please try again.",
    retryLabel: "Try Again",
    chooseDifferentFileLabel: "Choose a Different File",
    aiFailureMessage:
      "The AI had trouble generating your quiz this time. This can happen occasionally — try again.",
    sessionExpiredMessage: "Your session expired. Please sign in again.",
    networkErrorMessage:
      "Couldn't reach the server. Check your connection and try again.",
  },
};

type GenerateStatus = "idle" | "generating" | "success" | "error";

const QUIZ_TYPE_TO_SERVER: Record<string, QuizTypeInput> = {
  mcq: "multiple_choice",
  tf: "true_false",
  identification: "identification",
  mixed: "mixed",
};

const SERVER_TYPE_TO_LABEL: Record<QuizTypeInput, string> = {
  multiple_choice: "Multiple Choice",
  true_false: "True or False",
  identification: "Identification",
  mixed: "Mixed",
};

/**
 * Tier 1 (400/413, file & document validation) — backend `detail` is already
 * specific and actionable ("file too large", "unreadable PDF", etc.), so it's
 * shown verbatim and the user is pointed at picking a different file rather
 * than retrying the same one.
 * Tier 2 (502, AI generation family) — six distinct backend messages
 * (wrong question count, malformed question, mismatched type, ...) all
 * resolve to the same user action: retry. Collapsed into one message.
 * Tier 3 (429 rate limit, 401 session, network) — each has a distinct
 * required action, so each gets its own message.
 */
function resolveError(err: unknown): { message: string; canRetry: boolean } {
  if (err instanceof ApiError) {
    if (err.status === 400 || err.status === 413) {
      return { message: err.detail, canRetry: false };
    }
    if (err.status === 502) {
      return { message: copy.errorDialog.aiFailureMessage, canRetry: true };
    }
    if (err.status === 429) {
      return { message: err.detail, canRetry: true };
    }
    if (err.status === 401) {
      return { message: copy.errorDialog.sessionExpiredMessage, canRetry: false };
    }
    return { message: err.detail, canRetry: true };
  }
  return { message: copy.errorDialog.networkErrorMessage, canRetry: true };
}

async function generateQuiz(
  files: File[],
  category: string,
  quantity: number
): Promise<QuizResult> {
  const serverQuizType = QUIZ_TYPE_TO_SERVER[category] ?? "multiple_choice";
  const created = await generateQuizRequest(files, serverQuizType, quantity);
  const detail = await getQuizDetail(created.id);

  return {
    id: detail.id,
    documentName: files.map((f) => f.name).join(", "),
    category: SERVER_TYPE_TO_LABEL[created.quizType],
    quantity: detail.quantity,
    questions: detail.questions,
    totalQuestions: detail.quantity,
  };
}

export default function Home() {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [files, setFiles] = useState<File[]>([]);
  const [uploadError, setUploadError] = useState("");
  const [quizType, setQuizType] = useState<string>(copy.quizType.options[0].value);
  const [quantity, setQuantity] = useState<number>(copy.quantity.min);
  const [quantityInput, setQuantityInput] = useState<string>(
    String(copy.quantity.min)
  );
  const [status, setStatus] = useState<GenerateStatus>("idle");
  // Progress shown while the request runs. It's an estimate, not real progress:
  // it rises quickly at first and slows down near the end, and stays below 95%
  // until the server responds. The bar jumps to 100% when the quiz is ready.
  const [progress, setProgress] = useState(0);
  useEffect(() => {
    if (status !== "generating") return;
    const start = Date.now();
    setProgress(0);
    const id = setInterval(() => {
      const elapsed = (Date.now() - start) / 1000;
      setProgress(Math.min(95, 95 * (1 - Math.exp(-elapsed / 8))));
    }, 100);
    return () => clearInterval(id);
  }, [status]);
  const [result, setResult] = useState<QuizResult | null>(null);
  const [resultModalOpen, setResultModalOpen] = useState(false);
  const [errorMessage, setErrorMessage] = useState(copy.errorDialog.description);
  const [canRetry, setCanRetry] = useState(true);

  // Mixed quizzes have their own count range, 30 to 60. Single types keep 25 to 50.
  const quantityRange = quizType === "mixed" ? copy.quantityMixed : copy.quantity;

  // Choosing a type clamps the count into that type's range.
  const selectQuizType = (value: string) => {
    setQuizType(value);
    const range = value === "mixed" ? copy.quantityMixed : copy.quantity;
    const clamped = Math.min(range.max, Math.max(range.min, quantity));
    setQuantity(clamped);
    setQuantityInput(String(clamped));
  };

  const isValidType = (f: File) => {
    // Some systems report an empty or unexpected MIME type for valid DOCX
    // files, so fall back to the extension. The server still validates each file.
    const name = f.name.toLowerCase();
    const isPdf = f.type === "application/pdf" || name.endsWith(".pdf");
    const isDocx =
      f.type === "application/vnd.openxmlformats-officedocument.wordprocessingml.document" ||
      name.endsWith(".docx");
    return isPdf || isDocx;
  };

  // Adds files to the list. If any file in this selection fails a check, none of
  // the selection is added, and the message names the file.
  const handleFiles = useCallback(
    (incoming: File[]) => {
      const next = [...files];
      for (const f of incoming) {
        if (!isValidType(f)) {
          setUploadError(`${f.name}: ${copy.upload.invalidTypeMessage}`);
          return;
        }
        if (f.size > copy.upload.maxSizeBytes) {
          setUploadError(`${f.name}: ${copy.upload.tooLargeMessage}`);
          return;
        }
        if (next.some((existing) => existing.name.toLowerCase() === f.name.toLowerCase())) {
          setUploadError(`${f.name}: ${copy.upload.duplicateMessage}`);
          return;
        }
        if (next.length >= copy.upload.maxFiles) {
          setUploadError(copy.upload.tooManyMessage);
          return;
        }
        const total = next.reduce((sum, existing) => sum + existing.size, f.size);
        if (total > copy.upload.maxTotalBytes) {
          setUploadError(copy.upload.totalTooLargeMessage);
          return;
        }
        next.push(f);
      }
      setUploadError("");
      setFiles(next);
    },
    [files]
  );

  const onFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const picked = Array.from(e.target.files ?? []);
    if (picked.length > 0) handleFiles(picked);
    // Clear the input so picking the same file again still triggers a change.
    e.target.value = "";
  };

  const onDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    handleFiles(Array.from(e.dataTransfer.files ?? []));
  };

  const removeFile = (index: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
    setUploadError("");
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const runGeneration = async (fs: File[], type: string, qty: number) => {
    setStatus("generating");
    try {
      const generated = await generateQuiz(fs, type, qty);
      setProgress(100);
      setStatus("success");
      setTimeout(() => {
        setStatus("idle");
        setResult(generated);
        setResultModalOpen(true);
      }, 150);
    } catch (err) {
      const { message, canRetry: retryable } = resolveError(err);
      setErrorMessage(message);
      setCanRetry(retryable);
      setStatus("error");
    }
  };

  const handleGenerate = async () => {
    if (files.length === 0) return;
    await runGeneration(files, quizType, quantity);
  };

  const handleTryAgain = async () => {
    if (files.length === 0) return;
    await runGeneration(files, quizType, quantity);
  };

  const totalBytes = files.reduce((sum, f) => sum + f.size, 0);

  return (
    <>
      <div className="flex-1 flex items-center justify-center">
        <div className="flex flex-col gap-6 w-full max-w-2xl">
          <div
            className={`rounded-2xl ${files.length === 0 ? "h-40" : "min-h-40"} transition-all duration-200 ${
              files.length === 0
                ? "bg-transparent border-2 border-dashed border-slate-300"
                : "bg-white border border-slate-200 shadow-sm"
            }`}
          >
            <div
              className={`flex items-center justify-center h-full ${
                files.length > 0 ? "px-4 sm:px-6" : ""
              }`}
            >
              {files.length === 0 ? (
                <div
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      fileInputRef.current?.click();
                    }
                  }}
                  onDrop={onDrop}
                  onDragOver={(e) => e.preventDefault()}
                  onClick={() => fileInputRef.current?.click()}
                  className="flex flex-col items-center justify-center gap-2 cursor-pointer w-full h-full"
                >
                  <Upload className="w-8 h-8 sm:w-10 sm:h-10 text-slate-300" />
                  <p className="text-base font-medium text-slate-600">
                    {copy.upload.label}
                  </p>
                </div>
              ) : (
                <div className="flex flex-col gap-3 w-full">
                  <ul className="flex flex-col gap-2">
                    {files.map((f, i) => (
                      <li
                        key={`${f.name}-${i}`}
                        className="flex items-center justify-between gap-3"
                      >
                        <div className="min-w-0">
                          <p className="text-sm sm:text-base font-semibold text-slate-900 truncate">
                            {f.name}
                          </p>
                          <p className="text-xs sm:text-sm text-slate-400 mt-0.5">
                            {f.name.split(".").pop()?.toUpperCase()} · {formatFileSize(f.size)}
                          </p>
                        </div>
                        <button
                          type="button"
                          aria-label={`${copy.upload.removeLabel} ${f.name}`}
                          onClick={() => removeFile(i)}
                          className="rounded-full px-3 py-1.5 shrink-0 text-xs font-medium border border-slate-200 text-slate-600 hover:bg-slate-50 transition-colors"
                        >
                          {copy.upload.removeLabel}
                        </button>
                      </li>
                    ))}
                  </ul>
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-xs sm:text-sm text-slate-400">
                      {files.length} of {copy.upload.maxFiles} files · {formatFileSize(totalBytes)} of{" "}
                      {copy.upload.maxTotalBytes / (1024 * 1024)}MB
                    </p>
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={files.length >= copy.upload.maxFiles}
                      className="rounded-full px-4 py-2 shrink-0 text-xs sm:text-sm font-medium border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-50 transition-colors"
                    >
                      {copy.upload.addLabel}
                    </button>
                  </div>
                </div>
              )}
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf,.docx"
              multiple
              className="hidden"
              onChange={onFileChange}
            />
          </div>

          {uploadError && (
            <p className="text-xs text-red-500 -mt-3">{uploadError}</p>
          )}

          <div className="rounded-2xl border border-slate-200 bg-white shadow-sm p-4 sm:p-6 flex flex-col gap-5">
            <div>
              <label className="text-sm font-semibold text-slate-700 mb-3 block">
                {copy.quizType.label}
              </label>
              <div className="flex flex-col sm:flex-row flex-wrap gap-2">
                {copy.quizType.options.map(({ value, label }) => (
                  <label
                    key={value}
                    className={`flex items-center gap-2 px-4 py-2.5 rounded-lg border text-sm cursor-pointer transition-all duration-200 w-full sm:w-auto ${
                      quizType === value
                        ? "border-green-700 text-green-700 bg-emerald-50"
                        : "border-slate-200 text-slate-600 hover:bg-slate-50"
                    }`}
                  >
                    <input
                      type="radio"
                      name="quizType"
                      value={value}
                      checked={quizType === value}
                      onChange={() => selectQuizType(value)}
                      className="sr-only"
                    />
                    <span
                      className={`w-4 h-4 rounded-full border-2 flex items-center justify-center shrink-0 transition-all duration-200 ${
                        quizType === value ? "border-green-700" : "border-slate-300"
                      }`}
                    >
                      {quizType === value && (
                        <span className="w-2 h-2 rounded-full bg-green-700" />
                      )}
                    </span>
                    {label}
                  </label>
                ))}
              </div>
            </div>

            <div className="h-px bg-slate-100" />

            <div className="flex flex-col sm:flex-row sm:items-center gap-2">
              <div className="flex items-center gap-2">
                <label className="text-sm font-semibold text-slate-700">
                  {copy.quantity.label}
                </label>
                <span className="text-xs text-slate-400">{quantityRange.hint}</span>
              </div>
              <input
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                value={quantityInput}
                onFocus={(e) => e.target.select()}
                onChange={(e) => {
                  const digitsOnly = e.target.value.replace(/[^0-9]/g, "");
                  const noLeadingZeros = digitsOnly.replace(/^0+(?=\d)/, "");
                  setQuantityInput(noLeadingZeros);
                }}
                onBlur={() => {
                  const parsed = parseInt(quantityInput, 10);
                  const clamped = Number.isNaN(parsed)
                    ? quantityRange.min
                    : Math.min(
                        quantityRange.max,
                        Math.max(quantityRange.min, parsed)
                      );
                  setQuantity(clamped);
                  setQuantityInput(String(clamped));
                }}
                className="w-full sm:w-40 rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-700/30 focus:border-emerald-400 transition-all"
              />
            </div>
          </div>

          <button
            type="button"
            onClick={handleGenerate}
            disabled={files.length === 0}
            className="w-full inline-flex items-center justify-center gap-2 bg-linear-to-r from-emerald-600 to-green-700 hover:from-emerald-500 hover:to-green-600 disabled:opacity-50 disabled:hover:from-emerald-600 disabled:hover:to-green-700 text-white font-bold py-3.5 rounded-2xl shadow-lg shadow-emerald-600/25 transition-all duration-200"
          >
            {copy.generateLabel}
            <Wand2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      <Modal
        open={status === "generating"}
        onClose={() => {}}
        showCloseButton={false}
        contentClassName="p-6"
      >
        <h2 className="font-heading text-lg font-bold text-slate-900 mb-3">
          {copy.generatingDialog.title}
        </h2>
        <div className="h-2 rounded-full bg-slate-100 overflow-hidden">
          <div
            className="h-full rounded-full bg-linear-to-r from-emerald-500 to-green-600 transition-[width] duration-100 ease-linear"
            style={{ width: `${progress}%` }}
          />
        </div>
        <p className="text-sm text-slate-400 text-center mt-3">
          {copy.generatingDialog.progressLabel} {Math.round(progress)}%
        </p>
      </Modal>

      <Modal
        open={status === "error"}
        onClose={() => setStatus("idle")}
        contentClassName="p-6"
      >
        <h2 className="font-heading text-lg font-bold text-slate-900 mb-2">
          {copy.errorDialog.title}
        </h2>
        <p className="text-sm text-slate-500 leading-relaxed mb-5">
          {errorMessage}
        </p>
        <button
          type="button"
          onClick={
            canRetry
              ? handleTryAgain
              : () => {
                  setStatus("idle");
                  fileInputRef.current?.click();
                }
          }
          className="inline-flex items-center gap-2 bg-linear-to-r from-emerald-600 to-green-700 hover:from-emerald-500 hover:to-green-600 text-white text-sm font-bold px-5 py-2.5 rounded-2xl shadow-lg shadow-emerald-600/20 transition-all duration-200"
        >
          {canRetry
            ? copy.errorDialog.retryLabel
            : copy.errorDialog.chooseDifferentFileLabel}
        </button>
      </Modal>

      <QuizResultModal
        open={resultModalOpen}
        quiz={result}
        onClose={() => setResultModalOpen(false)}
      />
    </>
  );
}