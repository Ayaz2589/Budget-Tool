import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Trash2 } from "lucide-react";
import { CategoryOption } from "@/lib/categoryColors";
import { formatCurrency } from "@/lib/format";
import type { MortgagePaymentsTableProps } from "@/types/mortgage";

export type { MortgagePaymentsTableProps };

export function MortgagePaymentsTable({
  payments,
  onRemove,
}: MortgagePaymentsTableProps) {
  if (payments.length === 0) {
    return (
      <p className="text-muted-foreground text-sm">
        No mortgage payments recorded yet. Add one above.
      </p>
    );
  }
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Date</TableHead>
          <TableHead>Category</TableHead>
          <TableHead className="text-right">Amount</TableHead>
          <TableHead className="w-[80px]" />
        </TableRow>
      </TableHeader>
      <TableBody>
        {payments.map((e) => (
          <TableRow key={e.id}>
            <TableCell>{e.date}</TableCell>
            <TableCell>
              <CategoryOption name={e.category ?? ""} type="expense" />
            </TableCell>
            <TableCell className="text-right">
              {formatCurrency(e.amount)}
            </TableCell>
            <TableCell>
              <Button
                variant="ghost"
                size="icon"
                className="text-destructive hover:text-destructive"
                onClick={() => onRemove(e)}
                aria-label="Remove payment"
              >
                <Trash2 className="size-4 text-destructive" />
              </Button>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
