"use client";

import { useState, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  Upload,
  Wand2,
  Download,
  RefreshCw,
  BookOpen,
  Loader2,
} from "lucide-react";
import Modal from "@/components/ui/modal";
import { generatePanelContent as copy } from "@/data/dashboard/user/home";
import {
  generateQuiz as generateQuizRequest,
  type QuizTypeInput,
} from "@/services/user-quiz-generate-service";
import { getQuizDetail } from "@/services/user-quiz-list-service";
import { downloadQuizzes as downloadQuizzesRequest } from "@/services/quiz-download-service";

type GenerateStatus = "idle" | "generating" | "success" | "error";

interface Question {
  number: number;
  text: string;
  type: "mcq" | "tf" | "identification";
  options?: string[];
  answer: string;
}

interface QuizResult {
  id: string;
  documentName: string;
  category: string;
  quantity: number;
  questions: Question[];
  totalQuestions: number;
}

const QUIZ_TYPE_TO_SERVER: Record<string, QuizTypeInput> = {
  mcq: "multiple_choice",
  tf: "true_false",
  identification: "identification",
};

const SERVER_TYPE_TO_LABEL: Record<QuizTypeInput, string> = {
  multiple_choice: "Multiple Choice",
  true_false: "True or False",
  identification: "Identification",
};

async function generateQuiz(
  file: File,
  category: string,
  quantity: number
): Promise<QuizResult> {
  const serverQuizType = QUIZ_TYPE_TO_SERVER[category] ?? "multiple_choice";
  const created = await generateQuizRequest(file, serverQuizType, quantity);
  const detail = await getQuizDetail(created.id);

  return {
    id: detail.id,
    documentName: file.name,
    category: SERVER_TYPE_TO_LABEL[created.quizType],
    quantity: detail.quantity,
    questions: detail.questions,
    totalQuestions: detail.quantity,
  };
}

