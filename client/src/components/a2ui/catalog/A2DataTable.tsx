import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";

interface Column {
  key: string;
  label: string;
  align?: 'left' | 'center' | 'right';
}

interface A2DataTableProps {
  title?: string;
  columns: Column[];
  rows: Record<string, any>[];
}

export default function A2DataTable({ title, columns, rows }: A2DataTableProps) {
  return (
    <Card className="w-full">
      {title && (
        <CardHeader>
          <CardTitle className="text-lg">{title}</CardTitle>
        </CardHeader>
      )}
      <CardContent className="p-0">
        <Table>
          <TableHeader>
            <TableRow>
              {columns.map((col) => (
                <TableHead 
                  key={col.key} 
                  className={col.align === 'right' ? 'text-right' : col.align === 'center' ? 'text-center' : ''}
                >
                  {col.label}
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((row, idx) => (
              <TableRow key={idx} data-testid={`a2table-row-${idx}`}>
                {columns.map((col) => (
                  <TableCell 
                    key={col.key}
                    className={col.align === 'right' ? 'text-right' : col.align === 'center' ? 'text-center' : ''}
                  >
                    {row[col.key]}
                  </TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
