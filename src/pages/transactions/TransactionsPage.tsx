import { useState, useMemo, useCallback } from "react";
import { useTranslation } from "react-i18next";
import { useBudget } from "@/context/BudgetContext";
import { useGoogleAuth } from "@/context/GoogleAuthContext";
import { usePresetTransactions } from "@/context/PresetTransactionsContext";
import { useRules } from "@/context/RulesContext";
import type { Expense } from "@/lib/types";
import { isValidDate } from "@/lib/totals";
import { cleanDescription } from "@/lib/parsers";
import { downloadTransactionsAndIncomePdf } from "@/lib/pdfExport";
import { getCategoryColor } from "@/lib/categoryColors";
import { AddTransactionDialog } from "@/components/AddTransactionDialog";
import { PageTourTrigger } from "@/components/PageTourTrigger";
import { transactionsTourSteps } from "@/lib/pageTourSteps";
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { SyncConfirmDialog } from "./SyncConfirmDialog";
import { TransactionsToolbar } from "./TransactionsToolbar";
import { FiltersAndActionsDialog } from "./FiltersAndActionsDialog";
import { SOURCE_LABEL_KEYS } from "@/lib/sourceLabels";
import { ExpensesByMonthTable, type SortColumn } from "./ExpensesByMonthTable";
import { ExpensesByMonthList } from "./ExpensesByMonthList";
import { ExpenseActionsDialog } from "./ExpenseActionsDialog";
import {
  DeleteOneTransactionDialog,
  DeleteSelectedTransactionsDialog,
  DeleteAllTransactionsDialog,
} from "./DeleteTransactionDialogs";

