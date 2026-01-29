import { useState, useMemo, useCallback } from "react";
import { useBudget } from "@/context/BudgetContext";
import { useGoogleAuth } from "@/context/GoogleAuthContext";
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
} from "@/components/ui/dialog";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  Plus,
  FileDown,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  SlidersHorizontal,
  RefreshCw,
} from "lucide-react";
import { AddTransactionDialog } from "@/components/AddTransactionDialog";

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
    debts,
    debtPayments,
    updateExpense,
    removeExpense,
    removeExpenses,
    expenseCategories,
  } = useBudget();
  const { isSignedIn, spreadsheetId, syncToSheets, syncStatus } =
    useGoogleAuth();
  const { rules } = useRules();
  const [monthFilter, setMonthFilter] = useState<string>("");
  const [sourceFilter, setSourceFilter] = useState<string>("all");
  const [categoryFilter, setCategoryFilter] = useState<string>("");
  const [searchFilter, setSearchFilter] = useState<string>("");
  const [cardMemberFilter, setCardMemberFilter] = useState<string>("all");
  const [sortBy, setSortBy] = useState<
    "date" | "amount" | "description" | "source" | "category" | "cardMember"
  >("date");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [deleteAllOpen, setDeleteAllOpen] = useState(false);
  const [deleteSelectedOpen, setDeleteSelectedOpen] = useState(false);
  const [deleteOneExpense, setDeleteOneExpense] = useState<Expense | null>(
    null,
  );
  const [filtersPopupOpen, setFiltersPopupOpen] = useState(false);
  const [addTransactionOpen, setAddTransactionOpen] = useState(false);
  const [syncConfirmOpen, setSyncConfirmOpen] = useState(false);

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
      .filter((e) => e.category !== "Mortgage");
    if (monthFilter) {
      list = list.filter((e) => e.date.startsWith(monthFilter));
    }
    if (sourceFilter && sourceFilter !== "all") {
      list = list.filter((e) => e.source === sourceFilter);
    }
    if (categoryFilter) {
      if (categoryFilter === "__uncategorized") {
        list = list.filter((e) => !e.category);
      } else {
        list = list.filter((e) => e.category === categoryFilter);
      }
    }
    if (searchFilter.trim()) {
      const q = searchFilter.trim().toLowerCase();
      list = list.filter((e) => e.description.toLowerCase().includes(q));
    }
    if (cardMemberFilter && cardMemberFilter !== "all") {
      list = list.filter((e) => (e.cardMember ?? "") === cardMemberFilter);
    }
    const cmp = sortDir === "asc" ? 1 : -1;
    list.sort((a, b) => {
      let diff = 0;
      switch (sortBy) {
        case "date":
          diff = a.date.localeCompare(b.date);
          break;
        case "amount":
          diff = a.amount - b.amount;
          break;
        case "description":
          diff = a.description.localeCompare(b.description);
          break;
        case "source":
          diff = a.source.localeCompare(b.source);
          break;
        case "category":
          diff = (a.category ?? "").localeCompare(b.category ?? "");
          break;
        case "cardMember":
          diff = (a.cardMember ?? "").localeCompare(b.cardMember ?? "");
          break;
        default:
          diff = a.date.localeCompare(b.date);
      }
      return diff * cmp;
    });
    return list;
  }, [
    expenses,
    monthFilter,
    sourceFilter,
    categoryFilter,
    searchFilter,
    cardMemberFilter,
    sortBy,
    sortDir,
  ]);

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

  const hasActiveFilters =
    monthFilter ||
    sourceFilter !== "all" ||
    categoryFilter ||
    searchFilter.trim() ||
    cardMemberFilter !== "all";

  const clearFilters = useCallback(() => {
    setMonthFilter("");
    setSourceFilter("all");
    setCategoryFilter("");
    setSearchFilter("");
    setCardMemberFilter("all");
  }, []);

  const toggleSort = useCallback(
    (col: typeof sortBy) => {
      if (sortBy === col) {
        setSortDir((d) => (d === "asc" ? "desc" : "asc"));
      } else {
        setSortBy(col);
        setSortDir(col === "date" || col === "amount" ? "desc" : "asc");
      }
    },
    [sortBy],
  );

  const SortIcon = ({ column }: { column: typeof sortBy }) => {
    if (sortBy !== column)
      return <ArrowUpDown className="size-3.5 opacity-50" />;
    return sortDir === "asc" ? (
      <ArrowUp className="size-3.5" />
    ) : (
      <ArrowDown className="size-3.5" />
    );
  };

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

  return (
    <div className="flex flex-col min-h-0 flex-1 overflow-hidden">
      <h1 className="text-2xl font-semibold shrink-0 mb-4">Transactions</h1>
      <Card className="flex-1 min-h-0 flex flex-col overflow-hidden shrink-0">
        <CardHeader className="shrink-0">
          <CardTitle>Expenses</CardTitle>
          <CardDescription>
            Filter and edit categories. Re-apply rules to uncategorized rows.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex-1 min-h-0 flex flex-col overflow-hidden gap-4">
          <div className="flex items-center justify-between gap-2 shrink-0">
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                onClick={() => setFiltersPopupOpen(true)}
                className="gap-2"
              >
                <SlidersHorizontal className="size-4" />
                Filters & actions
                {hasActiveFilters && (
                  <span className="ml-1 rounded-full bg-primary/10 px-1.5 py-0.5 text-xs font-medium">
                    active
                  </span>
                )}
              </Button>
              <Button
                size="sm"
                onClick={() => setAddTransactionOpen(true)}
                className="gap-1.5"
              >
                <Plus className="size-4" />
                Add
              </Button>
            </div>
            {isSignedIn && spreadsheetId && (
              <Button
                size="sm"
                variant="outline"
                onClick={() => setSyncConfirmOpen(true)}
                disabled={syncStatus === "syncing"}
                className="gap-1.5"
              >
                <RefreshCw
                  className={`size-4 ${syncStatus === "syncing" ? "animate-spin" : ""}`}
                />
                {syncStatus === "syncing" ? "Syncing..." : "Sync to Sheets"}
              </Button>
            )}
          </div>

          <Dialog open={syncConfirmOpen} onOpenChange={setSyncConfirmOpen}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Sync to Google Sheets?</DialogTitle>
                <DialogDescription>
                  This will overwrite your spreadsheet with the app&apos;s
                  current expenses, income, and totals. Your sheet data will be
                  replaced. This cannot be undone.
                </DialogDescription>
              </DialogHeader>
              <DialogFooter>
                <Button
                  variant="outline"
                  onClick={() => setSyncConfirmOpen(false)}
                >
                  Cancel
                </Button>
                <Button
                  onClick={() => {
                    setSyncConfirmOpen(false);
                    syncToSheets();
                  }}
                >
                  Sync to Google Sheets
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          <Dialog open={filtersPopupOpen} onOpenChange={setFiltersPopupOpen}>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Filters & actions</DialogTitle>
                <DialogDescription>
                  Filter transactions, add new ones, or perform bulk actions.
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-6 py-4">
                <div>
                  <h3 className="text-sm font-medium mb-3">Filters</h3>
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
                      <Select
                        value={sourceFilter}
                        onValueChange={setSourceFilter}
                      >
                        <SelectTrigger className="w-[140px]">
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
                        onValueChange={(v) =>
                          setCategoryFilter(v === "_" ? "" : v)
                        }
                      >
                        <SelectTrigger className="w-[200px]">
                          <SelectValue placeholder="All" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="_">All</SelectItem>
                          <SelectItem value="__uncategorized">
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
                    </div>
                    <div className="space-y-2">
                      <Label>Card member</Label>
                      <Select
                        value={cardMemberFilter}
                        onValueChange={setCardMemberFilter}
                      >
                        <SelectTrigger className="w-[160px]">
                          <SelectValue placeholder="All" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All</SelectItem>
                          {cardMemberOptions.map((name) => (
                            <SelectItem key={name} value={name}>
                              {name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Search description</Label>
                      <Input
                        placeholder="Filter by description..."
                        value={searchFilter}
                        onChange={(e) => setSearchFilter(e.target.value)}
                        className="w-[200px]"
                      />
                    </div>
                    {hasActiveFilters && (
                      <Button variant="ghost" size="sm" onClick={clearFilters}>
                        Clear filters
                      </Button>
                    )}
                  </div>
                </div>
                <div>
                  <h3 className="text-sm font-medium mb-3">Actions</h3>
                  <div className="flex flex-wrap gap-2">
                    <Button
                      onClick={() => {
                        setFiltersPopupOpen(false);
                        setAddTransactionOpen(true);
                      }}
                    >
                      <Plus className="size-4" />
                      Add transaction
                    </Button>
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
                      onClick={() =>
                        downloadTransactionsAndIncomePdf(
                          expenses,
                          income,
                          debts,
                          debtPayments,
                        )
                      }
                    >
                      <FileDown className="size-4" />
                      Download PDF
                    </Button>
                    {filtered.length > 0 && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={selectAllFiltered}
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
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={clearSelection}
                        >
                          Clear selection
                        </Button>
                      </>
                    )}
                    {expenses.length > 0 && (
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => setDeleteAllOpen(true)}
                      >
                        Delete all
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            </DialogContent>
          </Dialog>
          <div className="flex-1 min-h-0 overflow-auto border rounded-md">
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
                            <TableHead className="w-[40px] px-2">
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
                            <TableHead>
                              <button
                                type="button"
                                onClick={() => toggleSort("date")}
                                className="flex items-center gap-1 hover:text-foreground"
                              >
                                Date
                                <SortIcon column="date" />
                              </button>
                            </TableHead>
                            <TableHead>
                              <button
                                type="button"
                                onClick={() => toggleSort("description")}
                                className="flex items-center gap-1 hover:text-foreground"
                              >
                                Description
                                <SortIcon column="description" />
                              </button>
                            </TableHead>
                            <TableHead>
                              <button
                                type="button"
                                onClick={() => toggleSort("amount")}
                                className="flex items-center gap-1 hover:text-foreground"
                              >
                                Amount
                                <SortIcon column="amount" />
                              </button>
                            </TableHead>
                            <TableHead>
                              <button
                                type="button"
                                onClick={() => toggleSort("source")}
                                className="flex items-center gap-1 hover:text-foreground"
                              >
                                Source
                                <SortIcon column="source" />
                              </button>
                            </TableHead>
                            <TableHead>
                              <button
                                type="button"
                                onClick={() => toggleSort("cardMember")}
                                className="flex items-center gap-1 hover:text-foreground"
                              >
                                Card Member
                                <SortIcon column="cardMember" />
                              </button>
                            </TableHead>
                            <TableHead>
                              <button
                                type="button"
                                onClick={() => toggleSort("category")}
                                className="flex items-center gap-1 hover:text-foreground"
                              >
                                Category
                                <SortIcon column="category" />
                              </button>
                            </TableHead>
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

      <AddTransactionDialog
        open={addTransactionOpen}
        onOpenChange={setAddTransactionOpen}
      />

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
