import { useState, useMemo, useCallback, useEffect, useRef } from "react";
import { useTranslation } from "react-i18next";
import { useLocation } from "react-router-dom";
import { useBudget } from "@/context";
import type { Expense, OwnerTransfer } from "@/types";
import { AddTransactionDialog } from "@/components/AddTransactionDialog";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, SlidersHorizontal } from "lucide-react";
import { DsActionBar, DsEmptyState, DsHelpTooltip, DsSectionHeader } from "@/components/ds";
import { TransactionsToolbar } from "./TransactionsToolbar";
import { FiltersAndActionsDialog } from "./FiltersAndActionsDialog";
import { SOURCE_LABEL_KEYS } from "@/lib/sourceLabels";
import { ExpensesByMonthTable, type SortColumn } from "./ExpensesByMonthTable";
import { ExpensesByMonthList } from "./ExpensesByMonthList";
import { ExpenseActionsDialog } from "./ExpenseActionsDialog";
import { EditTransactionDialog } from "./EditTransactionDialog";
import { DeleteOneTransactionDialog } from "./DeleteTransactionDialogs";
import { TransferActionsDialog } from "./TransferActionsDialog";
import { EditTransferDialog } from "./EditTransferDialog";
import {
  buildOwnerOptions,
  buildTransactionRows,
  filterAndSortTransactionRows,
  getDefaultOpenMonth,
  groupTransactionsByMonth,
  hasActiveTransactionFilters,
} from "./transactionsLedger";

