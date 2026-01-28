import { useState, useMemo, useCallback } from "react";
import { useBudget } from "@/context/BudgetContext";
import { useRules } from "@/context/RulesContext";
import { applyRulesToExpenses } from "@/lib/categoryRules";
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
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

function formatCurrency(n: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(n);
}

const SOURCES = ["all", "amex", "chase", "apple", "manual"] as const;

export function TransactionsPage() {
  const {
    expenses,
    updateExpense,
    removeExpense,
    removeExpenses,
    expenseCategories,
  } = useBudget();
  const { rules } = useRules();
  const [monthFilter, setMonthFilter] = useState<string>("");
  const [sourceFilter, setSourceFilter] = useState<string>("all");
  const [categoryFilter, setCategoryFilter] = useState<string>("");
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [deleteAllOpen, setDeleteAllOpen] = useState(false);
  const [deleteSelectedOpen, setDeleteSelectedOpen] = useState(false);

  const filtered = useMemo(() => {
    let list = [...expenses].sort((a, b) => b.date.localeCompare(a.date));
    if (monthFilter) {
      list = list.filter((e) => e.date.startsWith(monthFilter));
    }
    if (sourceFilter && sourceFilter !== "all") {
      list = list.filter((e) => e.source === sourceFilter);
    }
    if (categoryFilter) {
      list = list.filter((e) => e.category === categoryFilter);
    }
    return list;
  }, [expenses, monthFilter, sourceFilter, categoryFilter]);

  const reapplyRules = () => {
    const expenseRules = rules.filter((r) => r.type === "expense");
    const updated = applyRulesToExpenses(
      expenses.filter((e) => !e.category),
      expenseRules,
    );
    updated.forEach((e) => updateExpense(e.id, { category: e.category }));
  };

  const uncategorizedCount = expenses.filter((e) => !e.category).length;

  const toggleSelect = useCallback((id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const selectAllFiltered = useCallback(() => {
    setSelectedIds((prev) => {
      const filteredIds = new Set(filtered.map((e) => e.id));
      const allSelected =
        filtered.length > 0 && filtered.every((e) => prev.has(e.id));
      return allSelected ? new Set() : filteredIds;
    });
  }, [filtered]);

  const clearSelection = useCallback(() => setSelectedIds(new Set()), []);

  const allFilteredSelected =
    filtered.length > 0 && filtered.every((e) => selectedIds.has(e.id));
  const someSelected = selectedIds.size > 0;

  const handleDeleteSelected = useCallback(() => {
    removeExpenses(Array.from(selectedIds));
    clearSelection();
    setDeleteSelectedOpen(false);
  }, [selectedIds, removeExpenses, clearSelection]);

  const handleDeleteAll = useCallback(() => {
    removeExpenses(expenses.map((e) => e.id));
    clearSelection();
    setDeleteAllOpen(false);
  }, [expenses, removeExpenses, clearSelection]);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Transactions</h1>
      <Card>
        <CardHeader>
          <CardTitle>Expenses</CardTitle>
          <CardDescription>
            Filter and edit categories. Re-apply rules to uncategorized rows.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap gap-4 items-end">
            <div className="space-y-2">
              <Label>Month</Label>
              <Input
                type="month"
                value={monthFilter}
                onChange={(e) => setMonthFilter(e.target.value)}
                className="w-[160px]"
              />
            </div>
            <div className="space-y-2">
              <Label>Source</Label>
              <Select value={sourceFilter} onValueChange={setSourceFilter}>
                <SelectTrigger className="w-[120px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {SOURCES.map((s) => (
                    <SelectItem key={s} value={s}>
                      {s === "all" ? "All" : s}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Category</Label>
              <Select
                value={categoryFilter || "_"}
                onValueChange={(v) => setCategoryFilter(v === "_" ? "" : v)}
              >
                <SelectTrigger className="w-[160px]">
                  <SelectValue placeholder="All" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="_">All</SelectItem>
                  {expenseCategories.map((c) => (
                    <SelectItem key={c} value={c}>
                      {c}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {uncategorizedCount > 0 && (
              <Button variant="outline" onClick={reapplyRules}>
                Re-apply rules ({uncategorizedCount} uncategorized)
              </Button>
            )}
            {someSelected && (
              <>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => setDeleteSelectedOpen(true)}
                >
                  Delete selected ({selectedIds.size})
                </Button>
                <Button variant="ghost" size="sm" onClick={clearSelection}>
                  Clear selection
                </Button>
              </>
            )}
            {expenses.length > 0 && (
              <Button
                variant="destructive"
                size="sm"
                onClick={() => setDeleteAllOpen(true)}
                className="ml-auto"
              >
                Delete all
              </Button>
            )}
          </div>
          <div className="overflow-x-auto max-h-[60vh] overflow-y-auto border rounded-md">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[40px]">
                    <Checkbox
                      checked={allFilteredSelected}
                      onCheckedChange={selectAllFiltered}
                      aria-label="Select all"
                    />
                  </TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Source</TableHead>
                  <TableHead>Card Member</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead className="w-[80px]">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={8}
                      className="text-center text-muted-foreground py-8"
                    >
                      No transactions. Import a CSV or add income.
                    </TableCell>
                  </TableRow>
                ) : (
                  filtered.map((e) => (
                    <TableRow key={e.id}>
                      <TableCell className="w-[40px]">
                        <Checkbox
                          checked={selectedIds.has(e.id)}
                          onCheckedChange={() => toggleSelect(e.id)}
                          aria-label={`Select ${e.description}`}
                        />
                      </TableCell>
                      <TableCell className="whitespace-nowrap">
                        {e.date}
                      </TableCell>
                      <TableCell className="max-w-[220px] truncate">
                        {e.description}
                      </TableCell>
                      <TableCell>{formatCurrency(e.amount)}</TableCell>
                      <TableCell className="text-muted-foreground">
                        {e.source}
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {e.cardMember ?? "—"}
                      </TableCell>
                      <TableCell>
                        <Select
                          value={e.category || "_"}
                          onValueChange={(v) =>
                            updateExpense(e.id, {
                              category: v === "_" ? "" : v,
                            })
                          }
                        >
                          <SelectTrigger className="w-[160px]">
                            <SelectValue placeholder="Category" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="_">Uncategorized</SelectItem>
                            {expenseCategories.map((c) => (
                              <SelectItem key={c} value={c}>
                                {c}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => removeExpense(e.id)}
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

      <Dialog open={deleteSelectedOpen} onOpenChange={setDeleteSelectedOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete selected transactions?</DialogTitle>
            <DialogDescription>
              {selectedIds.size} transaction{selectedIds.size === 1 ? "" : "s"}{" "}
              will be removed. This cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDeleteSelectedOpen(false)}
            >
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDeleteSelected}>
              Delete selected
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={deleteAllOpen} onOpenChange={setDeleteAllOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete all transactions?</DialogTitle>
            <DialogDescription>
              All {expenses.length} expense{expenses.length === 1 ? "" : "s"}{" "}
              will be removed. This cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteAllOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDeleteAll}>
              Delete all
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