export function TransactionsPage() {
  const { t } = useTranslation();
  const {
    expenses,
    income,
    debts,
    debtPayments,
    updateExpense,
    removeExpense,
    removeExpenses,
    expenseCategories,
    incomeCategories,
    owners,
    cardSources,
  } = useBudget();
  const { isSignedIn, spreadsheetId, syncToSheets, syncStatus } =
    useGoogleAuth();
  const { rules } = useRules();
  const { presetTransactions } = usePresetTransactions();
  const [monthFilter, setMonthFilter] = useState<string>("");
  const [sourceFilter, setSourceFilter] = useState<string>("all");
  const [categoryFilter, setCategoryFilter] = useState<string>("");
  const [searchFilter, setSearchFilter] = useState<string>("");
  const [ownerFilter, setOwnerFilter] = useState<string>("all");
  const [sortBy, setSortBy] = useState<SortColumn>("date");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [deleteAllOpen, setDeleteAllOpen] = useState(false);
  const [deleteSelectedOpen, setDeleteSelectedOpen] = useState(false);
  const [deleteOneExpense, setDeleteOneExpense] = useState<Expense | null>(
    null,
  );
  const [expenseForActions, setExpenseForActions] = useState<Expense | null>(
    null,
  );
  const [filtersPopupOpen, setFiltersPopupOpen] = useState(false);
  const [addTransactionOpen, setAddTransactionOpen] = useState(false);
  const [syncConfirmOpen, setSyncConfirmOpen] = useState(false);

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

  const toggleSelect = useCallback((id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const toggleMonthSelection = useCallback((monthExpenses: Expense[]) => {
    setSelectedIds((prev) => {
      const ids = new Set(monthExpenses.map((e) => e.id));
      const allSelected =
        ids.size > 0 && [...ids].every((id: string) => prev.has(id));
      const next = new Set(prev);
      if (allSelected) ids.forEach((id) => next.delete(id));
      else ids.forEach((id) => next.add(id));
      return next;
    });
  }, []);

  const clearSelection = useCallback(() => setSelectedIds(new Set()), []);

  const someSelected = selectedIds.size > 0;

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

  const handleDownloadPdf = useCallback(() => {
    const expenseCategoriesWithColors = expenseCategories.map((name) => ({
      name,
      color: getCategoryColor(name, "expense"),
    }));
    const incomeCategoriesWithColors = incomeCategories.map((name) => ({
      name,
      color: getCategoryColor(name, "income"),
    }));
    downloadTransactionsAndIncomePdf(
      expenses,
      income,
      debts,
      debtPayments,
      rules,
      presetTransactions,
      expenseCategoriesWithColors,
      incomeCategoriesWithColors,
      owners,
      cardSources,
    );
  }, [
    expenses,
    income,
    debts,
    debtPayments,
    rules,
    presetTransactions,
    expenseCategories,
    incomeCategories,
    owners,
    cardSources,
  ]);

  return (
    <div className="flex flex-col min-h-0 flex-1 overflow-hidden">
      <div className="flex flex-wrap items-start justify-between gap-2 shrink-0 mb-4">
        <div className="space-y-1 min-w-0">
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-semibold">{t("transactions.title")}</h1>
            <PageTourTrigger pageId="transactions" steps={transactionsTourSteps} />
          </div>
          <p className="text-sm text-muted-foreground">{t("transactions.subtitle")}</p>
        </div>
      </div>
      <Card className="flex-1 min-h-0 flex flex-col overflow-hidden shrink-0">
        <CardHeader className="shrink-0">
          <CardTitle>{t("transactions.expenses")}</CardTitle>
          <CardDescription>{t("transactions.filterAndEdit")}</CardDescription>
          <CardAction data-tour="toolbar">
            <TransactionsToolbar
              onOpenFilters={() => setFiltersPopupOpen(true)}
              onAddTransaction={() => setAddTransactionOpen(true)}
              hasActiveFilters={hasActiveFilters}
              showSync={!!(isSignedIn && spreadsheetId)}
              syncStatus={syncStatus}
              onSync={() => setSyncConfirmOpen(true)}
              t={t}
            />
          </CardAction>
        </CardHeader>
        <CardContent className="flex-1 min-h-0 flex flex-col overflow-hidden gap-4">
          <SyncConfirmDialog
            open={syncConfirmOpen}
            onOpenChange={setSyncConfirmOpen}
            onConfirm={syncToSheets}
            t={t}
          />

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
            onDownloadPdf={handleDownloadPdf}
            someSelected={someSelected}
            selectedCount={selectedIds.size}
            onDeleteSelected={() => setDeleteSelectedOpen(true)}
            onClearSelection={clearSelection}
            expensesCount={expenses.length}
            onDeleteAll={() => setDeleteAllOpen(true)}
            t={t}
          />

          <div className="flex-1 min-h-0 overflow-auto border rounded-md" data-tour="expensesList">
            {filtered.length === 0 ? (
              <div className="text-center text-muted-foreground py-12 px-4">
                {t("transactions.noTransactions")}
              </div>
            ) : (
              <>
                <div className="hidden md:block">
                  <ExpensesByMonthTable
                    byMonth={byMonth}
                    defaultOpenMonth={defaultOpenMonth}
                    selectedIds={selectedIds}
                    onToggleSelect={toggleSelect}
                    onToggleMonthSelection={toggleMonthSelection}
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
                    onDeleteOne={setDeleteOneExpense}
                    sourceLabelKeys={SOURCE_LABEL_KEYS}
                    t={t}
                  />
                </div>
                <div className="md:hidden">
                  <ExpensesByMonthList
                    byMonth={byMonth}
                    defaultOpenMonth={defaultOpenMonth}
                    selectedIds={selectedIds}
                    onToggleSelect={toggleSelect}
                    onToggleMonthSelection={toggleMonthSelection}
                    onExpenseTap={setExpenseForActions}
                    t={t}
                  />
                </div>
              </>
            )}
          </div>
        </CardContent>
      </Card>

      <AddTransactionDialog
        open={addTransactionOpen}
        onOpenChange={setAddTransactionOpen}
      />

      <ExpenseActionsDialog
        expense={expenseForActions}
        onClose={() => setExpenseForActions(null)}
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

      <DeleteOneTransactionDialog
        expense={deleteOneExpense}
        onClose={() => setDeleteOneExpense(null)}
        onConfirm={handleDeleteOne}
        t={t}
      />

      <DeleteSelectedTransactionsDialog
        open={deleteSelectedOpen}
        onOpenChange={setDeleteSelectedOpen}
        count={selectedIds.size}
        onConfirm={handleDeleteSelected}
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
