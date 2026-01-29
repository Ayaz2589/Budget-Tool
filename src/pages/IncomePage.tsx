import { useState, useEffect } from "react";
import { useBudget } from "@/context/BudgetContext";
import type { Income } from "@/lib/types";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
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
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Plus, FileDown, Copy, Trash2 } from "lucide-react";
import { CategoryOption } from "@/lib/categoryColors";
import { downloadTransactionsAndIncomePdf } from "@/lib/pdfExport";

interface IncomeRow {
  id: string;
  date: string;
  amount: string;
  description: string;
  category: string;
}

function defaultIncomeRow(): IncomeRow {
  return {
    id: crypto.randomUUID(),
    date: new Date().toISOString().slice(0, 10),
    amount: "",
    description: "",
    category: "Paycheck",
  };
}

function formatCurrency(n: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(n);
}

export function IncomePage() {
  const {
    expenses,
    income,
    addIncomes,
    updateIncome,
    removeIncome,
    incomeCategories,
  } = useBudget();
  const [open, setOpen] = useState(false);
  const [rows, setRows] = useState<IncomeRow[]>(() => [defaultIncomeRow()]);

  useEffect(() => {
    if (open) {
      setRows([defaultIncomeRow()]);
    }
  }, [open]);

  const updateRow = (index: number, updates: Partial<IncomeRow>) => {
    setRows((prev) =>
      prev.map((r, i) => (i === index ? { ...r, ...updates } : r)),
    );
  };

  const addRow = () => {
    setRows((prev) => [...prev, defaultIncomeRow()]);
  };

  const copyRow = (index: number) => {
    const template = rows[index]!;
    const newRow: IncomeRow = { ...template, id: crypto.randomUUID() };
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
    const toAdd: Income[] = [];
    for (const row of rows) {
      const num = parseFloat(row.amount.replace(/[$,]/g, ""));
      if (Number.isNaN(num) || num <= 0) continue;
      toAdd.push({
        id: crypto.randomUUID(),
        date: row.date,
        amount: num,
        description: row.description.trim() || "Income",
        category: row.category || (incomeCategories[0] ?? "Paycheck"),
      });
    }
    if (toAdd.length > 0) {
      addIncomes(toAdd);
      setRows([defaultIncomeRow()]);
      setOpen(false);
    }
  };

  const validCount = rows.filter((r) => {
    const n = parseFloat(r.amount.replace(/[$,]/g, ""));
    return !Number.isNaN(n) && n > 0;
  }).length;

  const sortedIncome = [...income].sort((a, b) => b.date.localeCompare(a.date));

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Income</h1>
      <Card>
        <CardHeader>
          <CardTitle>Add income</CardTitle>
          <CardDescription>
            Paycheck, rent from tenants, bonus, etc.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="size-4" />
                Add income
              </Button>
            </DialogTrigger>
            <DialogContent className="flex flex-col w-[94vw] max-w-[94vw]! h-[92vh] max-h-[92vh] p-4 gap-3 overflow-hidden">
              <DialogHeader className="shrink-0 gap-1">
                <DialogTitle className="text-lg">
                  New income {rows.length > 1 ? "entries" : "entry"}
                </DialogTitle>
                <DialogDescription className="text-xs">
                  One row per entry. Copy a row to duplicate, then edit. Rows
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
                        <TableHead className="w-28 py-1.5 text-xs font-medium">
                          Date
                        </TableHead>
                        <TableHead className="w-24 py-1.5 text-xs font-medium">
                          Amount
                        </TableHead>
                        <TableHead className="min-w-[160px] py-1.5 text-xs font-medium">
                          Description
                        </TableHead>
                        <TableHead className="w-32 py-1.5 text-xs font-medium">
                          Category
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
                            <Input
                              type="date"
                              className="h-8 px-2 text-sm min-w-0"
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
                              className="h-8 px-2 text-sm min-w-0"
                              value={row.amount}
                              onChange={(e) =>
                                updateRow(index, { amount: e.target.value })
                              }
                            />
                          </TableCell>
                          <TableCell className="p-1 align-middle min-w-[160px]">
                            <Input
                              placeholder="e.g. Basement Rent, Paycheck"
                              className="h-8 px-2 text-sm min-w-0"
                              value={row.description}
                              onChange={(e) =>
                                updateRow(index, {
                                  description: e.target.value,
                                })
                              }
                            />
                          </TableCell>
                          <TableCell className="p-1 align-middle">
                            <Select
                              value={row.category}
                              onValueChange={(v) =>
                                updateRow(index, { category: v })
                              }
                            >
                              <SelectTrigger className="h-8 min-w-0 max-w-full border-0 bg-transparent shadow-none focus-visible:ring-2">
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
                      onClick={() => setOpen(false)}
                    >
                      Cancel
                    </Button>
                    <Button type="submit" size="sm" disabled={validCount === 0}>
                      Add{" "}
                      {validCount === 0
                        ? ""
                        : validCount === 1
                          ? "income"
                          : `${validCount} income entries`}
                    </Button>
                  </DialogFooter>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Income entries</CardTitle>
          <CardDescription>Edit or delete entries below.</CardDescription>
          <div className="pt-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => downloadTransactionsAndIncomePdf(expenses, income)}
            >
              <FileDown className="size-4" />
              Download PDF (transactions & income)
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto max-h-[50vh] overflow-y-auto border rounded-md">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead className="w-[80px]">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sortedIncome.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={5}
                      className="text-center text-muted-foreground py-8"
                    >
                      No income entries. Add one above.
                    </TableCell>
                  </TableRow>
                ) : (
                  sortedIncome.map((i) => (
                    <TableRow key={i.id}>
                      <TableCell className="whitespace-nowrap">
                        {i.date}
                      </TableCell>
                      <TableCell>{i.description}</TableCell>
                      <TableCell>{formatCurrency(i.amount)}</TableCell>
                      <TableCell>
                        <Select
                          value={i.category}
                          onValueChange={(v) =>
                            updateIncome(i.id, { category: v })
                          }
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
                      <TableCell onClick={(e) => e.stopPropagation()}>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            removeIncome(i.id);
                          }}
                          className="text-destructive hover:text-destructive"
                        >
                          Delete
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
