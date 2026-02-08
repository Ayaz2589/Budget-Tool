import { useState, useMemo, useCallback, useEffect, useRef } from "react";
import { useTranslation } from "react-i18next";
import { useLocation } from "react-router-dom";
import { useBudget } from "@/context/BudgetContext";
import type { Expense } from "@/lib/types";
import { isValidDate } from "@/lib/totals";
import { AddTransactionDialog } from "@/components/AddTransactionDialog";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, SlidersHorizontal, Receipt } from "lucide-react";
import { DsActionBar, DsEmptyState, DsSectionHeader } from "@/components/ds";
import { TransactionsToolbar } from "./TransactionsToolbar";
import { FiltersAndActionsDialog } from "./FiltersAndActionsDialog";
import { SOURCE_LABEL_KEYS } from "@/lib/sourceLabels";
import { ExpensesByMonthTable, type SortColumn } from "./ExpensesByMonthTable";
import { ExpensesByMonthList } from "./ExpensesByMonthList";
import { ExpenseActionsDialog } from "./ExpenseActionsDialog";
import { EditTransactionDialog } from "./EditTransactionDialog";
import { DeleteOneTransactionDialog } from "./DeleteTransactionDialogs";

export function TransactionsPage() {
  const { t } = useTranslation();
  const location = useLocation();
  const {
    expenses,
    updateExpense,
    removeExpense,
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
  const [deleteOneExpense, setDeleteOneExpense] = useState<Expense | null>(
    null,
  );
  const [editExpense, setEditExpense] = useState<Expense | null>(null);
  const [expenseForActions, setExpenseForActions] = useState<Expense | null>(
    null,
  );
  const [filtersPopupOpen, setFiltersPopupOpen] = useState(false);
  const [addTransactionOpen, setAddTransactionOpen] = useState(false);
  const pendingHighlightIdRef = useRef<string | null>(null);
  const pendingOpenEditIdRef = useRef<string | null>(null);

  const ownerOptions = useMemo(() => {
    if (owners.length > 0) return owners;
    const fromExpenses = [
      ...new Set(
        expenses.map((e) => e.owner).filter((m): m is string => !!m),
      ),
    ].sort();
    return fromExpenses;
  }, [owners, expenses]);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    setMonthFilter(params.get("month") ?? "");
    setSourceFilter(params.get("source") ?? "all");
    setCategoryFilter(params.get("category") ?? "");
    setOwnerFilter(params.get("owner") ?? "all");
    pendingHighlightIdRef.current = params.get("highlight");
    pendingOpenEditIdRef.current = params.get("openEdit");
  }, [location.search]);

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
      } else if (ownerFilter === "_shared") {
        list = list.filter(
          (e) =>
            (e.category || "").trim().toLowerCase() === "50/50" || !e.owner,
        );
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

  const handleDeleteOne = useCallback(() => {
    if (deleteOneExpense) {
      removeExpense(deleteOneExpense.id);
      setDeleteOneExpense(null);
    }
  }, [deleteOneExpense, removeExpense]);

  useEffect(() => {
    const openEditId = pendingOpenEditIdRef.current;
    if (openEditId) {
      const target = filtered.find((e) => e.id === openEditId);
      if (target) {
        setEditExpense(target);
        pendingOpenEditIdRef.current = null;
      }
    }
    const highlightId = pendingHighlightIdRef.current;
    if (highlightId) {
      const target = filtered.find((e) => e.id === highlightId);
      if (target) {
        setExpenseForActions(target);
        pendingHighlightIdRef.current = null;
      }
    }
  }, [filtered]);

  return (
    <div className="flex flex-col min-h-0 flex-1 overflow-hidden">
      <div className="mb-3 px-4 md:px-0 pt-4 md:pt-0 shrink-0 bg-background/95 md:bg-transparent backdrop-blur md:backdrop-blur-none">
        <DsSectionHeader
          title={t("transactions.title")}
          subtitle={t("transactions.subtitle")}
          actions={
            <div className="hidden md:block">
              <TransactionsToolbar
                onOpenFilters={() => setFiltersPopupOpen(true)}
                onAddTransaction={() => setAddTransactionOpen(true)}
                hasActiveFilters={hasActiveFilters}
                t={t}
              />
            </div>
          }
        />
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
              t={t}
            />

            <div className="flex-1">
              {filtered.length === 0 ? (
                <DsEmptyState
                  icon={<Receipt className="size-8" />}
                  title={t("transactions.noTransactions")}
                  className="py-12"
                />
              ) : (
                <>
                  <div className="hidden md:block">
                    <ExpensesByMonthTable
                      byMonth={byMonth}
                      defaultOpenMonth={defaultOpenMonth}
                      sortBy={sortBy}
                      sortDir={sortDir}
                      onSort={toggleSort}
                      onExpenseTap={setExpenseForActions}
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

      <DsActionBar>
            <Button
              variant="secondary"
              density="compact"
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
              density="compact"
             
              className="h-11 w-11 rounded-full p-0"
              aria-label={t("common.add")}
            >
              <Plus className="size-4" />
            </Button>
      </DsActionBar>

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
    </div>
  );
}
