import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

export type DataTableColumn<T> = {
  id: string;
  header: string;
  cell: (row: T) => ReactNode;
  className?: string;
};

export function DataTable<T>({
  columns,
  rows,
  getRowKey,
  minWidthClassName = "min-w-[760px]",
}: {
  columns: DataTableColumn<T>[];
  rows: T[];
  getRowKey: (row: T) => string;
  minWidthClassName?: string;
}) {
  return (
    <div className="overflow-hidden rounded-2xl border border-border bg-card">
      <div className="overflow-x-auto">
        <table className={cn("w-full text-sm", minWidthClassName)}>
          <thead>
            <tr className="border-b bg-secondary/40 text-left text-[11px] tracking-wide text-muted-foreground uppercase">
              {columns.map((column) => (
                <th
                  key={column.id}
                  scope="col"
                  className={cn("px-4 py-3 font-medium", column.className)}
                >
                  {column.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y">
            {rows.map((row) => (
              <tr key={getRowKey(row)} className="align-middle">
                {columns.map((column) => (
                  <td
                    key={column.id}
                    className={cn("px-4 py-3", column.className)}
                  >
                    {column.cell(row)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
