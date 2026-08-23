import type { ReactNode } from "react";
import { ChevronRight, ChevronLeft } from "lucide-react";
import { TableSkeleton } from "./LoadingSpinner";
import { EmptyState } from "./EmptyState";

export interface Column<T> {
  header: string;
  render: (row: T) => ReactNode;
  className?: string;
}

interface DataTableProps<T> {
  columns: Column<T>[];
  rows: T[];
  loading?: boolean;
  keyExtractor: (row: T) => string | number;
  emptyTitle?: string;
  emptySubtitle?: string;
  toolbar?: ReactNode;
  page?: number;
  limit?: number;
  total?: number;
  onPageChange?: (page: number) => void;
}

export function DataTable<T>({
  columns,
  rows,
  loading,
  keyExtractor,
  emptyTitle = "لا توجد بيانات",
  emptySubtitle,
  toolbar,
  page,
  limit,
  total,
  onPageChange,
}: DataTableProps<T>) {
  const showPagination = page !== undefined && limit !== undefined && total !== undefined && onPageChange;
  const totalPages = showPagination ? Math.max(1, Math.ceil(total / limit)) : 1;

  return (
    <div className="card">
      {toolbar && <div className="table-toolbar">{toolbar}</div>}

      {loading ? (
        <TableSkeleton cols={columns.length} />
      ) : rows.length === 0 ? (
        <EmptyState title={emptyTitle} subtitle={emptySubtitle} />
      ) : (
        <div className="table-wrap">
          <table className="data-table">
            <thead>
              <tr>
                {columns.map((col) => (
                  <th key={col.header}>{col.header}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={keyExtractor(row)}>
                  {columns.map((col) => (
                    <td key={col.header} className={col.className}>
                      {col.render(row)}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {showPagination && total! > 0 && (
        <div className="pagination">
          <span className="text-secondary">
            إجمالي {total} — صفحة {page} من {totalPages}
          </span>
          <div className="flex-row">
            <button
              className="btn btn-secondary btn-sm"
              disabled={page! <= 1}
              onClick={() => onPageChange!(page! - 1)}
            >
              <ChevronRight size={14} strokeWidth={1.75} />
              السابق
            </button>
            <button
              className="btn btn-secondary btn-sm"
              disabled={page! >= totalPages}
              onClick={() => onPageChange!(page! + 1)}
            >
              التالي
              <ChevronLeft size={14} strokeWidth={1.75} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
