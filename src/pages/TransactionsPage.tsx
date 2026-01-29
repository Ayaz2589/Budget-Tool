import { useState, useMemo, useCallback } from "react";
import { useBudget } from "@/context/BudgetContext";
import { useRules } from "@/context/RulesContext";
import {
  applyRulesToExpenses,
  applyBaselineToExpenses,
} from "@/lib/categoryRules";
import type { Expense, ExpenseSource } from "@/lib/types";
import { getMonthLabel, isValidDate } from "@/lib/totals";
import { cleanDescription } from "@/lib/parsers";
import { downloadTransactionsAndIncomePdf } from "@/lib/pdfExport";
import { CategoryOption } from "@/lib/categoryColors";
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
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Plus, FileDown } from "lucide-react";

function formatCurrency(n: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(n);
}

const SOURCES = ["all", "amex", "chase", "apple", "manual", "td"] as const;

const SOURCE_LABELS: Record<ExpenseSource | "all", string> = {
  all: "All",
  amex: "American Express",
  chase: "Chase",
  apple: "Apple Card",
  manual: "Manual",
  td: "Debit (TD Bank)",
};

export function TransactionsPage() {
  const {
    expenses,
    income,
    addExpense,
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
  const [deleteOneExpense, setDeleteOneExpense] = useState<Expense | null>(
    null,
  );
  const [addTransactionOpen, setAddTransactionOpen] = useState(false);
  const [addDate, setAddDate] = useState(() =>
    new Date().toISOString().slice(0, 10),
  );
  const [addAmount, setAddAmount] = useState("");
  const [addDescription, setAddDescription] = useState("");
  const [addCategory, setAddCategory] = useState<string>("");
  const [addSource, setAddSource] = useState<ExpenseSource>("manual");
  const [addCardMember, setAddCardMember] = useState("");

  const cardMemberOptions = useMemo(() => {
    const fromExpenses = [
      ...new Set(
        expenses.map((e) => e.cardMember).filter((m): m is string => !!m),
      ),
    ].sort();
    if (fromExpenses.length > 0) return fromExpenses;
    return ["AYAZ UDDIN", "TASNUVA AHMED"];
  }, [expenses]);

  const filtered = useMemo(() => {
    let list = [...expenses]
      .filter((e) => isValidDate(e.date))
      .sort((a, b) => b.date.localeCompare(a.date));
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

  const byMonth = useMemo(() => {
    const map = new Map<string, typeof filtered>();
    for (const e of filtered) {
      const key = e.date.slice(0, 7);
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(e);
    }
    return Array.from(map.entries()).sort((a, b) => b[0].localeCompare(a[0]));
  }, [filtered]);

  const currentMonthKey = new Date().toISOString().slice(0, 7);
  const defaultOpenMonth = byMonth.some(([k]) => k === currentMonthKey)
    ? currentMonthKey
    : (byMonth[0]?.[0] ?? "");

  const reapplyRules = () => {
    const expenseRules = rules.filter((r) => r.type === "expense");
    const uncategorized = expenses.filter((e) => !e.category);
    const withRules = applyRulesToExpenses(uncategorized, expenseRules);
    const withBaseline = applyBaselineToExpenses(withRules);
    withBaseline.forEach((e) => updateExpense(e.id, { category: e.category }));
  };

  const cleanAllDescriptions = () => {
    expenses.forEach((e) => {
      const cleaned = cleanDescription(e.description);
      if (cleaned !== e.description) {
        updateExpense(e.id, { description: cleaned });
      }
    });
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

  const handleDeleteOne = useCallback(() => {
    if (deleteOneExpense) {
      removeExpense(deleteOneExpense.id);
      setDeleteOneExpense(null);
    }
  }, [deleteOneExpense, removeExpense]);

  const handleAddTransaction = (e: React.FormEvent) => {
    e.preventDefault();
    const num = parseFloat(addAmount.replace(/[$,]/g, ""));
    if (Number.isNaN(num) || num <= 0) return;
    addExpense({
      date: addDate,
      amount: num,
      description: addDescription.trim() || "Manual transaction",
      category: addCategory || "",
      source: addSource,
      cardMember: addCardMember.trim() || undefined,
    });
    setAddAmount("");
    setAddDescription("");
    setAddCategory("");
    setAddSource("manual");
    setAddCardMember("");
    setAddDate(new Date().toISOString().slice(0, 10));
    setAddTransactionOpen(false);
  };

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
            <Dialog
              open={addTransactionOpen}
              onOpenChange={setAddTransactionOpen}
            >
              <DialogTrigger asChild>
                <Button>
                  <Plus className="size-4" />
                  Add transaction
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>New transaction</DialogTitle>
                  <DialogDescription>
                    Add an expense manually. Choose the source (e.g. Manual or
                    Debit (TD Bank)).
                  </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleAddTransaction} className="space-y-4">
                  <div className="space-y-2">
                    <Label>Source</Label>
                    <Select
                      value={addSource}
                      onValueChange={(v) => setAddSource(v as ExpenseSource)}
                    >
                      <SelectTrigger className="w-full min-w-[200px]">
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
                  </div>
                  <div className="space-y-2">
                    <Label>Date</Label>
                    <Input
                      type="date"
                      value={addDate}
                      onChange={(e) => setAddDate(e.target.value)}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Amount</Label>
                    <Input
                      type="text"
                      placeholder="0.00"
                      value={addAmount}
                      onChange={(e) => setAddAmount(e.target.value)}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Description</Label>
                    <Input
                      placeholder="e.g. Groceries, Gas"
                      value={addDescription}
                      onChange={(e) => setAddDescription(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Category</Label>
                    <Select
                      value={addCategory || "_"}
                      onValueChange={(v) => setAddCategory(v === "_" ? "" : v)}
                    >
                      <SelectTrigger className="w-full min-w-[200px]">
                        <SelectValue placeholder="Category" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="_">
                          <CategoryOption name="Uncategorized" type="expense" />
                        </SelectItem>
                        {expenseCategories.map((c) => (
                          <SelectItem key={c} value={c}>
                            <CategoryOption name={c} type="expense" />
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Card member (optional)</Label>
                    <Select
                      value={addCardMember || "_none"}
                      onValueChange={(v) =>
                        setAddCardMember(v === "_none" ? "" : v)
                      }
                    >
                      <SelectTrigger className="w-full min-w-[200px]">
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
                  </div>
                  <DialogFooter>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setAddTransactionOpen(false)}
                    >
                      Cancel
                    </Button>
                    <Button type="submit">Add</Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>
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
                      {SOURCE_LABELS[s]}
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
                <SelectTrigger className="w-[220px] min-w-[200px]">
                  <SelectValue placeholder="All" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="_">All</SelectItem>
                  {expenseCategories.map((c) => (
                    <SelectItem key={c} value={c}>
                      <CategoryOption name={c} type="expense" />
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
            <Button variant="outline" onClick={cleanAllDescriptions}>
              Clean descriptions
            </Button>
            <Button
              variant="outline"
              onClick={() => downloadTransactionsAndIncomePdf(expenses, income)}
            >
              <FileDown className="size-4" />
              Download PDF
            </Button>
            {filtered.length > 0 && (
              <Button
                variant="outline"
                size="sm"
                onClick={selectAllFiltered}
                className={someSelected ? undefined : ""}
              >
                {allFilteredSelected ? "Deselect all" : "Select all"}
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
            {filtered.length === 0 ? (
              <div className="text-center text-muted-foreground py-12 px-4">
                No transactions. Import a CSV or add a manual transaction.
              </div>
            ) : (
              <Accordion
                type="single"
                collapsible
                defaultValue={defaultOpenMonth}
                className="divide-y"
              >
                {byMonth.map(([monthKey, monthExpenses]) => (
                  <AccordionItem
                    key={monthKey}
                    value={monthKey}
                    className="border-0"
                  >
                    <AccordionTrigger className="px-4 py-3 hover:no-underline hover:bg-muted/50">
                      <span className="font-semibold">
                        {getMonthLabel(monthKey)}
                      </span>
                      <span className="text-muted-foreground font-normal ml-2">
                        ({monthExpenses.length} transaction
                        {monthExpenses.length === 1 ? "" : "s"})
                      </span>
                    </AccordionTrigger>
                    <AccordionContent className="px-0 pb-0">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead className="w-[40px]">
                              <Checkbox
                                checked={
                                  monthExpenses.length > 0 &&
                                  monthExpenses.every((e) =>
                                    selectedIds.has(e.id),
                                  )
                                }
                                onCheckedChange={() => {
                                  const ids = new Set(
                                    monthExpenses.map((e) => e.id),
                                  );
                                  const allSelected =
                                    ids.size > 0 &&
                                    [...ids].every((id: string) =>
                                      selectedIds.has(id),
                                    );
                                  setSelectedIds((prev) => {
                                    const next = new Set(prev);
                                    if (allSelected)
                                      ids.forEach((id) => next.delete(id));
                                    else ids.forEach((id) => next.add(id));
                                    return next;
                                  });
                                }}
                                aria-label="Select all in month"
                              />
                            </TableHead>
                            <TableHead className="w-[100px]">ID</TableHead>
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
                          {monthExpenses.map((e, index) => (
                            <TableRow
                              key={e.id}
                              className={
                                index % 2 === 1 ? "bg-muted/30" : undefined
                              }
                            >
                              <TableCell className="w-[40px]">
                                <Checkbox
                                  checked={selectedIds.has(e.id)}
                                  onCheckedChange={() => toggleSelect(e.id)}
                                  aria-label={`Select ${e.description}`}
                                />
                              </TableCell>
                              <TableCell
                                className="font-mono text-xs max-w-[100px] truncate"
                                title={e.id}
                              >
                                {e.id}
                              </TableCell>
                              <TableCell className="whitespace-nowrap">
                                {e.date}
                              </TableCell>
                              <TableCell className="max-w-[220px] truncate">
                                {e.description}
                              </TableCell>
                              <TableCell>{formatCurrency(e.amount)}</TableCell>
                              <TableCell className="text-muted-foreground">
                                {SOURCE_LABELS[e.source]}
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
                                  <SelectTrigger className="w-[220px] min-w-[200px]">
                                    <SelectValue placeholder="Category" />
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
                                        <CategoryOption
                                          name={c}
                                          type="expense"
                                        />
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              </TableCell>
                              <TableCell>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => setDeleteOneExpense(e)}
                                  className="text-destructive hover:text-destructive"
                                >
                                  Delete
                                </Button>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            )}
          </div>
        </CardContent>
      </Card>

      <Dialog
        open={deleteOneExpense !== null}
        onOpenChange={(open) => !open && setDeleteOneExpense(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete this transaction?</DialogTitle>
            <DialogDescription>
              {deleteOneExpense ? (
                <>
                  <span className="font-medium">{deleteOneExpense.date}</span>{" "}
                  {deleteOneExpense.description} (
                  {formatCurrency(deleteOneExpense.amount)}) will be removed.
                  This cannot be undone.
                </>
              ) : (
                "This transaction will be removed. This cannot be undone."
              )}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteOneExpense(null)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDeleteOne}>
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

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
