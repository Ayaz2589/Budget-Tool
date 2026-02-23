import type { Expense, OwnerTransfer } from "@/types";
import type { SortColumn, TransactionLedgerRow } from "@/types";
import { isValidDate } from "@/lib/domain/totals";
import { isMortgageCategory } from "@/lib/domain/mortgageCategory";
import {
  isSharedExpenseByAllocation,
  normalizeExpenseAllocation,
} from "@/lib/domain/ownerAccounting";
import {
  collectFinancialOwners,
  getOwnerAllocatedExpenseAmount,
  getSignedOwnerTransferAmount,
} from "@/lib/domain/financialModel";

export type TransactionTypeFilter = "all" | "expense" | "transfer";

export interface TransactionFilterState {
  monthFilter: string;
  sourceFilter: string;
  categoryFilter: string[];
  searchFilter: string;
  ownerFilter: string;
  typeFilter: TransactionTypeFilter;
}

export function buildOwnerOptions({
  owners,
  expenses,
  ownerTransfers,
}: {
  owners: string[];
  expenses: Expense[];
  ownerTransfers: OwnerTransfer[];
}): string[] {
  return collectFinancialOwners({
    owners,
    expenses,
    income: [],
    ownerTransfers,
  });
}

export function buildTransactionRows({
  expenses,
  ownerTransfers,
  transferCategoryLabel,
}: {
  expenses: Expense[];
  ownerTransfers: OwnerTransfer[];
  transferCategoryLabel: string;
}): TransactionLedgerRow[] {
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
      category: transferCategoryLabel,
      transferFromOwner: row.fromOwner,
      transferToOwner: row.toOwner,
      transferNote: row.note,
      transfer: row,
    }));

  return [...expenseRows, ...transferRows];
}

export function filterAndSortTransactionRows({
  rows,
  filters,
  sortBy,
  sortDir,
  ownersForAllocation = [],
}: {
  rows: TransactionLedgerRow[];
  filters: TransactionFilterState;
  sortBy: SortColumn;
  sortDir: "asc" | "desc";
  ownersForAllocation?: string[];
}): TransactionLedgerRow[] {
  const { monthFilter, sourceFilter, categoryFilter, searchFilter, ownerFilter, typeFilter } =
    filters;

  let list = [...rows];

  if (monthFilter) {
    list = list.filter((row) => row.date.startsWith(monthFilter));
  }

  if (sourceFilter && sourceFilter !== "all") {
    list = list.filter((row) => row.kind !== "expense" || row.source === sourceFilter);
  }

  if (categoryFilter.length > 0) {
    const hasUncategorized = categoryFilter.includes("__uncategorized");
    const namedCategories = categoryFilter.filter((c) => c !== "__uncategorized");
    list = list.filter((row) => {
      if (row.kind !== "expense") return false;
      if (hasUncategorized && !row.category) return true;
      if (namedCategories.length > 0 && namedCategories.includes(row.category ?? "")) return true;
      return false;
    });
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
        if (row.kind !== "expense" || !row.expense) return false;
        const allocation = normalizeExpenseAllocation(row.expense, ownersForAllocation);
        return isSharedExpenseByAllocation(allocation);
      });
    } else {
      list = list
        .map((row) => {
          if (row.kind === "owner-transfer") {
            if (!row.transfer) return null;
            const signedTransferAmount = getSignedOwnerTransferAmount({
              transfer: row.transfer,
              selectedOwner: ownerFilter,
            });
            if (signedTransferAmount == null) return null;
            return { ...row, amount: signedTransferAmount };
          }
          if (!row.expense) {
            return null;
          }
          const allocatedAmount = getOwnerAllocatedExpenseAmount({
            expense: row.expense,
            selectedOwner: ownerFilter,
            owners: ownersForAllocation,
          });
          if (allocatedAmount <= 0) return null;
          return {
            ...row,
            amount: allocatedAmount,
            owner: ownerFilter,
          };
        })
        .filter((row): row is TransactionLedgerRow => Boolean(row));
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
}

export function groupTransactionsByMonth(
  rows: TransactionLedgerRow[],
): [string, TransactionLedgerRow[]][] {
  const map = new Map<string, TransactionLedgerRow[]>();
  for (const row of rows) {
    const key = row.date.slice(0, 7);
    if (!map.has(key)) map.set(key, []);
    map.get(key)!.push(row);
  }
  return Array.from(map.entries()).sort((a, b) => b[0].localeCompare(a[0]));
}

export function getDefaultOpenMonth({
  byMonth,
  currentMonthKey,
}: {
  byMonth: [string, TransactionLedgerRow[]][];
  currentMonthKey: string;
}): string {
  return byMonth.some(([k]) => k === currentMonthKey)
    ? currentMonthKey
    : (byMonth[0]?.[0] ?? "");
}

export function hasActiveTransactionFilters(filters: TransactionFilterState): boolean {
  return Boolean(
    filters.monthFilter ||
      filters.sourceFilter !== "all" ||
      filters.categoryFilter.length > 0 ||
      filters.searchFilter.trim() ||
      filters.ownerFilter !== "all" ||
      filters.typeFilter !== "all",
  );
}
