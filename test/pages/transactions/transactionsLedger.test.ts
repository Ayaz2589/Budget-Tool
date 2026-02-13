import { expect, test } from "bun:test";
import {
  buildOwnerOptions,
  buildTransactionRows,
  filterAndSortTransactionRows,
  getDefaultOpenMonth,
  groupTransactionsByMonth,
  hasActiveTransactionFilters,
} from "@/pages/transactions/transactionsLedger";

const expenses = [
  {
    id: "e1",
    date: "2026-01-10",
    amount: 100,
    description: "Groceries",
    category: "Food",
    source: "amex" as const,
    owner: "Ayaz",
  },
  {
    id: "e2",
    date: "2026-01-12",
    amount: 200,
    description: "Mortgage",
    category: "Mortgage",
    source: "manual" as const,
  },
];

const transfers = [
  {
    id: "t1",
    date: "2026-01-15",
    fromOwner: "Tasnuva",
    toOwner: "Ayaz",
    amount: 40,
    note: "Payback",
  },
];

test("buildTransactionRows omits mortgage expenses and includes owner transfers", () => {
  const rows = buildTransactionRows({
    expenses: expenses as any,
    ownerTransfers: transfers as any,
    transferCategoryLabel: "Transfer",
  });

  expect(rows).toHaveLength(2);
  expect(rows.some((row) => row.kind === "expense")).toBe(true);
  expect(rows.some((row) => row.kind === "owner-transfer")).toBe(true);
});

test("filterAndSortTransactionRows filters by type and owner", () => {
  const rows = buildTransactionRows({
    expenses: expenses as any,
    ownerTransfers: transfers as any,
    transferCategoryLabel: "Transfer",
  });

  const filtered = filterAndSortTransactionRows({
    rows,
    filters: {
      monthFilter: "2026-01",
      sourceFilter: "all",
      categoryFilter: "",
      searchFilter: "payback",
      ownerFilter: "Ayaz",
      typeFilter: "transfer",
    },
    sortBy: "date",
    sortDir: "desc",
  });

  expect(filtered).toHaveLength(1);
  expect(filtered[0]?.kind).toBe("owner-transfer");
});

test("buildOwnerOptions falls back to expenses and transfers", () => {
  const options = buildOwnerOptions({
    owners: [],
    expenses: expenses as any,
    ownerTransfers: transfers as any,
  });

  expect(options).toEqual(["Ayaz", "Tasnuva"]);
});

test("groupTransactionsByMonth and default month helpers work", () => {
  const grouped = groupTransactionsByMonth([
    {
      kind: "expense",
      id: "e1",
      date: "2026-02-01",
      amount: 10,
      description: "A",
      source: "manual",
    },
    {
      kind: "expense",
      id: "e2",
      date: "2026-01-01",
      amount: 20,
      description: "B",
      source: "manual",
    },
  ] as any);

  expect(grouped[0]?.[0]).toBe("2026-02");
  expect(
    getDefaultOpenMonth({
      byMonth: grouped,
      currentMonthKey: "2026-03",
    }),
  ).toBe("2026-02");
});

test("hasActiveTransactionFilters detects active filter values", () => {
  expect(
    hasActiveTransactionFilters({
      monthFilter: "",
      sourceFilter: "all",
      categoryFilter: "",
      searchFilter: "",
      ownerFilter: "all",
      typeFilter: "all",
    }),
  ).toBe(false);

  expect(
    hasActiveTransactionFilters({
      monthFilter: "2026-01",
      sourceFilter: "all",
      categoryFilter: "",
      searchFilter: "",
      ownerFilter: "all",
      typeFilter: "all",
    }),
  ).toBe(true);
});
