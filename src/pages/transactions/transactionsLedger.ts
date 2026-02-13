import type { Expense, OwnerTransfer } from "@/types";
import type { SortColumn, TransactionLedgerRow } from "@/types";
import { isValidDate } from "@/lib/totals";
import { isMortgageCategory } from "@/lib/mortgageCategory";

export type TransactionTypeFilter = "all" | "expense" | "transfer";

export interface TransactionFilterState {
  monthFilter: string;
  sourceFilter: string;
  categoryFilter: string;
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
  if (owners.length > 0) return owners;

  const fromExpenses = [
    ...new Set(expenses.map((e) => e.owner).filter((m): m is string => !!m)),
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
}: {
  rows: TransactionLedgerRow[];
  filters: TransactionFilterState;
  sortBy: SortColumn;
  sortDir: "asc" | "desc";
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

  if (categoryFilter) {
    if (categoryFilter === "__uncategorized") {
      list = list.filter((row) => row.kind === "expense" && !row.category);
    } else {
      list = list.filter((row) => row.kind === "expense" && row.category === categoryFilter);
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
      filters.categoryFilter ||
      filters.searchFilter.trim() ||
      filters.ownerFilter !== "all" ||
      filters.typeFilter !== "all",
  );
}
