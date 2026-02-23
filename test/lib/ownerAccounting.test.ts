import { expect, test, describe } from "bun:test";
import {
  buildOwnerBalances,
  isSharedExpenseByAllocation,
  normalizeExpenseAllocation,
  resolveExpensePaidByOwner,
} from "@/lib/domain/ownerAccounting";
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

// --- normalizeExpenseAllocation edge cases ---

describe("normalizeExpenseAllocation edge cases", () => {
  test("single owner: full amount attributed to paidByOwner", () => {
    const allocation = normalizeExpenseAllocation(
      expense({
        amount: 250,
        paidByOwner: "Ayaz",
        allocationMode: "single",
      }),
      ["Ayaz", "Tasnuva"],
    );
    expect(allocation).toEqual([{ owner: "Ayaz", amount: 250 }]);
  });

  test("equal split with 2 owners", () => {
    const allocation = normalizeExpenseAllocation(
      expense({
        amount: 100,
        paidByOwner: "Ayaz",
        allocationMode: "equal",
      }),
      ["Ayaz", "Tasnuva"],
    );
    expect(allocation).toEqual([
      { owner: "Ayaz", amount: 50 },
      { owner: "Tasnuva", amount: 50 },
    ]);
  });

  test("equal split with 4 owners handles rounding", () => {
    const allocation = normalizeExpenseAllocation(
      expense({
        amount: 100,
        paidByOwner: "A",
        allocationMode: "equal",
      }),
      ["A", "B", "C", "D"],
    );

    // 100/4 = 25, should be exact
    expect(allocation).toEqual([
      { owner: "A", amount: 25 },
      { owner: "B", amount: 25 },
      { owner: "C", amount: 25 },
      { owner: "D", amount: 25 },
    ]);
    const total = allocation.reduce((sum, row) => sum + row.amount, 0);
    expect(total).toBe(100);
  });

  test("equal split with odd amount among 3 owners sums exactly to total", () => {
    const allocation = normalizeExpenseAllocation(
      expense({
        amount: 10,
        paidByOwner: "A",
        allocationMode: "equal",
      }),
      ["A", "B", "C"],
    );

    const total = allocation.reduce((sum, row) => sum + row.amount, 0);
    expect(total).toBe(10);
    expect(allocation.length).toBe(3);
  });

  test("custom allocation with 100% to one owner", () => {
    const allocation = normalizeExpenseAllocation(
      expense({
        amount: 75,
        allocationMode: "custom",
        allocation: [{ owner: "Tasnuva", percent: 100 }],
      }),
      ["Ayaz", "Tasnuva"],
    );
    expect(allocation).toEqual([{ owner: "Tasnuva", amount: 75 }]);
  });

  test("missing allocation data defaults to paidByOwner", () => {
    const allocation = normalizeExpenseAllocation(
      expense({
        amount: 100,
        paidByOwner: "Ayaz",
      }),
      ["Ayaz", "Tasnuva"],
    );
    // No allocation array, no allocationMode, falls back to paidByOwner
    expect(allocation).toEqual([{ owner: "Ayaz", amount: 100 }]);
  });

  test("no owner and no allocation returns unassigned", () => {
    const allocation = normalizeExpenseAllocation(
      expense({
        amount: 50,
        owner: undefined,
        paidByOwner: undefined,
      }),
      ["Ayaz", "Tasnuva"],
    );
    expect(allocation.length).toBe(1);
    expect(allocation[0]!.isUnassigned).toBe(true);
    expect(allocation[0]!.amount).toBe(50);
  });

  test("zero amount returns empty allocation", () => {
    const allocation = normalizeExpenseAllocation(
      expense({ amount: 0 }),
      ["Ayaz", "Tasnuva"],
    );
    expect(allocation).toEqual([]);
  });

  test("negative amount returns empty allocation", () => {
    const allocation = normalizeExpenseAllocation(
      expense({ amount: -50 }),
      ["Ayaz", "Tasnuva"],
    );
    expect(allocation).toEqual([]);
  });

  test("50/50 category triggers equal split for 2 owners", () => {
    const allocation = normalizeExpenseAllocation(
      expense({
        amount: 80,
        category: "50/50",
        paidByOwner: "Ayaz",
      }),
      ["Ayaz", "Tasnuva"],
    );
    expect(allocation).toEqual([
      { owner: "Ayaz", amount: 40 },
      { owner: "Tasnuva", amount: 40 },
    ]);
  });

  test("allocation with empty owner entries are filtered out", () => {
    const allocation = normalizeExpenseAllocation(
      expense({
        amount: 100,
        allocation: [
          { owner: "", percent: 50 },
          { owner: "Ayaz", percent: 50 },
        ],
      }),
      ["Ayaz"],
    );
    // Empty owner is filtered; only Ayaz remains and gets scaled to 100
    expect(allocation.length).toBe(1);
    expect(allocation[0]!.owner).toBe("Ayaz");
    expect(allocation[0]!.amount).toBe(100);
  });
});