export function TransactionsPage() {
  const { t } = useTranslation();
  const location = useLocation();
  const {
    expenses,
    ownerTransfers,
    updateExpense,
    removeExpense,
    updateOwnerTransfer,
    removeOwnerTransfer,
    expenseCategories,
    owners,
    cardSources,
  } = useBudget();
  const [monthFilter, setMonthFilter] = useState<string>("");
  const [sourceFilter, setSourceFilter] = useState<string>("all");
  const [categoryFilter, setCategoryFilter] = useState<string[]>([]);
  const [searchFilter, setSearchFilter] = useState<string>("");
  const [ownerFilter, setOwnerFilter] = useState<string>("all");
  const [typeFilter, setTypeFilter] = useState<"all" | "expense" | "transfer">("all");
  const [includeOwnerTransfersInTotals, setIncludeOwnerTransfersInTotals] = useState(false);
  const [sortBy, setSortBy] = useState<SortColumn>("date");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");
  const [deleteOneExpense, setDeleteOneExpense] = useState<Expense | null>(
    null,
  );
  const [editExpense, setEditExpense] = useState<Expense | null>(null);
  const [expenseForActions, setExpenseForActions] = useState<Expense | null>(
    null,
  );
  const [transferForActions, setTransferForActions] = useState<OwnerTransfer | null>(
    null,
  );
  const [editTransfer, setEditTransfer] = useState<OwnerTransfer | null>(null);
  const [filtersPopupOpen, setFiltersPopupOpen] = useState(false);
  const [addTransactionOpen, setAddTransactionOpen] = useState(false);
  const pendingHighlightIdRef = useRef<string | null>(null);
  const pendingOpenEditIdRef = useRef<string | null>(null);

  const ownerOptions = useMemo(
    () =>
      buildOwnerOptions({
        owners,
        expenses,
        ownerTransfers,
      }),
    [owners, expenses, ownerTransfers],
  );

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    setMonthFilter(params.get("month") ?? "");
    setSourceFilter(params.get("source") ?? "all");
    const categoryParam = params.get("category") ?? "";
    setCategoryFilter(categoryParam ? categoryParam.split(",") : []);
    setOwnerFilter(params.get("owner") ?? "all");
    const nextType = params.get("type");
    setTypeFilter(
      nextType === "expense" || nextType === "transfer" ? nextType : "all",
    );
    pendingHighlightIdRef.current = params.get("highlight");
    pendingOpenEditIdRef.current = params.get("openEdit");
    const tourSheet = params.get("tourSheet");
    setAddTransactionOpen(tourSheet === "transactions-add");
    setFiltersPopupOpen(tourSheet === "transactions-filters");
  }, [location.search]);

  const ledgerRows = useMemo(
    () =>
      buildTransactionRows({
        expenses,
        ownerTransfers,
        transferCategoryLabel: t("transactions.typeTransfer"),
      }),
    [expenses, ownerTransfers, t],
  );

  const filters = useMemo(
    () => ({
      monthFilter,
      sourceFilter,
      categoryFilter,
      searchFilter,
      ownerFilter,
      typeFilter,
    }),
    [monthFilter, sourceFilter, categoryFilter, searchFilter, ownerFilter, typeFilter],
  );

  const filtered = useMemo(
    () =>
      filterAndSortTransactionRows({
        rows: ledgerRows,
        filters,
        sortBy,
        sortDir,
        ownersForAllocation: ownerOptions,
      }),
    [
      ledgerRows,
      filters,
      sortBy,
      sortDir,
      ownerOptions,
    ],
  );

  const byMonth = useMemo(() => groupTransactionsByMonth(filtered), [filtered]);

  const currentMonthKey = new Date().toISOString().slice(0, 7);
  const defaultOpenMonth = useMemo(
    () =>
      getDefaultOpenMonth({
        byMonth,
        currentMonthKey,
      }),
    [byMonth, currentMonthKey],
  );

  const hasActiveFilters = useMemo(
    () => hasActiveTransactionFilters(filters),
    [filters],
  );

  const clearFilters = useCallback(() => {
    setMonthFilter("");
    setSourceFilter("all");
    setCategoryFilter([]);
    setSearchFilter("");
    setOwnerFilter("all");
    setTypeFilter("all");
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
      const target = filtered.find((row) => row.id === openEditId && row.kind === "expense");
      if (target?.expense) {
        setEditExpense(target.expense);
        pendingOpenEditIdRef.current = null;
      }
    }
    const highlightId = pendingHighlightIdRef.current;
    if (highlightId) {
      const target = filtered.find((row) => row.id === highlightId);
      if (target) {
        if (target.kind === "expense" && target.expense) {
          setExpenseForActions(target.expense);
        } else if (target.transfer) {
          setTransferForActions(target.transfer);
        }
        pendingHighlightIdRef.current = null;
      }
    }
  }, [filtered]);

  return (
    <div data-tour-page="transactions" className="flex flex-col min-h-0 flex-1 overflow-hidden">
      <div className="mb-3 px-4 md:px-0 pt-4 md:pt-0 shrink-0 bg-background/95 md:bg-transparent backdrop-blur md:backdrop-blur-none">
        <DsSectionHeader
          title={
            <span className="inline-flex items-center gap-1.5">
              {t("transactions.title")}
              <DsHelpTooltip
                content={t("transactions.help.page")}
                ariaLabel={t("common.help")}
              />
            </span>
          }
          subtitle={t("transactions.subtitle")}
          showCurrencyChip
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
      <div className="flex flex-1 flex-col pb-24 md:pb-0">
        <Card className="flex-1 min-h-0 flex flex-col overflow-hidden shrink-0 md:border-0 md:shadow-none md:rounded-none md:bg-transparent md:py-0">
        <CardContent data-tour="transactions-table" className="flex-1 min-h-0 flex flex-col overflow-hidden gap-0 px-0 pb-24 md:px-0 md:pb-0 md:gap-4 transactions-card-content">
            {expenses.length > 0 || ownerTransfers.length > 0 ? (
              <div className="px-4 pb-3 md:px-0">
                <Input
                  value={searchFilter}
                  onChange={(e) => setSearchFilter(e.target.value)}
                  placeholder={t("transactions.filterByDescription")}
                  className="h-11 w-full"
                  aria-label={t("transactions.searchDescription")}
                />
              </div>
            ) : null}
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
              typeFilter={typeFilter}
              onTypeFilterChange={setTypeFilter}
              includeOwnerTransfersInTotals={includeOwnerTransfersInTotals}
              onIncludeOwnerTransfersInTotalsChange={setIncludeOwnerTransfersInTotals}
              searchFilter={searchFilter}
              onSearchFilterChange={setSearchFilter}
              expenseCategories={expenseCategories}
              ownerOptions={ownerOptions}
              cardSources={cardSources}
              hasActiveFilters={hasActiveFilters}
              onClearFilters={clearFilters}
              t={t}
            />

            <div className="flex flex-1 flex-col">
              {filtered.length === 0 ? (
                <DsEmptyState
                  title={t("transactions.noTransactions")}
                  description={t("transactions.emptyStateHint")}
                  actions={
                    <>
                      <Button onClick={() => setAddTransactionOpen(true)}>
                        <Plus className="size-4" />
                        {t("common.add")}
                      </Button>
                    </>
                  }
                />
              ) : (
                <>
                  <div className="hidden md:block">
                    <ExpensesByMonthTable
                      byMonth={byMonth}
                      defaultOpenMonth={defaultOpenMonth}
                      includeOwnerTransfersInTotals={includeOwnerTransfersInTotals}
                      sortBy={sortBy}
                      sortDir={sortDir}
                      onSort={toggleSort}
                      onRowTap={(row) => {
                        if (row.kind === "owner-transfer" && row.transfer) {
                          setTransferForActions(row.transfer);
                        } else if (row.expense) {
                          setExpenseForActions(row.expense);
                        }
                      }}
                      sourceLabelKeys={SOURCE_LABEL_KEYS}
                      t={t}
                      onUpdateCategory={(id, category) => updateExpense(id, { category })}
                      onUpdateOwner={(id, owner) =>
                        updateExpense(id, {
                          owner: owner || undefined,
                          paidByOwner: owner || undefined,
                          allocationMode: owner ? "single" : undefined,
                          allocation: owner ? [{ owner, percent: 100 }] : undefined,
                        })
                      }
                      expenseCategories={expenseCategories}
                      ownerOptions={ownerOptions}
                    />
                  </div>
                  <div className="md:hidden">
                    <ExpensesByMonthList
                      byMonth={byMonth}
                      defaultOpenMonth={defaultOpenMonth}
                      includeOwnerTransfersInTotals={includeOwnerTransfersInTotals}
                      onRowTap={(row) => {
                        if (row.kind === "owner-transfer" && row.transfer) {
                          setTransferForActions(row.transfer);
                        } else if (row.expense) {
                          setExpenseForActions(row.expense);
                        }
                      }}
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
             
              className="rounded-full p-0"
              size="icon"
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
             
              className="rounded-full p-0"
              size="icon"
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
          updateExpense(id, {
            owner: owner || undefined,
            paidByOwner: owner || undefined,
            allocationMode: owner ? "single" : undefined,
            allocation: owner ? [{ owner, percent: 100 }] : undefined,
          })
        }
        onDelete={(e) => {
          setExpenseForActions(null);
          setDeleteOneExpense(e);
        }}
        expenseCategories={expenseCategories}
        ownerOptions={ownerOptions}
        t={t}
      />

      <TransferActionsDialog
        transfer={transferForActions}
        onClose={() => setTransferForActions(null)}
        onEdit={(transfer) => {
          setTransferForActions(null);
          setEditTransfer(transfer);
        }}
        onDelete={(transfer) => {
          removeOwnerTransfer(transfer.id);
          setTransferForActions(null);
        }}
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

      <EditTransferDialog
        transfer={editTransfer}
        onClose={() => setEditTransfer(null)}
        onSubmit={(id, updates) => updateOwnerTransfer(id, updates)}
        ownerOptions={ownerOptions}
        t={t}
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
