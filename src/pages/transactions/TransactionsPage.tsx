import { useState, useMemo, useCallback } from "react";
import { useTranslation } from "react-i18next";
import { useBudget } from "@/context/BudgetContext";
import type { Expense } from "@/lib/types";
import { isValidDate } from "@/lib/totals";
import { cleanDescription } from "@/lib/parsers";
import { AddTransactionDialog } from "@/components/AddTransactionDialog";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, SlidersHorizontal, Receipt } from "lucide-react";
import { TransactionsToolbar } from "./TransactionsToolbar";
import { FiltersAndActionsDialog } from "./FiltersAndActionsDialog";
import { SOURCE_LABEL_KEYS } from "@/lib/sourceLabels";
import { ExpensesByMonthTable, type SortColumn } from "./ExpensesByMonthTable";
import { ExpensesByMonthList } from "./ExpensesByMonthList";
import { ExpenseActionsDialog } from "./ExpenseActionsDialog";
import { EditTransactionDialog } from "./EditTransactionDialog";
import {
  DeleteOneTransactionDialog,
  DeleteAllTransactionsDialog,
} from "./DeleteTransactionDialogs";

export function TransactionsPage() {
  const { t } = useTranslation();
  const {
    expenses,
    updateExpense,
    removeExpense,
    removeExpenses,
    expenseCategories,
    owners,
    cardSources,
  } = useBudget();
  const [monthFilter, setMonthFilter] = useState<string>("");
  const [sourceFilter, setSourceFilter] = useState<string>("all");
  const [categoryFilter, setCategoryFilter] = useState<string>("");
  const [searchFilter, setSearchFilter] = useState<string>("");
  const [ownerFilter, setOwnerFilter] = useState<string>("all");
  const [sortBy, setSortBy] = useState<SortColumn>("date");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");
  const [deleteAllOpen, setDeleteAllOpen] = useState(false);
  const [deleteOneExpense, setDeleteOneExpense] = useState<Expense | null>(
    null,
  );
  const [editExpense, setEditExpense] = useState<Expense | null>(null);
  const [expenseForActions, setExpenseForActions] = useState<Expense | null>(
    null,
  );
  const [filtersPopupOpen, setFiltersPopupOpen] = useState(false);
  const [addTransactionOpen, setAddTransactionOpen] = useState(false);

  const ownerOptions = useMemo(() => {
    if (owners.length > 0) return owners;
    const fromExpenses = [
      ...new Set(
        expenses.map((e) => e.owner).filter((m): m is string => !!m),
      ),
    ].sort();
    return fromExpenses;
  }, [owners, expenses]);

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
    if (ownerFilter && ownerFilter !== "all") {
      if (ownerFilter === "_none") {
        list = list.filter((e) => !e.owner);
      } else {
        list = list.filter((e) => (e.owner ?? "") === ownerFilter);
      }
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
        case "owner":
          diff = (a.owner ?? "").localeCompare(b.owner ?? "");
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
    ownerFilter,
    sortBy,
    sortDir,
  ]);

  const byMonth = useMemo(() => {
    const map = new Map<string, Expense[]>();
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

  const cleanAllDescriptions = useCallback(() => {
    expenses.forEach((e) => {
      const cleaned = cleanDescription(e.description);
      if (cleaned !== e.description) {
        updateExpense(e.id, { description: cleaned });
      }
    });
  }, [expenses, updateExpense]);

  const hasActiveFilters = Boolean(
    monthFilter ||
    sourceFilter !== "all" ||
    categoryFilter ||
    searchFilter.trim() ||
    ownerFilter !== "all",
  );

  const clearFilters = useCallback(() => {
    setMonthFilter("");
    setSourceFilter("all");
    setCategoryFilter("");
    setSearchFilter("");
    setOwnerFilter("all");
  }, []);

  const toggleSort = useCallback(
    (col: SortColumn) => {
      if (sortBy === col) {
        setSortDir((d) => (d === "asc" ? "desc" : "asc"));
      } else {
        setSortBy(col);
        setSortDir(col === "date" || col === "amount" ? "desc" : "asc");
      }
    },
    [sortBy],
  );

  const handleDeleteAll = useCallback(() => {
    removeExpenses(expenses.map((e) => e.id));
    setDeleteAllOpen(false);
  }, [expenses, removeExpenses]);

  const handleDeleteOne = useCallback(() => {
    if (deleteOneExpense) {
      removeExpense(deleteOneExpense.id);
      setDeleteOneExpense(null);
    }
  }, [deleteOneExpense, removeExpense]);

  return (
    <div className="flex flex-col min-h-0 flex-1 overflow-hidden">
      <div className="hidden md:flex flex-wrap items-start justify-between gap-2 shrink-0 mb-4">
        <div className="space-y-1 min-w-0">
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-semibold">
              {t("transactions.title")}
            </h1>
          </div>
          <p className="text-sm text-muted-foreground">
            {t("transactions.subtitle")}
          </p>
        </div>
        <div>
          <TransactionsToolbar
            onOpenFilters={() => setFiltersPopupOpen(true)}
            onAddTransaction={() => setAddTransactionOpen(true)}
            hasActiveFilters={hasActiveFilters}
            t={t}
          />
        </div>
      </div>
      <div className="md:hidden mb-3 px-4 pt-4 shrink-0 bg-background/95 backdrop-blur">
        <div className="px-0 py-3 flex items-center justify-between gap-3">
          <div className="min-w-0">
            <h1 className="text-xl font-semibold">
              {t("transactions.title")}
            </h1>
            <p className="text-xs text-muted-foreground">
              {t("transactions.subtitle")}
            </p>
          </div>
        </div>
      </div>
      <div className="flex-1 pb-24 md:pb-0">
        <Card className="flex-1 min-h-0 flex flex-col overflow-hidden shrink-0 md:border-0 md:shadow-none md:rounded-none md:bg-transparent md:py-0">
        <CardContent className="flex-1 min-h-0 flex flex-col overflow-hidden gap-0 px-0 pb-24 md:px-0 md:pb-0 md:gap-4 transactions-card-content">
            <FiltersAndActionsDialog
              open={filtersPopupOpen}
              onOpenChange={setFiltersPopupOpen}
              monthFilter={monthFilter}
              onMonthFilterChange={setMonthFilter}
              sourceFilter={sourceFilter}
              onSourceFilterChange={setSourceFilter}
              categoryFilter={categoryFilter}
              onCategoryFilterChange={setCategoryFilter}
              ownerFilter={ownerFilter}
              onOwnerFilterChange={setOwnerFilter}
              searchFilter={searchFilter}
              onSearchFilterChange={setSearchFilter}
              expenseCategories={expenseCategories}
              ownerOptions={ownerOptions}
              cardSources={cardSources}
              hasActiveFilters={hasActiveFilters}
              onClearFilters={clearFilters}
              onCleanDescriptions={cleanAllDescriptions}
              expensesCount={expenses.length}
              onDeleteAll={() => setDeleteAllOpen(true)}
              t={t}
            />

            <div className="flex-1 md:border md:rounded-md">
              {filtered.length === 0 ? (
                <div className="text-center text-muted-foreground py-12 px-4 flex flex-col items-center gap-3">
                  <Receipt className="size-8 text-muted-foreground/70" />
                  <p className="text-sm font-medium text-foreground/80">
                    {t("transactions.noTransactions")}
                  </p>
                </div>
              ) : (
                <>
                  <div className="hidden md:block">
                    <ExpensesByMonthTable
                      byMonth={byMonth}
                      defaultOpenMonth={defaultOpenMonth}
                      sortBy={sortBy}
                      sortDir={sortDir}
                      onSort={toggleSort}
                      onUpdateCategory={(id, category) =>
                        updateExpense(id, { category })
                      }
                      onUpdateOwner={(id, owner) =>
                        updateExpense(id, { owner: owner || undefined })
                      }
                      expenseCategories={expenseCategories}
                      ownerOptions={ownerOptions}
                      onEditOne={setEditExpense}
                      onDeleteOne={setDeleteOneExpense}
                      sourceLabelKeys={SOURCE_LABEL_KEYS}
                      t={t}
                    />
                  </div>
                  <div className="md:hidden">
                    <ExpensesByMonthList
                      byMonth={byMonth}
                      defaultOpenMonth={defaultOpenMonth}
                      onExpenseTap={setExpenseForActions}
                      t={t}
                    />
                  </div>
                </>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="md:hidden fixed inset-x-0 bottom-[calc(env(safe-area-inset-bottom)+72px)] z-30 px-4 pb-3 pointer-events-none">
        <div
         
          className="pointer-events-auto flex items-center justify-end"
        >
          <div className="flex items-center gap-2 rounded-full border border-border/60 bg-background/20 shadow-lg shadow-black/30 backdrop-blur px-2 py-2">
            <Button
              variant="secondary"
              onClick={() => setFiltersPopupOpen(true)}
             
              className="h-11 w-11 rounded-full p-0"
              aria-label={
                hasActiveFilters
                  ? `${t("common.filtersAndActions")} (${t("common.active")})`
                  : t("common.filtersAndActions")
              }
            >
              <SlidersHorizontal className="size-4" />
            </Button>
            <Button
              onClick={() => setAddTransactionOpen(true)}
             
              className="h-11 w-11 rounded-full p-0"
              aria-label={t("common.add")}
            >
              <Plus className="size-4" />
            </Button>
          </div>
        </div>
      </div>

      <AddTransactionDialog
        open={addTransactionOpen}
        onOpenChange={setAddTransactionOpen}
      />

      <ExpenseActionsDialog
        expense={expenseForActions}
        onClose={() => setExpenseForActions(null)}
        onEdit={(expense) => {
          setExpenseForActions(null);
          setEditExpense(expense);
        }}
        onUpdateCategory={(id, category) => updateExpense(id, { category })}
        onUpdateOwner={(id, owner) =>
          updateExpense(id, { owner: owner || undefined })
        }
        onDelete={(e) => {
          setExpenseForActions(null);
          setDeleteOneExpense(e);
        }}
        expenseCategories={expenseCategories}
        ownerOptions={ownerOptions}
        t={t}
      />

      <EditTransactionDialog
        expense={editExpense}
        onClose={() => setEditExpense(null)}
        onSubmit={(id, updates) => updateExpense(id, updates)}
        expenseCategories={expenseCategories}
        ownerOptions={ownerOptions}
        cardSources={cardSources}
      />

      <DeleteOneTransactionDialog
        expense={deleteOneExpense}
        onClose={() => setDeleteOneExpense(null)}
        onConfirm={handleDeleteOne}
        t={t}
      />

      <DeleteAllTransactionsDialog
        open={deleteAllOpen}
        onOpenChange={setDeleteAllOpen}
        count={expenses.length}
        onConfirm={handleDeleteAll}
        t={t}
      />
    </div>
  );
}
