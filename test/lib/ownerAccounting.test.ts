import { expect, test } from "bun:test";
import {
  buildOwnerBalances,
  isSharedExpenseByAllocation,
  normalizeExpenseAllocation,
  resolveExpensePaidByOwner,
} from "@/lib/ownerAccounting";
import type { Expense, OwnerTransfer } from "@/types/core";

function expense(overrides: Partial<Expense>): Expense {
  return {
    id: "expense-1",
    date: "2026-02-01",
    amount: 100,
    description: "Sample",
    category: "Other",
    source: "manual",
    ...overrides,
  };
}

test("resolveExpensePaidByOwner prefers paidByOwner over owner", () => {
  expect(
    resolveExpensePaidByOwner(
      expense({ owner: "OwnerA", paidByOwner: "OwnerB" }),
    ),
  ).toBe("OwnerB");
  expect(resolveExpensePaidByOwner(expense({ owner: "OwnerA" }))).toBe("OwnerA");
  expect(resolveExpensePaidByOwner(expense({ owner: "" }))).toBeUndefined();
});

test("normalizeExpenseAllocation scales mixed amount + percent allocation to full total", () => {
  const allocation = normalizeExpenseAllocation(
    expense({
      amount: 100,
      allocation: [
        { owner: "Ayaz", amount: 20 },
        { owner: "Tasnuva", percent: 100 },
      ],
    }),
    ["Ayaz", "Tasnuva"],
  );

  expect(allocation).toEqual([
    { owner: "Ayaz", amount: 20 },
    { owner: "Tasnuva", amount: 80 },
  ]);
  expect(allocation.reduce((sum, row) => sum + row.amount, 0)).toBe(100);
});

test("normalizeExpenseAllocation splits equal mode with rounding-safe totals", () => {
  const allocation = normalizeExpenseAllocation(
    expense({
      amount: 100,
      allocationMode: "equal",
      paidByOwner: "Ayaz",
    }),
    ["Ayaz", "Tasnuva", "Sam"],
  );

  expect(allocation).toEqual([
    { owner: "Ayaz", amount: 33.33 },
    { owner: "Tasnuva", amount: 33.33 },
    { owner: "Sam", amount: 33.34 },
  ]);
});

test("isSharedExpenseByAllocation flags multi-owner allocations", () => {
  expect(
    isSharedExpenseByAllocation([
      { owner: "Ayaz", amount: 50 },
      { owner: "Tasnuva", amount: 50 },
    ]),
  ).toBe(true);
  expect(isSharedExpenseByAllocation([{ owner: "Ayaz", amount: 100 }])).toBe(false);
});

test("buildOwnerBalances keeps accounting identity with transfers", () => {
  const expenses: Expense[] = [
    expense({
      id: "e1",
      amount: 200,
      category: "50/50",
      paidByOwner: "Ayaz",
    }),
    expense({
      id: "e2",
      amount: 60,
      category: "Tasnuva's Purchases",
      paidByOwner: "Tasnuva",
    }),
    expense({
      id: "e3",
      amount: 40,
      category: "Other",
    }),
  ];
  const transfers: OwnerTransfer[] = [
    {
      id: "t1",
      date: "2026-02-05",
      fromOwner: "Ayaz",
      toOwner: "Tasnuva",
      amount: 25,
    },
    {
      id: "t2",
      date: "2026-02-06",
      fromOwner: "Tasnuva",
      toOwner: "Ayaz",
      amount: 5,
    },
  ];

  const rows = buildOwnerBalances({
    expenses,
    owners: ["Ayaz", "Tasnuva"],
    transfers,
  });
  const byOwner = new Map(rows.map((row) => [row.owner, row]));

  expect(byOwner.get("Ayaz")).toEqual({
    owner: "Ayaz",
    paid: 200,
    allocated: 100,
    sent: 25,
    received: 5,
    balance: 80,
  });
  expect(byOwner.get("Tasnuva")).toEqual({
    owner: "Tasnuva",
    paid: 60,
    allocated: 160,
    sent: 5,
    received: 25,
    balance: -80,
  });

  const totalBalance = rows.reduce((sum, row) => sum + row.balance, 0);
  expect(totalBalance).toBe(0);
});
