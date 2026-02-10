import { useState, useMemo, useCallback, useEffect, useRef } from "react";
import { useTranslation } from "react-i18next";
import { useLocation } from "react-router-dom";
import { useBudget } from "@/context/BudgetContext";
import type { Expense } from "@/lib/types";
import type { OwnerTransfer } from "@/types/core";
import { isValidDate } from "@/lib/totals";
import { isMortgageCategory } from "@/lib/mortgageCategory";
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
import type { TransactionLedgerRow } from "@/types/transactions";
import { TransferActionsDialog } from "./TransferActionsDialog";
import { EditTransferDialog } from "./EditTransferDialog";

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
  const [categoryFilter, setCategoryFilter] = useState<string>("");
  const [searchFilter, setSearchFilter] = useState<string>("");
  const [ownerFilter, setOwnerFilter] = useState<string>("all");
  const [typeFilter, setTypeFilter] = useState<"all" | "expense" | "transfer">("all");
  const [includeOwnerTransfersInTotals, setIncludeOwnerTransfersInTotals] = useState(true);
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

  const ownerOptions = useMemo(() => {
    if (owners.length > 0) return owners;
    const fromExpenses = [
      ...new Set(
        expenses.map((e) => e.owner).filter((m): m is string => !!m),
      ),
    ].sort();
    const fromTransfers = [
      ...new Set(
        ownerTransfers
          .flatMap((row) => [row.fromOwner, row.toOwner])
          .filter((name): name is string => !!name),
      ),
    ].sort();
    return Array.from(new Set([...fromExpenses, ...fromTransfers])).sort((a, b) =>
      a.localeCompare(b),
    );
  }, [owners, expenses, ownerTransfers]);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    setMonthFilter(params.get("month") ?? "");
    setSourceFilter(params.get("source") ?? "all");
    setCategoryFilter(params.get("category") ?? "");
    setOwnerFilter(params.get("owner") ?? "all");
    const nextType = params.get("type");
    setTypeFilter(
      nextType === "expense" || nextType === "transfer" ? nextType : "all",
    );
    pendingHighlightIdRef.current = params.get("highlight");
    pendingOpenEditIdRef.current = params.get("openEdit");
  }, [location.search]);

  const filtered = useMemo(() => {
    const expenseRows: TransactionLedgerRow[] = expenses
      .filter((e) => isValidDate(e.date))
      .filter((e) => !isMortgageCategory(e.category))
      .map((e) => ({
        kind: "expense",
        id: e.id,
        date: e.date,
        amount: e.amount,
        description: e.description || "—",
        source: e.source,
        owner: e.owner,
        category: e.category,
        expense: e,
      }));
    const transferRows: TransactionLedgerRow[] = ownerTransfers
      .filter((row) => isValidDate(row.date))
      .map((row) => ({
        kind: "owner-transfer",
        id: row.id,
        date: row.date,
        amount: row.amount,
        description: `${row.fromOwner} → ${row.toOwner}`,
        source: "manual",
        owner: row.fromOwner,
        category: t("transactions.typeTransfer"),
        transferFromOwner: row.fromOwner,
        transferToOwner: row.toOwner,
        transferNote: row.note,
        transfer: row,
      }));

    let list = [...expenseRows, ...transferRows];
    if (monthFilter) {
      list = list.filter((row) => row.date.startsWith(monthFilter));
    }
    if (sourceFilter && sourceFilter !== "all") {
      list = list.filter((row) => row.kind !== "expense" || row.source === sourceFilter);
    }
    if (categoryFilter) {
      if (categoryFilter === "__uncategorized") {
        list = list.filter((row) => row.kind === "expense" && !row.category);
      } else {
        list = list.filter(
          (row) => row.kind === "expense" && row.category === categoryFilter,
        );
      }
    }
    if (searchFilter.trim()) {
      const q = searchFilter.trim().toLowerCase();
      list = list.filter((row) => {
        if (row.kind === "owner-transfer") {
          const desc = `${row.transferFromOwner ?? ""} ${row.transferToOwner ?? ""} ${
            row.transferNote ?? ""
          }`.toLowerCase();
          return desc.includes(q);
        }
        return row.description.toLowerCase().includes(q);
      });
    }
    if (typeFilter === "expense") {
      list = list.filter((row) => row.kind === "expense");
    } else if (typeFilter === "transfer") {
      list = list.filter((row) => row.kind === "owner-transfer");
    }
    if (ownerFilter && ownerFilter !== "all") {
      if (ownerFilter === "_none") {
        list = list.filter((row) => row.kind === "expense" && !row.owner);
      } else if (ownerFilter === "_shared") {
        list = list.filter((row) => {
          if (row.kind !== "expense") return false;
          return (row.category || "").trim().toLowerCase() === "50/50" || !row.owner;
        });
      } else {
        list = list.filter((row) => {
          if (row.kind === "owner-transfer") {
            return row.transferFromOwner === ownerFilter || row.transferToOwner === ownerFilter;
          }
          return (row.owner ?? "") === ownerFilter;
        });
      }
    }
    const cmp = sortDir === "asc" ? 1 : -1;
    list.sort((a: TransactionLedgerRow, b: TransactionLedgerRow) => {
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
          diff = (a.category || "").localeCompare(b.category || "");
          break;
        case "owner":
          diff = (a.owner || "").localeCompare(b.owner || "");
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
    typeFilter,
    sortBy,
    sortDir,
    ownerTransfers,
    t,
  ]);

  const byMonth = useMemo(() => {
    const map = new Map<string, TransactionLedgerRow[]>();
    for (const row of filtered) {
      const key = row.date.slice(0, 7);
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(row);
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
    ownerFilter !== "all" ||
    typeFilter !== "all",
  );

  const clearFilters = useCallback(() => {
    setMonthFilter("");
    setSourceFilter("all");
    setCategoryFilter("");
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
                    />
                  </div>
                  <div className="md:hidden">
                    <ExpensesByMonthList
                      byMonth={byMonth}
                      defaultOpenMonth={defaultOpenMonth}
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
