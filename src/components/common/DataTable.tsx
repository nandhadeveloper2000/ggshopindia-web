"use client";

import { ReactNode, useMemo, useState } from "react";
import { Card } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { TableSkeleton } from "./LoadingSkeleton";
import { EmptyState } from "./EmptyState";
import { PaginationBar } from "./PaginationBar";
import { cn } from "@/lib/utils";

export interface DataTableColumn<T> {
  key: string;
  header: string;
  className?: string;
  align?: "left" | "right" | "center";
  /** `index` is the absolute row index across pagination (1-based S.No = index + 1). */
  render?: (row: T, index: number) => ReactNode;
}

interface Props<T> {
  columns: DataTableColumn<T>[];
  data: T[];
  loading?: boolean;
  rowKey?: (row: T, idx: number) => string | number;
  toolbar?: ReactNode;
  empty?: ReactNode;
  // pagination (client-side by default)
  page?: number;
  pageSize?: number;
  total?: number;
  onPageChange?: (page: number) => void;
  onPageSizeChange?: (size: number) => void;
  serverSide?: boolean;
  rowActions?: (row: T) => ReactNode;
  className?: string;
}

export function DataTable<T extends object>({
  columns,
  data,
  loading,
  rowKey,
  toolbar,
  empty,
  page: pageProp,
  pageSize: pageSizeProp,
  total,
  onPageChange,
  onPageSizeChange,
  serverSide,
  rowActions,
  className,
}: Props<T>) {
  const [localPage, setLocalPage] = useState(1);
  const [localPageSize, setLocalPageSize] = useState(10);
  const page = pageProp ?? localPage;
  const pageSize = pageSizeProp ?? localPageSize;

  const paged = useMemo(() => {
    if (serverSide) return data;
    const start = (page - 1) * pageSize;
    return data.slice(start, start + pageSize);
  }, [data, page, pageSize, serverSide]);

  const totalCount = total ?? data.length;

  return (
    <Card className={cn("overflow-hidden", className)}>
      {toolbar && <div className="border-b p-3">{toolbar}</div>}
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              {columns.map((col) => (
                <TableHead
                  key={col.key}
                  className={cn(
                    col.align === "right" && "text-right",
                    col.align === "center" && "text-center",
                    col.className
                  )}
                >
                  {col.header}
                </TableHead>
              ))}
              {rowActions && <TableHead className="text-right w-32">Actions</TableHead>}
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={columns.length + (rowActions ? 1 : 0)}>
                  <TableSkeleton rows={6} cols={columns.length + (rowActions ? 1 : 0)} />
                </TableCell>
              </TableRow>
            ) : paged.length === 0 ? (
              <TableRow>
                <TableCell colSpan={columns.length + (rowActions ? 1 : 0)}>
                  {empty ?? <EmptyState />}
                </TableCell>
              </TableRow>
            ) : (
              paged.map((row, idx) => {
                const absoluteIdx = serverSide ? idx : (page - 1) * pageSize + idx;
                return (
                  <TableRow key={rowKey?.(row, idx) ?? idx}>
                    {columns.map((col) => (
                      <TableCell
                        key={col.key}
                        className={cn(
                          col.align === "right" && "text-right",
                          col.align === "center" && "text-center",
                          col.className
                        )}
                      >
                        {col.render
                          ? col.render(row, absoluteIdx)
                          : ((row as Record<string, unknown>)[col.key] as ReactNode) ?? "—"}
                      </TableCell>
                    ))}
                    {rowActions && <TableCell className="text-right">{rowActions(row)}</TableCell>}
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>
      <PaginationBar
        page={page}
        pageSize={pageSize}
        total={totalCount}
        onPageChange={onPageChange ?? setLocalPage}
        onPageSizeChange={onPageSizeChange ?? setLocalPageSize}
      />
    </Card>
  );
}
