"use client";

import { useState } from "react";
import {
  useReactTable,
  getCoreRowModel,
  getPaginationRowModel,
  getFilteredRowModel,
  flexRender,
  type ColumnDef,
  type Table as ReactTableInstance,
} from "@tanstack/react-table";
import { ChevronLeft, ChevronRight, type LucideIcon } from "lucide-react";
import EmptyState from "@/components/ui/empty-state";
import { useAutoPageSize } from "@/hooks/use-auto-page-size";

function interpolate(template: string, values: Record<string, number>) {
  return template.replace(/\{(\w+)\}/g, (_, key: string) => String(values[key] ?? ""));
}

function PaginationControls<T>({
  table,
  goToPage,
  pageIndexOverride,
  pageCountOverride,
}: {
  table: ReactTableInstance<T>;
  goToPage: (index: number) => void;
  pageIndexOverride?: number;
  pageCountOverride?: number;
}) {
  const pageIndex = pageIndexOverride ?? table.getState().pagination.pageIndex;
  const pageCount = pageCountOverride ?? table.getPageCount();
  const canPrevious = pageIndexOverride !== undefined ? pageIndex > 0 : table.getCanPreviousPage();
  const canNext =
    pageIndexOverride !== undefined ? pageIndex < pageCount - 1 : table.getCanNextPage();

  const getVisiblePages = () => {
    if (pageCount <= 3) return Array.from({ length: pageCount }, (_, i) => i);
    if (pageIndex === 0) return [0, 1, 2];
    if (pageIndex === pageCount - 1) return [pageCount - 3, pageCount - 2, pageCount - 1];
    return [pageIndex - 1, pageIndex, pageIndex + 1];
  };

  const visiblePages = getVisiblePages();

  return (
    <div className="flex items-center gap-1">
      <button
        type="button"
        onClick={() => goToPage(pageIndex - 1)}
        disabled={!canPrevious}
        className="w-9 h-9 rounded-full flex items-center justify-center border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:hover:bg-transparent transition-colors"
      >
        <ChevronLeft className="w-4 h-4" />
      </button>
      {visiblePages.map((page) => (
        <button
          key={page}
          type="button"
          onClick={() => goToPage(page)}
          className={`w-9 h-9 rounded-full text-sm border transition-colors ${
            page === pageIndex
              ? "bg-emerald-600 text-white border-emerald-600"
              : "border-slate-200 text-slate-600 hover:bg-slate-50"
          }`}
        >
          {page + 1}
        </button>
      ))}
      <button
        type="button"
        onClick={() => goToPage(pageIndex + 1)}
        disabled={!canNext}
        className="w-9 h-9 rounded-full flex items-center justify-center border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:hover:bg-transparent transition-colors"
      >
        <ChevronRight className="w-4 h-4" />
      </button>
    </div>
  );
}

interface DataTableEmptyAction {
  label: string;
  onClick: () => void;
}

interface DataTableProps<T> {
  data: T[];
  columns: ColumnDef<T>[];
  /** Pixel width per column, same order as `columns`. */
  columnWidths: number[];
  rowHeight?: number;
  onRowClick?: (row: T) => void;
  emptyIcon: LucideIcon;
  emptyTitle: string;
  emptySubtitle?: string;
  emptyAction?: DataTableEmptyAction;
  /** e.g. "Showing {shown} of {total} entries" */
  summaryTemplate: string;
  /** Reset to page 0 whenever this changes — e.g. a filter/tab value. */
  resetKey?: unknown;
  /**
   * When true, `data` is treated as already representing just the current
   * page's rows (fetched from a server), not the full dataset. DataTable
   * stops doing its own client-side pagination math and instead calls
   * `onPageChange` when the user navigates, letting the caller fetch the
   * new page. Requires `pageCount` and `totalCount` to also be provided.
   * Defaults to false — existing callers are unaffected.
   */
  manualPagination?: boolean;
  /** Total number of pages available server-side. Required when `manualPagination` is true. */
  pageCount?: number;
  /** Total row count across all pages server-side, used for the summary text. Required when `manualPagination` is true. */
  totalCount?: number;
  /** Called with the new 0-indexed page when the user navigates. Required when `manualPagination` is true. */
  onPageChange?: (pageIndex: number) => void;
  /**
   * Called whenever the fit-to-viewport row count changes (mount, resize,
   * or data load). Only relevant when `manualPagination` is true — since
   * the caller owns the fetch, it needs to know how many rows actually
   * fit so it can request that many per page instead of whatever the
   * server defaults to (which can overflow the viewport into page scroll).
   */
  onPageSizeChange?: (pageSize: number) => void;
}

