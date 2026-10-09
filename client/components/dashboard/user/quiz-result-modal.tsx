"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { Download, RefreshCw, BookOpen, Loader2 } from "lucide-react";
import Modal from "@/components/ui/modal";
import { downloadQuizzes as downloadQuizzesRequest } from "@/services/dashboard/quiz-download-service";
import { triggerBrowserDownload } from "@/services/browser-download";

const copy = {
  resultModal: {
    title: "Quiz Generated!",
    answerKeyLabel: "Answer Key",
    downloadPrompt: "Download for the full quiz and answer key",
    generateAnotherLabel: "Generate Another",
    viewQuizzesLabel: "View My Quizzes",
    downloadLabel: "Download Quiz",
    downloadingLabel: "Preparing download...",
    downloadSuccessMessage: "Download started",
    downloadErrorMessage: "Download failed. Please try again.",
  },
};

export interface Question {
  number: number;
  text: string;
  type: "mcq" | "tf" | "identification";
  options?: string[];
  answer: string;
}

export interface QuizResult {
  id: string;
  documentName: string;
  category: string;
  quantity: number;
  questions: Question[];
  totalQuestions: number;
}

async function downloadQuiz(quizId: string) {
  const result = await downloadQuizzesRequest([quizId]);
  triggerBrowserDownload(result.blob, result.filename);
}

export function QuizResultModal({
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
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  if (!result) return null;

  const previewQuestions = result.questions;

  const handleClose = () => {
    setDownloadMessage("");
    onClose();
  };

  const handleGenerateAnotherClick = () => {
    setDownloadMessage("");
    onGenerateAnother();
  };

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
    <Modal
      open={open}
      onClose={handleClose}
      maxWidthClassName="max-w-2xl"
      contentClassName="px-6 pb-6"
      scrollContainerRef={scrollContainerRef}
      header={
        <div className="px-6 pr-14 pt-6 pb-4 border-b border-slate-100">
          <h2 className="font-heading text-xl font-bold text-slate-900 mb-1">
            {copy.resultModal.title}
          </h2>
          <p className="text-sm text-slate-400">
            {result.documentName} · {result.category} · {result.totalQuestions} questions
          </p>
        </div>
      }
      footer={
        <div className="px-6 pt-4 pb-6 border-t border-slate-100 flex flex-col gap-3">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <button
              type="button"
              onClick={handleGenerateAnotherClick}
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
              className="inline-flex items-center justify-center gap-1.5 rounded-2xl bg-linear-to-r from-emerald-600 to-green-700 hover:from-emerald-500 hover:to-green-600 disabled:opacity-60 text-white px-4 py-2.5 text-sm font-bold shadow-lg shadow-emerald-600/20 transition-all"
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

          <p className="text-xs text-slate-400 text-center">
            {downloadMessage || copy.resultModal.downloadPrompt}
          </p>
        </div>
      }
    >
      <div className="flex flex-col gap-5 pt-5">
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
            </div>
          ))}
        </div>

        <div className="border-t border-dashed border-slate-200 pt-4 flex flex-col gap-2">
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide">
            {copy.resultModal.answerKeyLabel}
          </p>
          <div className="grid grid-cols-3 gap-x-4 gap-y-1">
            {previewQuestions.map((q) => (
              <p key={q.number} className="text-xs text-slate-500">
                {q.number}. {q.answer}
              </p>
            ))}
          </div>
        </div>
      </div>
    </Modal>
  );
}