async function downloadQuiz(quizId: string) {
  const result = await downloadQuizzesRequest([quizId]);
  const url = URL.createObjectURL(result.blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = result.filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

function QuizResultModal({
  open,
  result,
  onClose,
  onGenerateAnother,
}: {
  open: boolean;
  result: QuizResult | null;
  onClose: () => void;
  onGenerateAnother: () => void;
}) {
  const router = useRouter();
  const [isDownloading, setIsDownloading] = useState(false);
  const [downloadMessage, setDownloadMessage] = useState("");

  if (!result) return null;

  const previewQuestions = result.questions;

  const handleDownload = async () => {
    setIsDownloading(true);
    setDownloadMessage("");
    try {
      await downloadQuiz(result.id);
      setDownloadMessage(copy.resultModal.downloadSuccessMessage);
    } catch {
      setDownloadMessage(copy.resultModal.downloadErrorMessage);
    } finally {
      setIsDownloading(false);
    }
  };

  const handleViewQuizzes = () => {
    onClose();
    router.push("/user/quizzes");
  };

  return (
    <Modal open={open} onClose={onClose} maxWidthClassName="max-w-2xl" contentClassName="p-6">
      <h2 className="font-heading text-xl font-bold text-slate-900 mb-1">
        {copy.resultModal.title}
      </h2>
      <p className="text-sm text-slate-400 mb-5">
        {result.documentName} · {result.category} · {result.totalQuestions} questions
      </p>

      <div className="flex flex-col gap-5">
        <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
          <p className="text-sm font-semibold text-slate-900">{result.documentName}</p>
          <p className="text-xs text-slate-400 mt-1">
            {result.category} · {result.totalQuestions} questions
          </p>
        </div>

        <div className="flex flex-col gap-4">
          {previewQuestions.map((q) => (
            <div key={q.number} className="flex flex-col gap-2">
              <p className="text-sm font-medium text-slate-900">
                {q.number}. {q.text}
              </p>

              {q.type === "mcq" && q.options && (
                <div className="grid grid-cols-2 gap-1.5 pl-4">
                  {q.options.map((opt, i) => (
                    <p key={i} className="text-xs text-slate-500">
                      {String.fromCharCode(65 + i)}. {opt}
                    </p>
                  ))}
                </div>
              )}

              {q.type === "tf" && (
                <div className="flex gap-4 pl-4">
                  <p className="text-xs text-slate-500">A. True</p>
                  <p className="text-xs text-slate-500">B. False</p>
                </div>
              )}

              {q.type === "identification" && (
                <div className="pl-4">
                  <div className="border-b border-slate-300 w-48 h-5" />
                </div>
              )}
            </div>
          ))}
        </div>

        <div className="border-t border-dashed border-slate-200 pt-4 flex flex-col gap-2">
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide">
            {copy.resultModal.answerKeyLabel}
          </p>
          <p className="text-xs text-slate-500">
            {previewQuestions.map((q) => `${q.number}. ${q.answer}`).join("  ")}
          </p>
        </div>

        <p className="text-xs text-slate-400 text-center">
          {copy.resultModal.captionPrefix} {previewQuestions.length}{" "}
          {copy.resultModal.captionMiddle} {result.totalQuestions}{" "}
          {copy.resultModal.captionSuffix}
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <button
            type="button"
            onClick={onGenerateAnother}
            className="inline-flex items-center justify-center gap-1.5 rounded-2xl border border-slate-200 px-4 py-2.5 text-sm font-medium text-slate-600 hover:bg-slate-50 transition-colors"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            {copy.resultModal.generateAnotherLabel}
          </button>
          <button
            type="button"
            onClick={handleViewQuizzes}
            className="inline-flex items-center justify-center gap-1.5 rounded-2xl border border-slate-200 px-4 py-2.5 text-sm font-medium text-slate-600 hover:bg-slate-50 transition-colors"
          >
            <BookOpen className="w-3.5 h-3.5" />
            {copy.resultModal.viewQuizzesLabel}
          </button>
          <button
            type="button"
            onClick={handleDownload}
            disabled={isDownloading}
            className="inline-flex items-center justify-center gap-1.5 rounded-2xl bg-gradient-to-r from-emerald-600 to-green-700 hover:from-emerald-500 hover:to-green-600 disabled:opacity-60 text-white px-4 py-2.5 text-sm font-bold shadow-lg shadow-emerald-600/20 transition-all"
          >
            {isDownloading ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                {copy.resultModal.downloadingLabel}
              </>
            ) : (
              <>
                <Download className="w-3.5 h-3.5" />
                {copy.resultModal.downloadLabel}
              </>
            )}
          </button>
        </div>

        {downloadMessage && (
          <p className="text-xs text-slate-400 text-center">{downloadMessage}</p>
        )}
      </div>
    </Modal>
  );
}

export default function Home() {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [uploadError, setUploadError] = useState("");
  const [quizType, setQuizType] = useState<string>(copy.quizType.options[0].value);
  const [quantity, setQuantity] = useState<number>(copy.quantity.min);
  const [status, setStatus] = useState<GenerateStatus>("idle");
  const [progress, setProgress] = useState(0);
  const [result, setResult] = useState<QuizResult | null>(null);
  const [resultModalOpen, setResultModalOpen] = useState(false);

  const handleFile = useCallback((f: File) => {
    const allowed = [
      "application/pdf",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    ];
    if (!allowed.includes(f.type)) {
      setUploadError(copy.upload.invalidTypeMessage);
      return;
    }
    if (f.size > copy.upload.maxSizeBytes) {
      setUploadError(copy.upload.tooLargeMessage);
      return;
    }
    setUploadError("");
    setFile(f);
  }, []);

  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (f) handleFile(f);
  };

  const onDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    const f = e.dataTransfer.files?.[0];
    if (f) handleFile(f);
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const runGeneration = async (f: File, type: string, qty: number) => {
    setStatus("generating");
    setProgress(0);
    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev < 40) return prev + Math.random() * 6;
        if (prev < 65) return prev + Math.random() * 3;
        if (prev < 80) return prev + Math.random() * 1.5;
        if (prev < 90) return prev + Math.random() * 0.6;
        if (prev < 95) return prev + Math.random() * 0.2;
        return prev;
      });
    }, 120);

    try {
      const generated = await generateQuiz(f, type, qty);
      clearInterval(interval);
      setProgress(100);
      setStatus("success");
      setTimeout(() => {
        setProgress(0);
        setStatus("idle");
        setResult(generated);
        setResultModalOpen(true);
      }, 150);
    } catch {
      clearInterval(interval);
      setStatus("error");
    }
  };

  const handleGenerate = async () => {
    if (!file) return;
    await runGeneration(file, quizType, quantity);
  };

  const handleTryAgain = async () => {
    if (!file) return;
    await runGeneration(file, quizType, quantity);
  };

  const handleGenerateAnother = () => {
    setResultModalOpen(false);
    setResult(null);
    setFile(null);
  };

  return (
    <>
      <div className="flex-1 flex items-center justify-center">
        <div className="flex flex-col gap-6 w-full max-w-2xl">
          <div
            className={`rounded-2xl bg-white h-40 transition-all duration-200 ${
              !file
                ? "border-2 border-dashed border-slate-200 hover:border-slate-300"
                : "border border-slate-200 shadow-sm"
            }`}
          >
            <div
              className={`flex items-center justify-center h-full ${
                file ? "px-4 sm:px-6" : ""
              }`}
            >
              {!file ? (
                <div
                  onDrop={onDrop}
                  onDragOver={(e) => e.preventDefault()}
                  onClick={() => fileInputRef.current?.click()}
                  className="flex flex-col items-center justify-center gap-2 cursor-pointer w-full h-full"
                >
                  <Upload className="w-8 h-8 sm:w-10 sm:h-10 text-slate-300" />
                  <p className="text-sm sm:text-base font-medium text-slate-600">
                    {copy.upload.label}
                  </p>
                  <p className="text-xs sm:text-sm text-slate-400">{copy.upload.hint}</p>
                  <p className="text-[11px] text-slate-300">{copy.upload.maxSizeLabel}</p>
                </div>
              ) : (
                <div className="flex items-center justify-between gap-3 sm:gap-4 w-full">
                  <div className="min-w-0">
                    <p className="text-sm sm:text-base font-semibold text-slate-900 truncate">
                      {file.name}
                    </p>
                    <p className="text-xs sm:text-sm text-slate-400 mt-0.5">
                      {file.name.split(".").pop()?.toUpperCase()} ·{" "}
                      {formatFileSize(file.size)}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="rounded-full px-4 sm:px-6 py-2 shrink-0 text-xs sm:text-sm font-medium border border-slate-200 text-slate-600 hover:bg-slate-50 transition-colors"
                  >
                    {copy.upload.changeLabel}
                  </button>
                </div>
              )}
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf,.docx"
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
                    className={`flex items-center gap-2 px-4 py-2.5 rounded-xl border text-sm cursor-pointer transition-all duration-200 w-full sm:w-auto ${
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
                      onChange={() => setQuizType(value)}
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
                <span className="text-xs text-slate-400">{copy.quantity.hint}</span>
              </div>
              <input
                type="number"
                min={copy.quantity.min}
                max={copy.quantity.max}
                value={quantity}
                onChange={(e) => setQuantity(Number(e.target.value))}
                onBlur={() =>
                  setQuantity((prev) =>
                    Math.min(copy.quantity.max, Math.max(copy.quantity.min, prev))
                  )
                }
                className="w-full sm:w-40 rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-400 transition-all"
              />
            </div>
          </div>

          <button
            type="button"
            onClick={handleGenerate}
            disabled={!file}
            className="w-full inline-flex items-center justify-center gap-2 bg-gradient-to-r from-emerald-600 to-green-700 hover:from-emerald-500 hover:to-green-600 disabled:opacity-50 disabled:hover:from-emerald-600 disabled:hover:to-green-700 text-white font-bold py-3.5 rounded-2xl shadow-lg shadow-emerald-600/25 transition-all duration-200"
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
            className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-green-600 transition-all duration-150"
            style={{ width: `${Math.min(progress, 100)}%` }}
          />
        </div>
        <p className="text-sm text-slate-400 text-center mt-3">
          {copy.generatingDialog.progressLabel} {Math.floor(progress)}%
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
          {copy.errorDialog.description}
        </p>
        <button
          type="button"
          onClick={handleTryAgain}
          className="inline-flex items-center gap-2 bg-gradient-to-r from-emerald-600 to-green-700 hover:from-emerald-500 hover:to-green-600 text-white text-sm font-bold px-5 py-2.5 rounded-2xl shadow-lg shadow-emerald-600/20 transition-all duration-200"
        >
          {copy.errorDialog.retryLabel}
        </button>
      </Modal>

      <QuizResultModal
        open={resultModalOpen}
        result={result}
        onClose={() => setResultModalOpen(false)}
        onGenerateAnother={handleGenerateAnother}
      />
    </>
  );
}