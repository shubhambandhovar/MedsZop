import React, { useState } from "react";
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  flexRender,
} from "@tanstack/react-table";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  ChevronLeft,
  ChevronRight,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Search,
  Download,
  FolderOpen
} from "lucide-react";

export default function DataTable({
  columns,
  data = [],
  loading = false,
  pageCount = 1,
  page = 1,
  onPageChange,
  searchQuery = "",
  onSearchChange,
  searchPlaceholder = "Search records...",
  exportFileName = "export.csv",
  filters,
  actions
}) {
  const [sorting, setSorting] = useState([]);

  const table = useReactTable({
    data,
    columns,
    state: {
      sorting,
    },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    manualPagination: true,
    pageCount,
  });

  // Client-side CSV export helper
  const handleExportCSV = () => {
    if (!data || data.length === 0) return;
    const headers = columns.map(c => typeof c.header === "string" ? c.header : (c.id || c.accessorKey || ""));
    const rows = data.map(row => {
      return columns.map(c => {
        const val = c.accessorKey ? row[c.accessorKey] : "";
        if (typeof val === "object") return `"${JSON.stringify(val).replace(/"/g, '""')}"`;
        return `"${String(val || "").replace(/"/g, '""')}"`;
      }).join(",");
    });

    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", exportFileName);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-4">
      {/* Table Toolbar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="flex flex-1 items-center gap-2 max-w-md">
          {onSearchChange && (
            <div className="relative w-full">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder={searchPlaceholder}
                value={searchQuery}
                onChange={(e) => onSearchChange(e.target.value)}
                className="pl-9 h-9 text-sm"
              />
            </div>
          )}
          {filters}
        </div>

        <div className="flex items-center gap-2">
          {data.length > 0 && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleExportCSV}
              className="h-9 gap-1.5 text-xs font-medium"
            >
              <Download className="h-3.5 w-3.5" />
              Export CSV
            </Button>
          )}
          {actions}
        </div>
      </div>

      {/* Table Container */}
      <div className="rounded-xl border bg-card shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader className="bg-muted/40">
              {table.getHeaderGroups().map((headerGroup) => (
                <TableRow key={headerGroup.id}>
                  {headerGroup.headers.map((header) => (
                    <TableHead
                      key={header.id}
                      className="text-xs font-semibold text-muted-foreground uppercase tracking-wider py-3"
                    >
                      {header.isPlaceholder ? null : (
                        <div
                          className={
                            header.column.getCanSort()
                              ? "flex items-center gap-1.5 cursor-pointer select-none"
                              : ""
                          }
                          onClick={header.column.getToggleSortingHandler()}
                        >
                          {flexRender(
                            header.column.columnDef.header,
                            header.getContext()
                          )}
                          {header.column.getCanSort() && (
                            <span className="text-muted-foreground/60">
                              {header.column.getIsSorted() === "asc" ? (
                                <ArrowUp className="h-3.5 w-3.5 text-primary" />
                              ) : header.column.getIsSorted() === "desc" ? (
                                <ArrowDown className="h-3.5 w-3.5 text-primary" />
                              ) : (
                                <ArrowUpDown className="h-3 w-3 opacity-40 hover:opacity-100" />
                              )}
                            </span>
                          )}
                        </div>
                      )}
                    </TableHead>
                  ))}
                </TableRow>
              ))}
            </TableHeader>

            <TableBody>
              {loading ? (
                // Skeleton loading rows
                Array.from({ length: 5 }).map((_, i) => (
                  <TableRow key={`skeleton-${i}`} className="animate-pulse">
                    {columns.map((_, colIndex) => (
                      <TableCell key={`skeleton-cell-${colIndex}`} className="py-4">
                        <div className="h-4 bg-muted rounded w-3/4" />
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              ) : table.getRowModel().rows?.length ? (
                table.getRowModel().rows.map((row) => (
                  <TableRow
                    key={row.id}
                    data-state={row.getIsSelected() && "selected"}
                    className="hover:bg-muted/30 transition-colors"
                  >
                    {row.getVisibleCells().map((cell) => (
                      <TableCell key={cell.id} className="py-3 text-sm">
                        {flexRender(
                          cell.column.columnDef.cell,
                          cell.getContext()
                        )}
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell
                    colSpan={columns.length}
                    className="h-36 text-center"
                  >
                    <div className="flex flex-col items-center justify-center text-muted-foreground gap-2">
                      <FolderOpen className="h-8 w-8 stroke-[1.5] text-muted-foreground/50" />
                      <p className="text-sm font-medium">No records found</p>
                      <p className="text-xs text-muted-foreground/80">Try adjusting your filters or search query.</p>
                    </div>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>

        {/* Pagination Bar */}
        {pageCount > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t bg-muted/20 text-xs text-muted-foreground">
            <span className="tabular-nums">
              Page <span className="font-semibold text-foreground">{page}</span> of{" "}
              <span className="font-semibold text-foreground">{pageCount}</span>
            </span>

            <div className="flex items-center gap-1.5">
              <Button
                variant="outline"
                size="sm"
                className="h-8 px-2.5 text-xs gap-1"
                disabled={page <= 1 || loading}
                onClick={() => onPageChange && onPageChange(page - 1)}
              >
                <ChevronLeft className="h-3.5 w-3.5" />
                Previous
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="h-8 px-2.5 text-xs gap-1"
                disabled={page >= pageCount || loading}
                onClick={() => onPageChange && onPageChange(page + 1)}
              >
                Next
                <ChevronRight className="h-3.5 w-3.5" />
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

