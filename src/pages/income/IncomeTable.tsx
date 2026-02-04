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
import type { IncomeTableProps } from "@/types/income";

export type { IncomeTableProps };

export function IncomeTable({
  sortedIncome,
  incomeCategories,
  ownerOptions = [],
  onEdit,
  onDelete,
  onUpdateCategory,
  onUpdateOwner,
}: IncomeTableProps) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Date</TableHead>
          <TableHead>Description</TableHead>
          <TableHead>Amount</TableHead>
          <TableHead>Category</TableHead>
          <TableHead>Owner</TableHead>
          <TableHead className="w-[120px]">Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {sortedIncome.length === 0 ? (
          <TableRow>
            <TableCell
              colSpan={6}
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
                  value={i.category || "_"}
                  onValueChange={(v) =>
                    onUpdateCategory(i.id, v === "_" ? "" : v)
                  }
                >
                  <SelectTrigger className="w-[220px] min-w-[200px]">
                    <SelectValue>
                      <CategoryOption
                        name={i.category || "Uncategorized"}
                        type="income"
                      />
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="_">
                      <CategoryOption name="Uncategorized" type="income" />
                    </SelectItem>
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
                  value={i.owner || "_none"}
                  onValueChange={(v) =>
                    onUpdateOwner(i.id, v === "_none" ? "" : v)
                  }
                >
                  <SelectTrigger className="w-[120px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="_none">No Owner</SelectItem>
                    {ownerOptions.map((o) => (
                      <SelectItem key={o} value={o}>
                        {o}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
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
  );
}
