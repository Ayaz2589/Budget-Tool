import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatCurrency } from "@/lib/format";
import type { AmortizationRow } from "@/lib/domain/mortgageMath";

interface MortgageScheduleTableProps {
  rows: AmortizationRow[];
}

export function MortgageScheduleTable({ rows }: MortgageScheduleTableProps) {
  return (
    <section className="space-y-3 rounded-xl border p-4">
      <h2 className="text-base font-semibold">Schedule</h2>
      <Table density="compact">
        <TableHeader>
          <TableRow>
            <TableHead>Month</TableHead>
            <TableHead>Date</TableHead>
            <TableHead>Payment</TableHead>
            <TableHead>Principal</TableHead>
            <TableHead>Interest</TableHead>
            <TableHead>Balance</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.slice(0, 24).map((row) => (
            <TableRow key={`${row.date}-${row.monthIndex}`}>
              <TableCell>{row.monthIndex}</TableCell>
              <TableCell>{row.date}</TableCell>
              <TableCell>{formatCurrency(row.payment)}</TableCell>
              <TableCell>{formatCurrency(row.principal)}</TableCell>
              <TableCell>{formatCurrency(row.interest)}</TableCell>
              <TableCell>{formatCurrency(row.balance)}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </section>
  );
}