export default function DataTable<T>({
  data,
  columns,
  columnWidths,
  rowHeight = 56,
  onRowClick,
  emptyIcon,
  emptyTitle,
  emptySubtitle,
  emptyAction,
  summaryTemplate,
  resetKey,
  manualPagination = false,
  pageCount,
  totalCount,
  onPageChange,
  onPageSizeChange,
}: DataTableProps<T>) {
  const auto = useAutoPageSize({
    rowHeight,
    resetKey,
    onFitChange: onPageSizeChange,
  });
  const [manualPageIndex, setManualPageIndex] = useState(0);

  // True until the hook's one-time skeleton measurement completes. While
  // true, we render a single fixed-height placeholder row (not the real
  // empty/loading state) purely so useAutoPageSize has something stable
  // and data-independent to measure tableTop/footerHeight against.
  const isMeasuring = auto.pagination.pageSize === null;
  const fittedPageSize = auto.pagination.pageSize ?? 1;

  const pagination = manualPagination
    ? { pageIndex: manualPageIndex, pageSize: data.length || 1 }
    : { pageIndex: auto.pagination.pageIndex, pageSize: fittedPageSize };

  const table = useReactTable({
    data,
    columns,
    state: { pagination },
    onPaginationChange: manualPagination
      ? undefined
      : (updater) => {
          const next =
            typeof updater === "function"
              ? updater({ pageIndex: auto.pagination.pageIndex, pageSize: fittedPageSize })
              : updater;
          auto.setPagination((prev) => ({ ...prev, pageIndex: next.pageIndex }));
        },
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    manualPagination,
    pageCount: manualPagination ? pageCount : undefined,
  });

  const goToPage = (index: number) => {
    if (manualPagination) {
      const clamped = Math.max(0, Math.min(index, (pageCount ?? 1) - 1));
      setManualPageIndex(clamped);
      onPageChange?.(clamped);
    } else {
      auto.goToPage(index);
    }
  };

  const dataRows = table.getRowModel().rows;
  const rowsPerPageForSpacer = manualPagination ? data.length : fittedPageSize;
  const spacerCount = Math.max(0, rowsPerPageForSpacer - dataRows.length);
  const isFading = manualPagination ? false : auto.isFading;
  // Refs are always attached (even in manual mode) so useAutoPageSize can
  // measure real on-screen space and report the fitted row count via
  // onFitChange/onPageSizeChange — manual-pagination callers need that
  // number to request the right amount of rows from the server.
  const tableRef = auto.tableRef;
  const footerRef = auto.footerRef;

  const summaryTotal = manualPagination
    ? (totalCount ?? 0)
    : table.getFilteredRowModel().rows.length;

  return (
    <div className="border border-slate-200 shadow-sm rounded-2xl bg-white overflow-hidden">
      <div className="overflow-x-auto">
        <table ref={tableRef} className="table-fixed w-full">
          <colgroup>
            {columnWidths.map((width, i) => (
              <col key={i} style={{ width: `${width}px` }} />
            ))}
          </colgroup>
          <thead>
            <tr className="h-12 bg-slate-50">
              {table.getHeaderGroups().map((hg) =>
                hg.headers.map((header) => (
                  <th
                    key={header.id}
                    className="text-xs font-medium text-slate-500 uppercase tracking-wide px-4 text-left"
                  >
                    {flexRender(header.column.columnDef.header, header.getContext())}
                  </th>
                ))
              )}
            </tr>
          </thead>

          <tbody
            style={{
              opacity: isFading ? 0 : 1,
              transition: "opacity 120ms ease",
            }}
          >
            {isMeasuring ? (
              // Fixed one-row skeleton, rendered before any data or fetch
              // exists. Its only job is to give useAutoPageSize a real,
              // stable row to measure tableTop/rowHeight against — not
              // the empty state (too short) and not a guessed row count
              // (self-referential). Nothing is fetched until this
              // measurement reports back via onFitChange.
              <tr style={{ height: `${rowHeight}px` }} aria-hidden="true">
                <td colSpan={columns.length} className="p-0" />
              </tr>
            ) : dataRows.length === 0 ? (
              <>
                <tr>
                  <td colSpan={columns.length}>
                    <EmptyState
                      icon={emptyIcon}
                      title={emptyTitle}
                      subtitle={emptySubtitle}
                      action={emptyAction}
                    />
                  </td>
                </tr>
                {Array.from({ length: Math.max(0, rowsPerPageForSpacer - 1) }).map((_, i) => (
                  <tr key={`spacer-empty-${i}`} style={{ height: `${rowHeight}px` }}>
                    <td colSpan={columns.length} className="p-0" />
                  </tr>
                ))}
              </>
            ) : (
              <>
                {dataRows.map((row) => (
                  <tr
                    key={row.id}
                    onClick={onRowClick ? () => onRowClick(row.original) : undefined}
                    className={`h-14 hover:bg-slate-50 transition-colors duration-200 border-t border-slate-100 ${
                      onRowClick ? "cursor-pointer" : ""
                    }`}
                  >
                    {row.getVisibleCells().map((cell) => (
                      <td key={cell.id} className="px-4">
                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                      </td>
                    ))}
                  </tr>
                ))}
                {Array.from({ length: spacerCount }).map((_, i) => (
                  <tr key={`spacer-${i}`} style={{ height: `${rowHeight}px` }}>
                    <td colSpan={columns.length} className="p-0" />
                  </tr>
                ))}
              </>
            )}
          </tbody>
        </table>
      </div>

      <div
        ref={footerRef}
        className="flex items-center justify-between px-4 py-3 border-t border-slate-200"
      >
        <span className="text-sm text-slate-500">
          {interpolate(summaryTemplate, {
            shown: dataRows.length,
            total: summaryTotal,
          })}
        </span>
        <PaginationControls
          table={table}
          goToPage={goToPage}
          pageIndexOverride={manualPagination ? manualPageIndex : undefined}
          pageCountOverride={manualPagination ? pageCount : undefined}
        />
      </div>
    </div>
  );
}