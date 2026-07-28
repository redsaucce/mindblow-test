"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { FileX, Download, ScrollText } from "lucide-react";
import Modal from "@/components/ui/modal";
import AlertModal from "@/components/ui/alert-modal";
import ScrollBar from "@/components/ui/scroll-bar";
import EmptyState from "@/components/ui/empty-state";
import { useAutoScrollHeight } from "@/hooks/use-auto-scroll-height";
import { quizListContent as copy } from "@/data/dashboard/user/quiz-list";
import { emptyStates } from "@/data/ui/empty-states";
import { type Quiz, listQuizzes, deleteQuiz as deleteQuizRequest } from "@/services/user-quiz-list-service";
import { downloadQuizzes as downloadQuizzesRequest } from "@/services/quiz-download-service";

type DeleteTarget = { type: "single"; id: string } | { type: "bulk" } | null;
type DownloadTarget = { ids: string[] } | null;
type LoadState = "loading" | "ready" | "error";

async function deleteQuizzes(ids: string[]) {
  await Promise.all(ids.map((id) => deleteQuizRequest(id)));
}

function triggerBrowserDownload(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

function interpolate(template: string, count: number) {
  return template.replace("{count}", String(count));
}

export default function QuizList() {
  const router = useRouter();
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [loadState, setLoadState] = useState<LoadState>("loading");
  const { containerRef: autoHeightRef, maxHeight } = useAutoScrollHeight({
    recomputeKey: loadState,
  });
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [deleteTarget, setDeleteTarget] = useState<DeleteTarget>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [downloadTarget, setDownloadTarget] = useState<DownloadTarget>(null);
  const [isDownloading, setIsDownloading] = useState(false);
  const [previewQuiz, setPreviewQuiz] = useState<Quiz | null>(null);
  const [feedback, setFeedback] = useState("");

  useEffect(() => {
    let cancelled = false;
    setLoadState("loading");
    listQuizzes()
      .then((data) => {
        if (cancelled) return;
        setQuizzes(data);
        setLoadState("ready");
      })
      .catch(() => {
        if (cancelled) return;
        setLoadState("error");
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const allChecked = quizzes.length > 0 && selected.size === quizzes.length;
  const someChecked = selected.size > 0 && selected.size < quizzes.length;

  const toggleAll = () => {
    setSelected(allChecked ? new Set() : new Set(quizzes.map((q) => q.id)));
  };

  const toggleOne = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const handleDeleteClick = () => {
    if (selected.size === 0) return;
    setDeleteTarget({ type: "bulk" });
  };

  const handleDownloadClick = () => {
    if (selected.size === 0) return;
    setDownloadTarget({ ids: Array.from(selected) });
  };

  const showFeedback = (message: string) => {
    setFeedback(message);
    setTimeout(() => setFeedback(""), 4000);
  };

  const handleConfirmDownload = async () => {
    if (!downloadTarget) return;
    setIsDownloading(true);
    try {
      const result = await downloadQuizzesRequest(downloadTarget.ids);
      triggerBrowserDownload(result.blob, result.filename);

      const count = downloadTarget.ids.length;
      setDownloadTarget(null);

      if (result.failedTitles.length > 0) {
        showFeedback(
          `Downloaded, but ${result.failedTitles.length} quiz(es) failed: ${result.failedTitles.join(", ")}`
        );
      } else {
        showFeedback(
          count === 1
            ? copy.feedback.downloadStartedSingle
            : interpolate(copy.feedback.downloadStartedManyTemplate, count)
        );
      }
    } catch {
      setDownloadTarget(null);
      showFeedback(copy.feedback.downloadError);
    } finally {
      setIsDownloading(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (!deleteTarget) return;
    const ids = deleteTarget.type === "single" ? [deleteTarget.id] : Array.from(selected);
    setIsDeleting(true);
    try {
      await deleteQuizzes(ids);
      setQuizzes((prev) => prev.filter((q) => !ids.includes(q.id)));
      setSelected((prev) => {
        const next = new Set(prev);
        ids.forEach((id) => next.delete(id));
        return next;
      });
      setDeleteTarget(null);
      showFeedback(
        ids.length === 1
          ? copy.feedback.quizDeletedSingle
          : interpolate(copy.feedback.quizDeletedManyTemplate, ids.length)
      );
    } catch {
      setDeleteTarget(null);
      showFeedback(copy.feedback.deleteError);
    } finally {
      setIsDeleting(false);
    }
  };

  const dialogTitle = () => {
    if (!deleteTarget) return "";
    if (deleteTarget.type === "single") return copy.deleteDialog.singleTitle;
    if (allChecked) return copy.deleteDialog.allTitle;
    return interpolate(copy.deleteDialog.someTitleTemplate, selected.size);
  };

  const dialogDescription = () => {
    if (!deleteTarget) return "";
    if (deleteTarget.type === "single") return copy.deleteDialog.singleDescription;
    if (allChecked)
      return interpolate(copy.deleteDialog.allDescriptionTemplate, quizzes.length);
    return copy.deleteDialog.someDescription;
  };

  return (
    <>
      <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
        <div className="flex items-center justify-between px-4 py-2.5 border-b border-slate-100">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={allChecked}
              ref={(el) => {
                if (el) el.indeterminate = someChecked;
              }}
              onChange={toggleAll}
              aria-label="Select all"
              className="h-4 w-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500/30"
            />
            <span className="text-sm text-slate-600">{copy.selectAllLabel}</span>
          </label>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleDownloadClick}
              disabled={selected.size === 0}
              className="rounded-full px-6 py-1.5 text-sm font-medium border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:hover:bg-transparent transition-colors"
            >
              {copy.downloadLabel}
            </button>
            <button
              type="button"
              onClick={handleDeleteClick}
              disabled={selected.size === 0}
              className="rounded-full px-6 py-1.5 text-sm font-medium border border-red-200 text-red-500 hover:bg-red-50 disabled:opacity-40 disabled:hover:bg-transparent transition-colors"
            >
              {selected.size > 0 ? `${copy.deleteLabel} (${selected.size})` : copy.deleteAllLabel}
            </button>
          </div>
        </div>

        {feedback && (
          <p className="px-4 py-2 text-xs text-slate-500 bg-slate-50 border-b border-slate-100">
            {feedback}
          </p>
        )}

        {loadState === "loading" ? (
          <div className="py-20 flex flex-col items-center justify-center">
            <EmptyState
              icon={ScrollText}
              title={emptyStates.quizList.title}
              subtitle="Loading your quizzes..."
            />
          </div>
        ) : loadState === "error" ? (
          <div className="py-20 flex flex-col items-center justify-center">
            <EmptyState
              icon={FileX}
              title="Something went wrong"
              subtitle="We couldn't load your quizzes. Please try again."
            />
          </div>
        ) : quizzes.length === 0 ? (
          <div className="py-20 flex flex-col items-center justify-center">
            <EmptyState
              icon={FileX}
              title={emptyStates.quizList.title}
              subtitle={emptyStates.quizList.subtitle}
              action={{
                label: emptyStates.quizList.ctaLabel,
                onClick: () => router.push("/user"),
              }}
            />
          </div>
        ) : (
          <div className="relative">
            <div
              ref={(el) => {
                scrollContainerRef.current = el;
                autoHeightRef.current = el;
              }}
              className="no-scrollbar overflow-y-auto"
              style={{ maxHeight: maxHeight ?? undefined }}
            >
              {quizzes.map((quiz) => (
                <div
                  key={quiz.id}
                  onClick={() => setPreviewQuiz(quiz)}
                  className="flex items-center gap-3 px-4 py-3.5 border-b border-slate-100 hover:bg-slate-50 cursor-pointer transition-colors duration-200 last:border-b-0"
                >
                  <div onClick={(e) => e.stopPropagation()}>
                    <input
                      type="checkbox"
                      checked={selected.has(quiz.id)}
                      onChange={() => toggleOne(quiz.id)}
                      aria-label={`Select ${quiz.documentName}`}
                      className="h-4 w-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500/30"
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="hidden md:flex items-center justify-between gap-4">
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-slate-900 truncate">
                          {quiz.documentName}
                        </p>
                        <p className="text-xs text-slate-400 mt-0.5">
                          {quiz.category} · {quiz.quantity} questions
                        </p>
                      </div>
                      <p className="text-xs text-slate-400 shrink-0">{quiz.date}</p>
                    </div>
                    <div className="flex md:hidden items-center justify-between gap-2">
                      <p className="text-sm font-semibold text-slate-900 truncate">
                        {quiz.documentName}
                      </p>
                      <p className="text-xs text-slate-400 shrink-0">{quiz.date}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <ScrollBar containerRef={scrollContainerRef} />
          </div>
        )}
      </div>

      {/* Delete confirmation */}
      <AlertModal
        open={!!deleteTarget}
        onClose={() => {
          if (!isDeleting) setDeleteTarget(null);
        }}
        title={dialogTitle()}
        description={dialogDescription()}
        cancelLabel={copy.deleteDialog.cancelLabel}
        confirmLabel={copy.deleteDialog.confirmLabel}
        loadingLabel={copy.deleteDialog.deletingLabel}
        isLoading={isDeleting}
        onConfirm={handleConfirmDelete}
        confirmVariant="danger"
      />

      {/* Download confirmation */}
      <AlertModal
        open={!!downloadTarget}
        onClose={() => {
          if (!isDownloading) setDownloadTarget(null);
        }}
        title={
          downloadTarget?.ids.length === 1
            ? copy.downloadDialog.singleTitle
            : interpolate(copy.downloadDialog.manyTitleTemplate, downloadTarget?.ids.length ?? 0)
        }
        description={
          downloadTarget?.ids.length === 1
            ? copy.downloadDialog.singleDescription
            : interpolate(
                copy.downloadDialog.manyDescriptionTemplate,
                downloadTarget?.ids.length ?? 0
              )
        }
        cancelLabel={copy.downloadDialog.cancelLabel}
        confirmLabel={copy.downloadDialog.confirmLabel}
        loadingLabel={copy.downloadDialog.downloadingLabel}
        isLoading={isDownloading}
        onConfirm={handleConfirmDownload}
        confirmVariant="primary"
        confirmIcon={Download}
      />

      {/* Quiz preview */}
      <Modal
        open={!!previewQuiz}
        onClose={() => setPreviewQuiz(null)}
        maxWidthClassName="max-w-lg"
        contentClassName="p-6"
      >
        {previewQuiz && (
          <>
            <h2 className="font-heading text-lg font-bold text-slate-900 mb-1">
              {previewQuiz.documentName}
            </h2>
            <p className="text-sm text-slate-400 mb-5">
              {previewQuiz.category} · {previewQuiz.quantity} questions · {previewQuiz.date}
            </p>
            <button
              type="button"
              onClick={() => {
                const quiz = previewQuiz;
                setPreviewQuiz(null);
                setDownloadTarget({ ids: [quiz.id] });
              }}
              className="inline-flex items-center gap-2 bg-gradient-to-r from-emerald-600 to-green-700 hover:from-emerald-500 hover:to-green-600 text-white text-sm font-bold px-5 py-2.5 rounded-2xl shadow-lg shadow-emerald-600/20 transition-all duration-200"
            >
              <Download className="w-4 h-4" />
              {copy.previewModal.downloadLabel}
            </button>
          </>
        )}
      </Modal>
    </>
  );
}