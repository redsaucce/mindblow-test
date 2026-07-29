"use client";

import { useEffect, useMemo, useState } from "react";
import { ScrollText, ListFilter, ChevronDown } from "lucide-react";
import type { ColumnDef } from "@tanstack/react-table";
import DataTable from "@/components/ui/data-table";
import { emptyStates } from "@/data/ui/empty-states";
import { activityLogsContent as copy, activityTabs } from "@/data/dashboard/admin/activity-logs";
import { useToggle } from "@/hooks/use-toggle";
import { useSetTopbarActions } from "@/hooks/use-topbar-actions";
import { type ActivityLogEntry, listLogs } from "@/services/dashboard/admin-logs-service";

type LoadState = "loading" | "ready" | "error";

function toRelativeTime(isoDatetime: string): string {
  const then = new Date(isoDatetime).getTime();
  const now = Date.now();
  const diffMs = now - then;
  const diffMinutes = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMinutes / 60);
  const diffDays = Math.floor(diffHours / 24);
  const diffWeeks = Math.floor(diffDays / 7);
  const diffMonths = Math.floor(diffDays / 30);

  if (diffMinutes < 1) return "Just now";
  if (diffMinutes < 60) return `${diffMinutes} min${diffMinutes === 1 ? "" : "s"} ago`;
  if (diffHours < 24) return `${diffHours} hour${diffHours === 1 ? "" : "s"} ago`;
  if (diffDays < 7) return `${diffDays} day${diffDays === 1 ? "" : "s"} ago`;
  if (diffWeeks < 5) return `${diffWeeks} week${diffWeeks === 1 ? "" : "s"} ago`;
  return `${diffMonths} month${diffMonths === 1 ? "" : "s"} ago`;
}

export default function ActivityLog() {
  const [activeTab, setActiveTab] = useState("all");
  const [loadState, setLoadState] = useState<LoadState>("loading");
  const [logs, setLogs] = useState<ActivityLogEntry[]>([]);
  const [total, setTotal] = useState(0);
  const [pageCount, setPageCount] = useState(1);
  const [pageIndex, setPageIndex] = useState(0);
  // Rows-per-page is driven by how many actually fit the viewport
  // (reported by DataTable's onPageSizeChange), not a fixed server
  // default — otherwise an overfull page pushes the footer off-screen
  // and the whole page scrolls instead of paginating.
  const [pageSize, setPageSize] = useState(9);
  const {
    value: filterOpen,
    toggle: toggleFilter,
    close: closeFilter,
  } = useToggle(false);

  useEffect(() => {
    let cancelled = false;
    setLoadState("loading");
    listLogs(activeTab, pageIndex + 1, pageSize)
      .then((result) => {
        if (cancelled) return;
        setLogs(result.logs);
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
  }, [activeTab, pageIndex, pageSize]);

  const handlePageSizeChange = (nextPageSize: number) => {
    setPageSize((prev) => (prev === nextPageSize ? prev : nextPageSize));
    setPageIndex(0);
  };

  const handleTabChange = (tab: string) => {
    setActiveTab(tab);
    setPageIndex(0);
    closeFilter();
  };

  const columns = useMemo<ColumnDef<ActivityLogEntry>[]>(
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
        accessorKey: "description",
        header: copy.columns.activity,
        cell: ({ row }) => (
          <span className="text-sm">
            <span className="text-slate-600">{row.original.description}</span>
            <span className="text-slate-400"> · {toRelativeTime(row.original.timestamp)}</span>
          </span>
        ),
      },
    ],
    []
  );

  const currentTabLabel =
    activityTabs.find((tab) => tab.value === activeTab)?.label ?? activityTabs[0].label;

  useSetTopbarActions(
    <div className="relative">
      <button
        type="button"
        onClick={toggleFilter}
        className="inline-flex items-center gap-2 rounded-full border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50 transition-colors"
      >
        <ListFilter className="w-4 h-4" />
        {currentTabLabel}
        <ChevronDown
          className={`w-4 h-4 transition-transform duration-200 ${
            filterOpen ? "rotate-180" : ""
          }`}
        />
      </button>

      {filterOpen && (
        <div className="absolute right-0 top-full mt-2 w-48 rounded-2xl border border-slate-100 bg-white shadow-xl overflow-hidden z-10">
          {activityTabs.map((tab) => (
            <button
              key={tab.value}
              type="button"
              onClick={() => handleTabChange(tab.value)}
              className={`flex items-center w-full px-4 py-2.5 text-sm transition-colors ${
                activeTab === tab.value
                  ? "text-green-700 bg-emerald-50 font-medium"
                  : "text-slate-600 hover:bg-slate-50"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );

  return (
    <DataTable
      data={logs}
      columns={columns}
      columnWidths={[300, 600]}
      emptyIcon={ScrollText}
      emptyTitle={
        loadState === "error"
          ? "Something went wrong"
          : loadState === "loading"
            ? "Loading activity..."
            : emptyStates.activityLogs.title
      }
      summaryTemplate={copy.summaryTemplate}
      resetKey={activeTab}
      manualPagination
      pageCount={pageCount}
      totalCount={total}
      onPageChange={setPageIndex}
      onPageSizeChange={handlePageSizeChange}
    />
  );
}