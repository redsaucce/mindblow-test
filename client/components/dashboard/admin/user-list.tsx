"use client";

import { useMemo, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Users } from "lucide-react";
import DataTable from "@/components/ui/data-table";
import AlertModal from "@/components/ui/alert-modal";
import { emptyStates } from "@/data/ui/empty-states";
import { userListContent as copy } from "@/data/dashboard/admin/user-list";
import type { ColumnDef } from "@tanstack/react-table";
import {
  type AdminUser,
  listUsers,
  deleteUser as deleteUserRequest,
} from "@/services/dashboard/admin-users-service";

export default function UserList() {
  const queryClient = useQueryClient();
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);
  const [feedback, setFeedback] = useState("");

  const {
    data,
    isLoading,
    isError,
  } = useQuery({
    queryKey: ["admin-users"],
    queryFn: listUsers,
  });

  const users = data ?? [];

  const showFeedback = (message: string) => {
    setFeedback(message);
    setTimeout(() => setFeedback(""), 3000);
  };

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteUserRequest(id),
    onSuccess: () => {
      // Re-fetches the users list so the table reflects the deletion —
      // more reliable than manually filtering the cached array, and
      // keeps generatedQuizzes/other derived fields in sync too.
      queryClient.invalidateQueries({ queryKey: ["admin-users"] });
      setDeleteTarget(null);
      showFeedback(copy.feedback.deleted);
    },
    onError: () => {
      setDeleteTarget(null);
      showFeedback(copy.feedback.error);
    },
  });

  const handleConfirmDelete = () => {
    if (!deleteTarget) return;
    deleteMutation.mutate(deleteTarget);
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
        data={users}
        columns={columns}
        columnWidths={[340, 120, 180, 180, 100]}
        isLoading={isLoading}
        emptyIcon={Users}
        emptyTitle={
          isError
            ? "Something went wrong"
            : isLoading
              ? "Loading users..."
              : emptyStates.userList.title
        }
        summaryTemplate={copy.summaryTemplate}
      />

      {feedback && <p className="mt-3 text-xs text-slate-500">{feedback}</p>}

      <AlertModal
        open={!!deleteTarget}
        onClose={() => {
          if (!deleteMutation.isPending) setDeleteTarget(null);
        }}
        title={copy.deleteDialog.title}
        description={copy.deleteDialog.description}
        cancelLabel={copy.deleteDialog.cancelLabel}
        confirmLabel={copy.deleteDialog.confirmLabel}
        loadingLabel={copy.deleteDialog.deletingLabel}
        isLoading={deleteMutation.isPending}
        onConfirm={handleConfirmDelete}
        confirmVariant="danger"
      />
    </>
  );
}