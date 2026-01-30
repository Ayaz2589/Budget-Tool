import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Pencil, Trash2 } from "lucide-react";
import { CategoryOption } from "@/lib/categoryColors";
import { formatCurrency } from "@/lib/format";
import type { Income, DebtOwner } from "@/lib/types";

function formatRecurring(i: Income): string {
  if (i.recurringAmount == null || i.recurringAmount <= 0) return "—";
  if (i.recurringFrequency === "biweekly" && i.recurringStartDate) {
    return `Biweekly from ${i.recurringStartDate}`;
  }
  if (
    i.recurringFrequency === "monthly" &&
    i.recurringDayOfMonth != null &&
    i.recurringDayOfMonth >= 1 &&
    i.recurringDayOfMonth <= 31
  ) {
    return `Monthly on ${i.recurringDayOfMonth}`;
  }
  return "—";
}

export type IncomeTableProps = {
  sortedIncome: Income[];
  incomeCategories: string[];
  onEdit: (income: Income) => void;
  onDelete: (id: string) => void;
  onUpdateCategory: (id: string, category: string) => void;
  onUpdateOwner: (id: string, owner: DebtOwner) => void;
};

export function IncomeTable({
  sortedIncome,
  incomeCategories,
  onEdit,
  onDelete,
  onUpdateCategory,
  onUpdateOwner,
}: IncomeTableProps) {
  return (
    <div className="overflow-x-auto max-h-[50vh] overflow-y-auto border rounded-md">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Date</TableHead>
            <TableHead>Description</TableHead>
            <TableHead>Amount</TableHead>
            <TableHead>Category</TableHead>
            <TableHead>Owner</TableHead>
            <TableHead className="min-w-[140px]">Recurring</TableHead>
            <TableHead className="w-[120px]">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {sortedIncome.length === 0 ? (
            <TableRow>
              <TableCell
                colSpan={7}
                className="text-center text-muted-foreground py-8"
              >
                No income entries. Add one above.
              </TableCell>
            </TableRow>
          ) : (
            sortedIncome.map((i) => (
              <TableRow key={i.id}>
                <TableCell className="whitespace-nowrap">{i.date}</TableCell>
                <TableCell>{i.description}</TableCell>
                <TableCell>{formatCurrency(i.amount)}</TableCell>
                <TableCell>
                  <Select
                    value={i.category}
                    onValueChange={(v) => onUpdateCategory(i.id, v)}
                  >
                    <SelectTrigger className="w-[220px] min-w-[200px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {incomeCategories.map((c) => (
                        <SelectItem key={c} value={c}>
                          <CategoryOption name={c} type="income" />
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </TableCell>
                <TableCell>
                  <Select
                    value={i.owner ?? "Ayaz"}
                    onValueChange={(v) => onUpdateOwner(i.id, v as DebtOwner)}
                  >
                    <SelectTrigger className="w-[120px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Ayaz">Ayaz</SelectItem>
                      <SelectItem value="Tasnuva">Tasnuva</SelectItem>
                    </SelectContent>
                  </Select>
                </TableCell>
                <TableCell className="text-muted-foreground text-sm">
                  {formatRecurring(i)}
                </TableCell>
                <TableCell onClick={(e) => e.stopPropagation()}>
                  <div className="flex items-center gap-1">
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="size-8"
                      onClick={() => onEdit(i)}
                      aria-label="Edit"
                    >
                      <Pencil className="size-4" />
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="size-8 text-destructive hover:text-destructive"
                      onClick={() => onDelete(i.id)}
                      aria-label="Delete"
                    >
                      <Trash2 className="size-4 text-destructive" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
}
