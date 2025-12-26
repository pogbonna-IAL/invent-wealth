import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";

interface Column<T> {
  key: keyof T | string;
  header: string;
  render?: (value: any, row: T) => React.ReactNode;
  className?: string;
}

interface DataTableProps<T> {
  data: T[];
  columns: Column<T>[];
  className?: string;
  emptyMessage?: string;
  onRowClick?: (row: T) => void;
}

export function DataTable<T extends Record<string, any>>({
  data,
  columns,
  className,
  emptyMessage = "No data available",
  onRowClick,
}: DataTableProps<T>) {
  if (data.length === 0) {
    return (
      <div className="py-8 text-center text-muted-foreground">
        {emptyMessage}
      </div>
    );
  }

  return (
    <div className={cn("rounded-md border", className)}>
      <Table>
        <TableHeader>
          <TableRow>
            {columns.map((column) => (
              <TableHead
                key={String(column.key)}
                className={column.className}
              >
                {column.header}
              </TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.map((row, rowIndex) => (
            <TableRow
              key={rowIndex}
              onClick={() => onRowClick?.(row)}
              className={cn(
                onRowClick && "cursor-pointer hover:bg-muted/50",
                "focus-within:bg-muted/50"
              )}
              tabIndex={onRowClick ? 0 : undefined}
              onKeyDown={(e) => {
                if (onRowClick && (e.key === "Enter" || e.key === " ")) {
                  e.preventDefault();
                  onRowClick(row);
                }
              }}
            >
              {columns.map((column) => {
                const value =
                  typeof column.key === "string"
                    ? row[column.key]
                    : row[column.key as keyof T];
                return (
                  <TableCell
                    key={String(column.key)}
                    className={column.className}
                  >
                    {column.render ? column.render(value, row) : value}
                  </TableCell>
                );
              })}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