// --- isSharedExpenseByAllocation edge cases ---

describe("isSharedExpenseByAllocation edge cases", () => {
  test("empty allocation array is not shared", () => {
    expect(isSharedExpenseByAllocation([])).toBe(false);
  });

  test("single unassigned entry is not shared", () => {
    expect(
      isSharedExpenseByAllocation([
        { owner: "__unassigned__", amount: 100, isUnassigned: true },
      ]),
    ).toBe(false);
  });

  test("unassigned plus one real owner is not shared", () => {
    expect(
      isSharedExpenseByAllocation([
        { owner: "__unassigned__", amount: 50, isUnassigned: true },
        { owner: "Ayaz", amount: 50 },
      ]),
    ).toBe(false);
  });

  test("two real owners is shared", () => {
    expect(
      isSharedExpenseByAllocation([
        { owner: "Ayaz", amount: 50 },
        { owner: "Tasnuva", amount: 50 },
      ]),
    ).toBe(true);
  });

  test("three real owners is shared", () => {
    expect(
      isSharedExpenseByAllocation([
        { owner: "A", amount: 30 },
        { owner: "B", amount: 30 },
        { owner: "C", amount: 40 },
      ]),
    ).toBe(true);
  });

  test("same owner listed twice counts as one (not shared)", () => {
    expect(
      isSharedExpenseByAllocation([
        { owner: "Ayaz", amount: 50 },
        { owner: "Ayaz", amount: 50 },
      ]),
    ).toBe(false);
  });
});

// --- buildOwnerBalances edge cases ---

describe("buildOwnerBalances edge cases", () => {
  test("empty expenses and transfers produce zero balances", () => {
    const rows = buildOwnerBalances({
      expenses: [],
      owners: ["Ayaz", "Tasnuva"],
    });
    expect(rows.length).toBe(2);
    for (const row of rows) {
      expect(row.paid).toBe(0);
      expect(row.allocated).toBe(0);
      expect(row.sent).toBe(0);
      expect(row.received).toBe(0);
      expect(row.balance).toBe(0);
    }
  });

  test("single owner with all expenses attributed to them", () => {
    const rows = buildOwnerBalances({
      expenses: [
        expense({ id: "e1", amount: 100, paidByOwner: "Ayaz" }),
        expense({ id: "e2", amount: 200, paidByOwner: "Ayaz" }),
      ],
      owners: ["Ayaz"],
    });
    expect(rows.length).toBe(1);
    expect(rows[0]!.paid).toBe(300);
    expect(rows[0]!.allocated).toBe(300);
    expect(rows[0]!.balance).toBe(0);
  });

  test("transfers from owner not in initial owners list are still tracked", () => {
    const rows = buildOwnerBalances({
      expenses: [],
      owners: ["Ayaz"],
      transfers: [
        {
          id: "t1",
          date: "2026-01-01",
          fromOwner: "NewPerson",
          toOwner: "Ayaz",
          amount: 50,
        },
      ],
    });
    const byOwner = new Map(rows.map((r) => [r.owner, r]));
    expect(byOwner.has("NewPerson")).toBe(true);
    expect(byOwner.get("NewPerson")!.sent).toBe(50);
    expect(byOwner.get("Ayaz")!.received).toBe(50);
  });

  test("balance sums to zero for properly balanced expenses", () => {
    const rows = buildOwnerBalances({
      expenses: [
        expense({
          id: "e1",
          amount: 100,
          paidByOwner: "Ayaz",
          allocationMode: "equal",
        }),
      ],
      owners: ["Ayaz", "Tasnuva"],
    });

    const totalBalance = rows.reduce((sum, row) => sum + row.balance, 0);
    expect(totalBalance).toBe(0);
  });

  test("rows are sorted by balance descending", () => {
    const rows = buildOwnerBalances({
      expenses: [
        expense({
          id: "e1",
          amount: 200,
          paidByOwner: "A",
          allocationMode: "equal",
        }),
      ],
      owners: ["A", "B"],
    });
    // A paid 200, allocated 100 => balance 100
    // B paid 0, allocated 100 => balance -100
    expect(rows[0]!.owner).toBe("A");
    expect(rows[0]!.balance).toBe(100);
    expect(rows[1]!.owner).toBe("B");
    expect(rows[1]!.balance).toBe(-100);
  });
});
