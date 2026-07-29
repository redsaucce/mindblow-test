"use client";

import { useEffect, useMemo, useState } from "react";
import { Users } from "lucide-react";
import DataTable from "@/components/ui/data-table";
import AlertModal from "@/components/ui/alert-modal";
import { emptyStates } from "@/data/ui/empty-states";
import { userListContent as copy } from "@/data/dashboard/admin/user-list";
import type { ColumnDef } from "@tanstack/react-table";
import { type AdminUser, listUsers, deleteUser as deleteUserRequest } from "@/services/dashboard/admin-users-service";

type LoadState = "loading" | "ready" | "error";

export default function UserList() {
  const [loadState, setLoadState] = useState<LoadState>("loading");
  const [data, setData] = useState<AdminUser[]>([]);
  const [total, setTotal] = useState(0);
  const [pageCount, setPageCount] = useState(1);
  const [pageIndex, setPageIndex] = useState(0);
  // Rows-per-page is driven by how many actually fit the viewport
  // (reported by DataTable's onPageSizeChange), not a fixed server
  // default — otherwise an overfull page pushes the footer off-screen
  // and the whole page scrolls instead of paginating.
  const [pageSize, setPageSize] = useState(9);
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [feedback, setFeedback] = useState("");

  useEffect(() => {
    let cancelled = false;
    setLoadState("loading");
    listUsers(pageIndex + 1, pageSize)
      .then((result) => {
        if (cancelled) return;
        setData(result.users);
        setTotal(result.total);
        setPageCount(result.pageCount);
        setLoadState("ready");
      })
      .catch(() => {
        if (cancelled) return;
        setLoadState("error");
      });
    return () => {
      cancelled = true;
    };
  }, [pageIndex, pageSize]);

  const handlePageSizeChange = (nextPageSize: number) => {
    setPageSize((prev) => (prev === nextPageSize ? prev : nextPageSize));
    setPageIndex(0);
  };

  const showFeedback = (message: string) => {
    setFeedback(message);
    setTimeout(() => setFeedback(""), 3000);
  };

  const handleConfirmDelete = async () => {
    if (!deleteTarget) return;
    setIsDeleting(true);
    try {
      await deleteUserRequest(deleteTarget);
      setData((prev) => prev.filter((u) => u.id !== deleteTarget));
      setTotal((prev) => Math.max(0, prev - 1));
      setDeleteTarget(null);
      showFeedback(copy.feedback.deleted);
    } catch {
      setDeleteTarget(null);
      showFeedback(copy.feedback.error);
    } finally {
      setIsDeleting(false);
    }
  };

  const columns = useMemo<ColumnDef<AdminUser>[]>(
    () => [
      {
        accessorKey: "email",
        header: copy.columns.email,
        cell: ({ row }) => (
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-emerald-50 text-emerald-600 font-semibold text-sm flex items-center justify-center shrink-0">
              {row.original.email.charAt(0).toUpperCase()}
            </div>
            <span className="text-sm text-slate-900">{row.original.email}</span>
          </div>
        ),
      },
      {
        accessorKey: "role",
        header: copy.columns.role,
        cell: ({ row }) => (
          <span
            className={`inline-flex items-center text-xs font-medium px-2.5 py-1 rounded-full ${
              row.original.role === "admin"
                ? "bg-emerald-50 text-emerald-700"
                : "bg-slate-100 text-slate-600"
            }`}
          >
            {row.original.role === "admin" ? "Admin" : "User"}
          </span>
        ),
      },
      {
        accessorKey: "generatedQuizzes",
        header: copy.columns.generatedQuizzes,
        cell: ({ row }) => (
          <span className="text-sm text-slate-600">{row.original.generatedQuizzes}</span>
        ),
      },
      {
        accessorKey: "dateRegistered",
        header: copy.columns.dateRegistered,
        cell: ({ row }) => (
          <span className="text-sm text-slate-600">{row.original.dateRegistered}</span>
        ),
      },
      {
        id: "action",
        header: copy.columns.action,
        cell: ({ row }) => (
          <button
            type="button"
            onClick={() => setDeleteTarget(row.original.id)}
            className="text-sm text-red-500 hover:text-red-600 hover:bg-red-50 rounded-lg px-2 py-1 transition-colors"
          >
            {copy.actionLabel}
          </button>
        ),
      },
    ],
    []
  );

  return (
    <>
      <DataTable
        data={data}
        columns={columns}
        columnWidths={[340, 120, 180, 180, 100]}
        emptyIcon={Users}
        emptyTitle={
          loadState === "error"
            ? "Something went wrong"
            : loadState === "loading"
              ? "Loading users..."
              : emptyStates.userList.title
        }
        summaryTemplate={copy.summaryTemplate}
        manualPagination
        pageCount={pageCount}
        totalCount={total}
        onPageChange={setPageIndex}
        onPageSizeChange={handlePageSizeChange}
      />

      {feedback && <p className="mt-3 text-xs text-slate-500">{feedback}</p>}

      <AlertModal
        open={!!deleteTarget}
        onClose={() => {
          if (!isDeleting) setDeleteTarget(null);
        }}
        title={copy.deleteDialog.title}
        description={copy.deleteDialog.description}
        cancelLabel={copy.deleteDialog.cancelLabel}
        confirmLabel={copy.deleteDialog.confirmLabel}
        loadingLabel={copy.deleteDialog.deletingLabel}
        isLoading={isDeleting}
        onConfirm={handleConfirmDelete}
        confirmVariant="danger"
      />
    </>
  );
}