"use client";

import { ReactNode, useMemo, useState } from "react";
import Link from "next/link";
import { Plus, Eye, Pencil, Trash2, Power, RefreshCw } from "lucide-react";
import { useIsFetching, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { PageHeader } from "./PageHeader";
import { SearchInput } from "./SearchInput";
import { FilterBar } from "./FilterBar";
import { DataTable, type DataTableColumn } from "./DataTable";
import { ConfirmDialog } from "./ConfirmDialog";
import { FormModal } from "./FormModal";
import { ViewModal, InfoRow } from "./ViewModal";
import { StatusBadge } from "./StatusBadge";
import { useDebounce } from "@/hooks/useDebounce";

export interface CrudRecord {
  id: string | number;
  isActive?: boolean;
}

interface Props<T extends CrudRecord> {
  title: string;
  description?: string;
  columns: DataTableColumn<T>[];
  rows: T[];
  searchKeys?: (keyof T)[];
  filters?: ReactNode;
  formTitle?: string;
  formContent?: (record: T | null, close: () => void) => ReactNode;
  viewContent?: (record: T) => ReactNode;
  onDelete?: (record: T) => Promise<void> | void;
  onToggleStatus?: (record: T) => Promise<void> | void;
  showStatus?: boolean;
  customActions?: (row: T) => ReactNode;
  /** Extra buttons rendered in the page header, between Refresh and Add New (e.g. Excel import/export). */
  headerActions?: ReactNode;
  /** If set, the "Add New" button navigates to this route instead of opening the modal. */
  addHref?: string;
  /** Override the default refresh behavior (which invalidates all active queries). */
  onRefresh?: () => void | Promise<void>;
  refreshing?: boolean;
  /** Set to false to hide the auto-prepended S.No column. */
  showSerial?: boolean;
  /** Set to false to hide the Refresh button. */
  showRefresh?: boolean;
}

export function CrudManagementPage<T extends CrudRecord>({
  title,
  description,
  columns,
  rows,
  searchKeys = [],
  filters,
  formTitle,
  formContent,
  viewContent,
  onDelete,
  onToggleStatus,
  showStatus = true,
  customActions,
  headerActions,
  addHref,
  onRefresh,
  refreshing,
  showSerial = true,
  showRefresh = true,
}: Props<T>) {
  const qc = useQueryClient();
  const activeFetchCount = useIsFetching();
  const isAutoRefreshing = activeFetchCount > 0;
  const isRefreshing = refreshing ?? isAutoRefreshing;
  const handleRefresh = async () => {
    if (onRefresh) await onRefresh();
    else await qc.invalidateQueries();
  };
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebounce(search);

  const [formOpen, setFormOpen] = useState(false);
  const [viewOpen, setViewOpen] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [confirmStatus, setConfirmStatus] = useState(false);
  const [active, setActive] = useState<T | null>(null);

  const filtered = useMemo(() => {
    const q = debouncedSearch.trim().toLowerCase();
    if (!q || searchKeys.length === 0) return rows;
    return rows.filter((row) =>
      searchKeys.some((k) => {
        const v = row[k];
        return v !== undefined && v !== null && String(v).toLowerCase().includes(q);
      })
    );
  }, [rows, debouncedSearch, searchKeys]);

  const finalColumns: DataTableColumn<T>[] = useMemo(() => {
    const c = [...columns];
    if (showSerial) {
      c.unshift({
        key: "_sno",
        header: "S.No",
        className: "w-14",
        render: (_row, idx) => (
          <span className="text-muted-foreground">{idx + 1}</span>
        ),
      });
    }
    if (showStatus) {
      c.push({
        key: "_status",
        header: "Status",
        render: (row) => <StatusBadge status={row.isActive ?? true} />,
      });
    }
    return c;
  }, [columns, showStatus, showSerial]);

  const handleDelete = async () => {
    if (!active || !onDelete) return;
    try {
      await onDelete(active);
      toast.success("Deleted successfully");
    } catch {
      toast.error("Failed to delete");
    } finally {
      setConfirmDelete(false);
      setActive(null);
    }
  };

  const handleToggle = async () => {
    if (!active || !onToggleStatus) return;
    try {
      await onToggleStatus(active);
      toast.success("Status updated");
    } catch {
      toast.error("Failed to update status");
    } finally {
      setConfirmStatus(false);
      setActive(null);
    }
  };

  return (
    <>
      <PageHeader
        title={title}
        description={description}
        actions={
          <div className="flex gap-2">
            {showRefresh && (
              <Button
                variant="outline"
                className="gap-2"
                onClick={handleRefresh}
                disabled={isRefreshing}
              >
                <RefreshCw
                  className={`h-4 w-4 ${isRefreshing ? "animate-spin" : ""}`}
                />
                Refresh
              </Button>
            )}
            {headerActions}
            {addHref ? (
              <Button asChild className="gap-2">
                <Link href={addHref}>
                  <Plus className="h-4 w-4" /> Add New
                </Link>
              </Button>
            ) : (
              formContent && (
                <Button
                  className="gap-2"
                  onClick={() => {
                    setActive(null);
                    setFormOpen(true);
                  }}
                >
                  <Plus className="h-4 w-4" /> Add New
                </Button>
              )
            )}
          </div>
        }
      />

      <DataTable
        columns={finalColumns}
        data={filtered}
        rowKey={(r) => r.id as string | number}
        toolbar={
          <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
            <SearchInput value={search} onChange={setSearch} />
            {filters && <FilterBar>{filters}</FilterBar>}
          </div>
        }
        rowActions={(row) => (
          <div className="flex items-center justify-end gap-1">
            {customActions?.(row)}
            {viewContent && (
              <Button
                size="icon"
                variant="ghost"
                className="h-8 w-8"
                onClick={() => {
                  setActive(row);
                  setViewOpen(true);
                }}
                aria-label="View"
              >
                <Eye className="h-4 w-4" />
              </Button>
            )}
            {formContent && (
              <Button
                size="icon"
                variant="ghost"
                className="h-8 w-8"
                onClick={() => {
                  setActive(row);
                  setFormOpen(true);
                }}
                aria-label="Edit"
              >
                <Pencil className="h-4 w-4" />
              </Button>
            )}
            {onToggleStatus && (
              <Button
                size="icon"
                variant="ghost"
                className="h-8 w-8"
                onClick={() => {
                  setActive(row);
                  setConfirmStatus(true);
                }}
                aria-label="Toggle status"
              >
                <Power className="h-4 w-4" />
              </Button>
            )}
            {onDelete && (
              <Button
                size="icon"
                variant="ghost"
                className="h-8 w-8 text-destructive"
                onClick={() => {
                  setActive(row);
                  setConfirmDelete(true);
                }}
                aria-label="Delete"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            )}
          </div>
        )}
      />

      {formContent && (
        <FormModal
          open={formOpen}
          onOpenChange={setFormOpen}
          title={`${active ? "Edit" : "Add"} ${formTitle ?? title}`}
          size="lg"
        >
          {formContent(active, () => setFormOpen(false))}
        </FormModal>
      )}

      {viewContent && active && (
        <ViewModal open={viewOpen} onOpenChange={setViewOpen} title={`${title} Details`}>
          {viewContent(active)}
        </ViewModal>
      )}

      <ConfirmDialog
        open={confirmDelete}
        onOpenChange={setConfirmDelete}
        title="Delete record?"
        description="This will permanently delete the record. This action cannot be undone."
        confirmText="Delete"
        destructive
        onConfirm={handleDelete}
      />

      <ConfirmDialog
        open={confirmStatus}
        onOpenChange={setConfirmStatus}
        title={active?.isActive ? "Deactivate?" : "Activate?"}
        description="Are you sure you want to change the status?"
        confirmText="Yes, continue"
        onConfirm={handleToggle}
      />
    </>
  );
}

export { InfoRow };
