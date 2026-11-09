"use client";

import { Fragment, useEffect, useId, useRef, useState } from "react";
import { CheckCircle2, Download, Loader2, XCircle } from "lucide-react";
import Modal from "@/components/ui/modal";
import { downloadQuizzes as downloadQuizzesRequest } from "@/services/dashboard/quiz-download-service";
import { triggerBrowserDownload } from "@/services/browser-download";
import { ApiError } from "@/services/api-client";
import { checkQuiz, type CheckQuizResult } from "@/services/dashboard/user-quiz-list-service";

const copy = {
  checkLabel: "Check answers",
  tryAgainLabel: "Try again",
  downloadLabel: "Download",
  downloadingLabel: "Preparing download...",
  downloadSuccess: "Download started",
  downloadError: "Download failed. Please try again.",
  checkError: "Something went wrong. Please try again.",
  leftTemplate: "{count} questions left to answer",
  scoreTemplate: "{correct} of {total} correct ({percentage}%)",
  correctLabel: "Correct",
  wrongLabel: "Wrong",
  yourAnswerLabel: "Your answer:",
  correctAnswerLabel: "Correct answer:",
  loadingQuestions: "Loading questions...",
  loadErrorTitle: "Couldn't load this quiz",
  loadErrorSubtitle: "Please try again.",
};

export interface Question {
  number: number;
  text: string;
  type: "mcq" | "tf" | "identification";
  options?: string[];
}

export interface QuizResult {
  id: string;
  documentName: string;
  category: string;
  quantity: number;
  questions: Question[];
  totalQuestions: number;
}

function fill(template: string, values: Record<string, number>) {
  return template.replace(/\{(\w+)\}/g, (_, key: string) => String(values[key] ?? ""));
}

const sectionNames: Record<string, string> = {
  multiple_choice: "Multiple Choice",
  true_false: "True or False",
  identification: "Identification",
  mcq: "Multiple Choice",
  tf: "True or False",
};

const sectionLabels: Record<Question["type"], string> = {
  mcq: "Multiple Choice",
  tf: "True or False",
  identification: "Identification",
};

function optionsFor(q: Question): string[] {
  return q.type === "tf" ? ["True", "False"] : (q.options ?? []);
}

function isAnswered(value: string | undefined) {
  return !!value && value.trim() !== "";
}

/**
 * Takes a quiz in the app. Used after generation and from My Quizzes.
 * Answers are graded on the server, so the correct answers are only returned by a check.
 */
