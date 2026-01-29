import { useState, useMemo, useEffect } from "react";
import { useBudget } from "@/context/BudgetContext";
import type { ExpenseSource } from "@/lib/types";
import { CategoryOption } from "@/lib/categoryColors";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Copy, Plus, Trash2 } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

const SOURCE_LABELS: Record<ExpenseSource, string> = {
  amex: "Amex",
  chase: "Chase",
  apple: "Apple",
  manual: "Manual",
  td: "TD",
};

interface TransactionRow {
  id: string;
  date: string;
  amount: string;
  description: string;
  category: string;
  source: ExpenseSource;
  cardMember: string;
}

function defaultRow(): TransactionRow {
  return {
    id: crypto.randomUUID(),
    date: new Date().toISOString().slice(0, 10),
    amount: "",
    description: "",
    category: "",
    source: "manual",
    cardMember: "",
  };
}

interface AddTransactionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function AddTransactionDialog({
  open,
  onOpenChange,
}: AddTransactionDialogProps) {
  const { expenses, addExpense, expenseCategories } = useBudget();
  const [rows, setRows] = useState<TransactionRow[]>(() => [defaultRow()]);

  useEffect(() => {
    if (open) {
      setRows([defaultRow()]);
    }
  }, [open]);

  const cardMemberOptions = useMemo(() => {
    const fromExpenses = [
      ...new Set(
        expenses.map((e) => e.cardMember).filter((m): m is string => !!m),
      ),
    ].sort();
    if (fromExpenses.length > 0) return fromExpenses;
    return ["AYAZ UDDIN", "TASNUVA AHMED"];
  }, [expenses]);

  const updateRow = (index: number, updates: Partial<TransactionRow>) => {
    setRows((prev) =>
      prev.map((r, i) => (i === index ? { ...r, ...updates } : r)),
    );
  };

  const addRow = () => {
    setRows((prev) => [...prev, defaultRow()]);
  };

  const copyRow = (index: number) => {
    const template = rows[index]!;
    const newRow: TransactionRow = { ...template, id: crypto.randomUUID() };
    setRows((prev) => [
      ...prev.slice(0, index + 1),
      newRow,
      ...prev.slice(index + 1),
    ]);
  };

  const removeRow = (index: number) => {
    if (rows.length <= 1) return;
    setRows((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    let added = 0;
    for (const row of rows) {
      const num = parseFloat(row.amount.replace(/[$,]/g, ""));
      if (Number.isNaN(num) || num <= 0) continue;
      addExpense({
        date: row.date,
        amount: num,
        description: row.description.trim() || "Manual transaction",
        category: row.category || "",
        source: row.source,
        cardMember: row.cardMember.trim() || undefined,
      });
      added += 1;
    }
    if (added > 0) {
      setRows([defaultRow()]);
      onOpenChange(false);
    }
  };

  const validCount = rows.filter((r) => {
    const n = parseFloat(r.amount.replace(/[$,]/g, ""));
    return !Number.isNaN(n) && n > 0;
  }).length;

  const compactInput = "h-8 px-2 text-sm min-w-0";
  const compactSelectTrigger = "h-8 min-w-0 max-w-full";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex flex-col w-[94vw] max-w-[94vw]! h-[92vh] max-h-[92vh] p-4 gap-3 overflow-hidden">
        <DialogHeader className="shrink-0 gap-1">
          <DialogTitle className="text-lg">
            New transaction{rows.length > 1 ? "s" : ""}
          </DialogTitle>
          <DialogDescription className="text-xs">
            One row per transaction. Copy a row to duplicate, then edit. Rows
            with a valid amount are added on submit.
          </DialogDescription>
        </DialogHeader>
        <form
          onSubmit={handleSubmit}
          className="flex flex-col flex-1 min-h-0 gap-3 overflow-hidden"
        >
          <div className="flex-1 min-h-0 overflow-auto rounded-md border">
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead className="w-20 py-1.5 text-xs font-medium">
                    Source
                  </TableHead>
                  <TableHead className="w-28 py-1.5 text-xs font-medium">
                    Date
                  </TableHead>
                  <TableHead className="w-24 py-1.5 text-xs font-medium">
                    Amount
                  </TableHead>
                  <TableHead className="min-w-[140px] py-1.5 text-xs font-medium">
                    Description
                  </TableHead>
                  <TableHead className="w-36 py-1.5 text-xs font-medium">
                    Category
                  </TableHead>
                  <TableHead className="w-28 py-1.5 text-xs font-medium">
                    Member
                  </TableHead>
                  <TableHead className="w-20 py-1.5 text-right text-xs font-medium">
                    Actions
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map((row, index) => (
                  <TableRow key={row.id} className="align-middle">
                    <TableCell className="p-1 align-middle">
                      <Select
                        value={row.source}
                        onValueChange={(v) =>
                          updateRow(index, { source: v as ExpenseSource })
                        }
                      >
                        <SelectTrigger
                          className={`${compactSelectTrigger} border-0 bg-transparent shadow-none focus-visible:ring-2`}
                        >
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="manual">
                            {SOURCE_LABELS.manual}
                          </SelectItem>
                          <SelectItem value="td">{SOURCE_LABELS.td}</SelectItem>
                          <SelectItem value="amex">
                            {SOURCE_LABELS.amex}
                          </SelectItem>
                          <SelectItem value="apple">
                            {SOURCE_LABELS.apple}
                          </SelectItem>
                          <SelectItem value="chase">
                            {SOURCE_LABELS.chase}
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    </TableCell>
                    <TableCell className="p-1 align-middle">
                      <Input
                        type="date"
                        className={compactInput}
                        value={row.date}
                        onChange={(e) =>
                          updateRow(index, { date: e.target.value })
                        }
                      />
                    </TableCell>
                    <TableCell className="p-1 align-middle">
                      <Input
                        type="text"
                        placeholder="0.00"
                        className={compactInput}
                        value={row.amount}
                        onChange={(e) =>
                          updateRow(index, { amount: e.target.value })
                        }
                      />
                    </TableCell>
                    <TableCell className="p-1 align-middle min-w-[140px]">
                      <Input
                        placeholder="e.g. Groceries"
                        className={compactInput}
                        value={row.description}
                        onChange={(e) =>
                          updateRow(index, { description: e.target.value })
                        }
                      />
                    </TableCell>
                    <TableCell className="p-1 align-middle">
                      <Select
                        value={row.category || "_"}
                        onValueChange={(v) =>
                          updateRow(index, { category: v === "_" ? "" : v })
                        }
                      >
                        <SelectTrigger
                          className={`${compactSelectTrigger} border-0 bg-transparent shadow-none focus-visible:ring-2`}
                        >
                          <SelectValue placeholder="—" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="_">
                            <CategoryOption
                              name="Uncategorized"
                              type="expense"
                            />
                          </SelectItem>
                          {expenseCategories.map((c) => (
                            <SelectItem key={c} value={c}>
                              <CategoryOption name={c} type="expense" />
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </TableCell>
                    <TableCell className="p-1 align-middle">
                      <Select
                        value={row.cardMember || "_none"}
                        onValueChange={(v) =>
                          updateRow(index, {
                            cardMember: v === "_none" ? "" : v,
                          })
                        }
                      >
                        <SelectTrigger
                          className={`${compactSelectTrigger} border-0 bg-transparent shadow-none focus-visible:ring-2`}
                        >
                          <SelectValue placeholder="—" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="_none">—</SelectItem>
                          {cardMemberOptions.map((name) => (
                            <SelectItem key={name} value={name}>
                              {name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </TableCell>
                    <TableCell className="p-1 align-middle text-right">
                      <div className="flex items-center justify-end gap-0.5">
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="size-7"
                          onClick={() => copyRow(index)}
                          title="Copy row"
                        >
                          <Copy className="size-3.5" />
                        </Button>
                        {rows.length > 1 && (
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="size-7 text-muted-foreground hover:text-destructive"
                            onClick={() => removeRow(index)}
                            title="Remove row"
                          >
                            <Trash2 className="size-3.5" />
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
          <div className="shrink-0 flex flex-wrap items-center justify-between gap-2 pt-2 border-t">
            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={addRow}
              >
                <Plus className="size-4" />
                Add row
              </Button>
              <span className="text-xs text-muted-foreground">
                {validCount} with valid amount
              </span>
            </div>
            <DialogFooter className="flex-row gap-2 p-0">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => onOpenChange(false)}
              >
                Cancel
              </Button>
              <Button type="submit" size="sm" disabled={validCount === 0}>
                Add{" "}
                {validCount === 0
                  ? ""
                  : validCount === 1
                    ? "transaction"
                    : `${validCount} transactions`}
              </Button>
            </DialogFooter>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
