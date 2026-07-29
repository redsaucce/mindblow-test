"use client";

import { useState } from "react";
import {
  useReactTable,
  getCoreRowModel,
  flexRender,
  type ColumnDef,
} from "@tanstack/react-table";
import type { LucideIcon } from "lucide-react";
import EmptyState from "@/components/ui/empty-state";
import { useAutoScrollHeight } from "@/hooks/use-auto-scroll-height";

function interpolate(template: string, values: Record<string, number>) {
  return template.replace(/\{(\w+)\}/g, (_, key: string) => String(values[key] ?? ""));
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
  onRowClick?: (row: T) => void;
  emptyIcon: LucideIcon;
  emptyTitle: string;
  emptySubtitle?: string;
  emptyAction?: DataTableEmptyAction;
  /** e.g. "Showing {shown} of {total} entries" */
  summaryTemplate: string;
  /** Reset scroll position/recompute height whenever this changes — e.g. a filter/tab value. */
  resetKey?: unknown;
  /**
   * Whether `data` is still loading. Also triggers a height recompute when
   * it flips to false — mirroring quiz-list.tsx's `recomputeKey: loadState`
   * — since the loading placeholder and the real table rows can sit at
   * different heights, so the maxHeight measured during loading can't be
   * trusted once real rows replace it.
   */
  isLoading?: boolean;
}

/**
 * Renders the full `data` array as-is — no pagination.
 *
 * `useAutoScrollHeight`'s ref/maxHeight are applied to the OUTERMOST card
 * div — the one wrapping thead + tbody-scroll-region + footer together —
 * so maxHeight represents the total height budget for all three. thead
 * and the footer are always rendered at their real, uncapped height (both
 * measured directly via their own refs); ONLY tbody gets overflow-y-auto,
 * capped to whatever's left of the budget after subtracting thead and
 * footer's real heights. That guarantees thead and footer are always
 * fully visible with no vertical overflow, and tbody is the one and only
 * element that scrolls when rows don't fit.
 */
export default function DataTable<T>({
  data,
  columns,
  columnWidths,
  onRowClick,
  emptyIcon,
  emptyTitle,
  emptySubtitle,
  emptyAction,
  summaryTemplate,
  resetKey,
  isLoading = false,
}: DataTableProps<T>) {
  const [theadHeight, setTheadHeight] = useState(0);
  const [footerHeight, setFooterHeight] = useState(0);

  // containerRef/maxHeight are attached to the OUTER card (below), so
  // maxHeight is the total budget for thead + tbody + footer combined —
  // not just the table.
  const { containerRef, maxHeight } = useAutoScrollHeight({
    // Both measured heights start at 0 and flip to their real values
    // after the first render — folded into recomputeKey (alongside
    // resetKey and isLoading) so the hook re-measures once the true
    // thead/footer heights are known, instead of keeping a result
    // computed against the initial 0 guesses.
    recomputeKey: `${String(resetKey)}:${isLoading}:${theadHeight}:${footerHeight}`,
  });

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
  });

  const dataRows = table.getRowModel().rows;

  // tbody's own scroll cap: total budget minus thead and footer's real
  // heights. Only this region scrolls; thead and footer render at their
  // natural height, always fully visible.
  const tbodyMaxHeight =
    maxHeight === null ? undefined : Math.max(0, maxHeight - theadHeight - footerHeight);

  return (
    <div
      ref={containerRef}
      className="border border-slate-200 shadow-sm rounded-2xl bg-white overflow-hidden flex flex-col"
    >
      <table className="table-fixed w-full">
        <colgroup>
          {columnWidths.map((width, i) => (
            <col key={i} style={{ width: `${width}px` }} />
          ))}
        </colgroup>
        <thead
          ref={(el) => {
            if (el) {
              const h = el.offsetHeight;
              setTheadHeight((prev) => (prev === h ? prev : h));
            }
          }}
        >
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
      </table>

      <div
        className="no-scrollbar overflow-y-auto overflow-x-auto"
        style={{ maxHeight: tbodyMaxHeight }}
      >
        <table className="table-fixed w-full">
          <colgroup>
            {columnWidths.map((width, i) => (
              <col key={i} style={{ width: `${width}px` }} />
            ))}
          </colgroup>
          <tbody>
            {isLoading || dataRows.length === 0 ? (
              <tr style={{ height: tbodyMaxHeight }}>
                <td colSpan={columns.length} className="h-full">
                  <EmptyState
                    icon={emptyIcon}
                    title={emptyTitle}
                    subtitle={emptySubtitle}
                    action={emptyAction}
                  />
                </td>
              </tr>
            ) : (
              dataRows.map((row) => (
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
              ))
            )}
          </tbody>
        </table>
      </div>

      <div
        ref={(el) => {
          if (el) {
            const h = el.offsetHeight;
            setFooterHeight((prev) => (prev === h ? prev : h));
          }
        }}
        className="flex items-center justify-between px-4 py-3 border-t border-slate-200"
      >
        <span className="text-sm text-slate-500">
          {interpolate(summaryTemplate, {
            shown: dataRows.length,
            total: dataRows.length,
          })}
        </span>
      </div>
    </div>
  );
}