export function QuizResultModal({
  open,
  quiz,
  onClose,
  loading = false,
  loadError = false,
}: {
  open: boolean;
  quiz: QuizResult | null;
  onClose: () => void;
  loading?: boolean;
  loadError?: boolean;
}) {
  const groupId = useId();
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const scoreRef = useRef<HTMLDivElement>(null);
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [results, setResults] = useState<CheckQuizResult | null>(null);
  const [checking, setChecking] = useState(false);
  const [checkError, setCheckError] = useState("");
  const [isDownloading, setIsDownloading] = useState(false);
  const [downloadMessage, setDownloadMessage] = useState("");

  // Start fresh each time the dialog opens or a different quiz is shown.
  useEffect(() => {
    setAnswers({});
    setResults(null);
    setCheckError("");
    setDownloadMessage("");
  }, [open, quiz?.id]);

  // Move focus to the score once it appears.
  useEffect(() => {
    if (results) scoreRef.current?.focus();
  }, [results]);

  const questions = quiz?.questions ?? [];
  const answeredCount = questions.filter((q) => isAnswered(answers[q.number])).length;
  const remaining = questions.length - answeredCount;
  const locked = results !== null;

  const setAnswer = (number: number, value: string) => {
    setAnswers((prev) => ({ ...prev, [number]: value }));
  };

  const resultFor = (number: number) => results?.results.find((r) => r.number === number);

  // A mixed quiz has more than one question type. Its questions are shown in sections.
  const hasSections = new Set(questions.map((q) => q.type)).size > 1;
  const sectionCount = (type: Question["type"]) => questions.filter((q) => q.type === type).length;

  const handleCheck = async () => {
    if (!quiz || remaining > 0 || checking) return;
    setChecking(true);
    setCheckError("");
    try {
      const payload = questions.map((q) => ({ number: q.number, answer: answers[q.number] ?? "" }));
      setResults(await checkQuiz(quiz.id, payload));
    } catch (err) {
      setCheckError(err instanceof ApiError ? err.detail : copy.checkError);
    } finally {
      setChecking(false);
    }
  };

  const handleTryAgain = () => {
    setAnswers({});
    setResults(null);
    setCheckError("");
  };

  const handleDownload = async () => {
    if (!quiz) return;
    setIsDownloading(true);
    setDownloadMessage("");
    try {
      const result = await downloadQuizzesRequest([quiz.id]);
      triggerBrowserDownload(result.blob, result.filename);
      setDownloadMessage(copy.downloadSuccess);
    } catch {
      setDownloadMessage(copy.downloadError);
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      maxWidthClassName="max-w-2xl"
      contentClassName="px-6 pb-6"
      scrollContainerRef={scrollContainerRef}
      header={
        <div className="px-6 pr-14 pt-6 pb-4 border-b border-slate-100">
          <h2 className="font-heading text-xl font-bold text-slate-900 mb-1">
            {quiz?.documentName ?? ""}
          </h2>
          {quiz && (
            <p className="text-sm text-slate-400">
              {quiz.category} · {quiz.totalQuestions} questions
            </p>
          )}
        </div>
      }
      footer={
        quiz ? (
          <div className="px-6 pt-4 pb-6 border-t border-slate-100 flex flex-col gap-3">
            {results ? (
              <div
                ref={scoreRef}
                tabIndex={-1}
                role="status"
                className="rounded-2xl bg-emerald-50 px-4 py-3 text-center text-sm font-semibold text-emerald-800 focus:outline-none"
              >
                {fill(copy.scoreTemplate, {
                  correct: results.correct,
                  total: results.total,
                  percentage: results.percentage,
                })}
                {results.sections.length > 1 && (
                  <ul className="mt-2 flex flex-col gap-0.5 text-xs font-normal text-emerald-900">
                    {results.sections.map((s) => (
                      <li key={s.type}>
                        {sectionNames[s.type] ?? s.type}: {s.correct} of {s.total}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            ) : (
              remaining > 0 && (
                <p className="text-xs text-slate-400 text-center">
                  {fill(copy.leftTemplate, { count: remaining })}
                </p>
              )
            )}

            {checkError && <p className="text-xs text-red-500 text-center">{checkError}</p>}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <button
                type="button"
                onClick={handleDownload}
                disabled={isDownloading}
                className="inline-flex items-center justify-center gap-1.5 rounded-2xl border border-slate-200 px-4 py-2.5 text-sm font-medium text-slate-600 hover:bg-slate-50 disabled:opacity-60 transition-colors"
              >
                {isDownloading ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    {copy.downloadingLabel}
                  </>
                ) : (
                  <>
                    <Download className="w-3.5 h-3.5" />
                    {copy.downloadLabel}
                  </>
                )}
              </button>
              {results ? (
                <button
                  type="button"
                  onClick={handleTryAgain}
                  className="inline-flex items-center justify-center rounded-2xl bg-linear-to-r from-emerald-600 to-green-700 hover:from-emerald-500 hover:to-green-600 text-white px-4 py-2.5 text-sm font-bold shadow-lg shadow-emerald-600/20 transition-all"
                >
                  {copy.tryAgainLabel}
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleCheck}
                  disabled={remaining > 0 || checking}
                  className="inline-flex items-center justify-center gap-1.5 rounded-2xl bg-linear-to-r from-emerald-600 to-green-700 hover:from-emerald-500 hover:to-green-600 disabled:opacity-60 text-white px-4 py-2.5 text-sm font-bold shadow-lg shadow-emerald-600/20 transition-all"
                >
                  {checking && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  {copy.checkLabel}
                </button>
              )}
            </div>

            <p className="text-xs text-slate-400 text-center">{downloadMessage}</p>
          </div>
        ) : undefined
      }
    >
      {loading && <p className="text-sm text-slate-500 text-center py-8">{copy.loadingQuestions}</p>}

      {loadError && (
        <div className="flex flex-col items-center gap-1 py-8 text-center">
          <p className="text-sm text-slate-700">{copy.loadErrorTitle}</p>
          <p className="text-xs text-slate-400">{copy.loadErrorSubtitle}</p>
        </div>
      )}

      {quiz && !loading && !loadError && (
        <div className="flex flex-col gap-5 pt-5">
          {questions.map((q, index) => {
            const r = resultFor(q.number);
            const name = `${groupId}-q${q.number}`;
            const value = answers[q.number] ?? "";
            const startsSection = hasSections && (index === 0 || questions[index - 1].type !== q.type);
            return (
              <Fragment key={q.number}>
                {startsSection && (
                  <h3 className="text-xs font-bold uppercase tracking-wide text-slate-500 pt-2">
                    {sectionLabels[q.type]} ({sectionCount(q.type)})
                  </h3>
                )}
              <fieldset className="flex flex-col gap-2">
                <legend className="text-sm font-medium text-slate-900 mb-2">
                  {q.number}. {q.text}
                </legend>

                {q.type === "identification" ? (
                  <input
                    type="text"
                    aria-label={`Answer for question ${q.number}`}
                    value={value}
                    disabled={locked}
                    onChange={(e) => setAnswer(q.number, e.target.value)}
                    className="rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-900 disabled:bg-slate-50"
                  />
                ) : (
                  <div className="flex flex-col gap-1.5">
                    {optionsFor(q).map((opt) => (
                      <label key={opt} className="flex items-center gap-2 text-sm text-slate-700">
                        <input
                          type="radio"
                          name={name}
                          value={opt}
                          checked={value === opt}
                          disabled={locked}
                          onChange={() => setAnswer(q.number, opt)}
                        />
                        {opt}
                      </label>
                    ))}
                  </div>
                )}

                {r && (
                  <div className="flex items-start gap-2 text-sm">
                    {r.correct ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 mt-0.5 shrink-0" aria-hidden="true" />
                    ) : (
                      <XCircle className="w-4 h-4 text-red-500 mt-0.5 shrink-0" aria-hidden="true" />
                    )}
                    <div className="flex flex-col">
                      <p className={r.correct ? "font-medium text-emerald-700" : "font-medium text-red-600"}>
                        {r.correct ? copy.correctLabel : copy.wrongLabel}
                      </p>
                      {!r.correct && (
                        <>
                          <p className="text-slate-500">
                            {copy.yourAnswerLabel} {r.userAnswer || "—"}
                          </p>
                          <p className="text-slate-500">
                            {copy.correctAnswerLabel} {r.correctAnswer}
                          </p>
                        </>
                      )}
                    </div>
                  </div>
                )}
              </fieldset>
              </Fragment>
            );
          })}
        </div>
      )}
    </Modal>
  );
}