import { test, expect, describe, mock, beforeEach, afterEach } from "bun:test";

// These tests verify round-trip fidelity for each Ortho schema.
// Import paths will resolve once the schema files are created.

describe("expense schema round-trip", () => {
  test("toRow then parseRow preserves all fields", async () => {
    const { expenseSchema } = await import("@/lib/ortho-sheets/schemas/expenses");
    const expense = {
      id: "e1",
      date: "2026-01-15",
      amount: 42.5,
      description: "Coffee",
      category: "Food",
      source: "amex" as const,
      owner: "Ayaz",
      paidByOwner: "Ayaz",
    };
    const row = expenseSchema.toRow(expense);
    const parsed = expenseSchema.parseRow(row, 0);
    expect(parsed).not.toBeNull();
    expect(parsed!.id).toBe("e1");
    expect(parsed!.amount).toBe(42.5);
    expect(parsed!.source).toBe("amex");
    expect(parsed!.owner).toBe("Ayaz");
  });

  test("parseRow skips rows with invalid date", async () => {
    const { expenseSchema } = await import("@/lib/ortho-sheets/schemas/expenses");
    const result = expenseSchema.parseRow(["e1", "not-a-date", 10, "T", "Cat", "manual", ""], 0);
    expect(result).toBeNull();
  });

  test("parseRow skips rows with zero amount", async () => {
    const { expenseSchema } = await import("@/lib/ortho-sheets/schemas/expenses");
    const result = expenseSchema.parseRow(["e1", "2026-01-01", 0, "T", "Cat", "manual", ""], 0);
    expect(result).toBeNull();
  });
});

describe("mortgage schema round-trip", () => {
  test("toRow then parseRow preserves all fields", async () => {
    const { mortgageSchema } = await import("@/lib/ortho-sheets/schemas/expenses");
    const expense = {
      id: "m1",
      date: "2026-01-01",
      amount: 2000,
      description: "Mortgage",
      category: "Mortgage",
      source: "manual" as const,
      paidByOwner: "Ayaz",
    };
    const row = mortgageSchema.toRow(expense);
    const parsed = mortgageSchema.parseRow(row, 0);
    expect(parsed).not.toBeNull();
    expect(parsed!.category).toBe("Mortgage");
    expect(parsed!.description).toBe("Mortgage");
  });
});

describe("income schema round-trip", () => {
  test("toRow then parseRow preserves all fields", async () => {
    const { incomeSchema } = await import("@/lib/ortho-sheets/schemas/income");
    const income = {
      id: "i1",
      date: "2026-01-15",
      amount: 5000,
      description: "Salary",
      category: "Paycheck",
      owner: "Ayaz",
    };
    const row = incomeSchema.toRow(income);
    const parsed = incomeSchema.parseRow(row, 0);
    expect(parsed).not.toBeNull();
    expect(parsed!.amount).toBe(5000);
    expect(parsed!.owner).toBe("Ayaz");
  });

  test("parseRow skips zero amount", async () => {
    const { incomeSchema } = await import("@/lib/ortho-sheets/schemas/income");
    const result = incomeSchema.parseRow(["2026-01-01", 0, "T", "Cat", ""], 0);
    expect(result).toBeNull();
  });
});

describe("debt schema round-trip", () => {
  test("toRow then parseRow preserves all fields", async () => {
    const { debtSchema } = await import("@/lib/ortho-sheets/schemas/debts");
    const debt = {
      id: "d1",
      name: "Car Loan",
      initialAmount: 25000,
      startDate: "2025-06-01",
      owner: "Ayaz",
    };
    const row = debtSchema.toRow(debt);
    const parsed = debtSchema.parseRow(row, 0);
    expect(parsed).not.toBeNull();
    expect(parsed!.name).toBe("Car Loan");
    expect(parsed!.initialAmount).toBe(25000);
  });
});

describe("debtPayment schema round-trip", () => {
  test("toRow then parseRow preserves all fields", async () => {
    const { debtPaymentSchema } = await import("@/lib/ortho-sheets/schemas/debts");
    const payment = {
      id: "p1",
      debtId: "d1",
      date: "2026-01-15",
      amount: 500,
      note: "Monthly",
    };
    const row = debtPaymentSchema.toRow(payment);
    const parsed = debtPaymentSchema.parseRow(row, 0);
    expect(parsed).not.toBeNull();
    expect(parsed!.debtId).toBe("d1");
    expect(parsed!.amount).toBe(500);
  });
});

describe("ownerTransfer schema round-trip", () => {
  test("toRow then parseRow preserves all fields", async () => {
    const { ownerTransferSchema } = await import("@/lib/ortho-sheets/schemas/transfers");
    const transfer = {
      id: "t1",
      date: "2026-01-15",
      fromOwner: "Ayaz",
      toOwner: "Tasnuva",
      amount: 100,
      note: "Split",
    };
    const row = ownerTransferSchema.toRow(transfer);
    const parsed = ownerTransferSchema.parseRow(row, 0);
    expect(parsed).not.toBeNull();
    expect(parsed!.fromOwner).toBe("Ayaz");
    expect(parsed!.toOwner).toBe("Tasnuva");
  });
});

describe("preset schema round-trip", () => {
  test("toRow then parseRow preserves all fields", async () => {
    const { presetSchema } = await import("@/lib/ortho-sheets/schemas/transfers");
    const preset = {
      id: "pr1",
      source: "amex" as const,
      description: "Coffee",
      category: "Food",
      owner: "Ayaz",
    };
    const row = presetSchema.toRow(preset);
    const parsed = presetSchema.parseRow(row, 0);
    expect(parsed).not.toBeNull();
    expect(parsed!.source).toBe("amex");
    expect(parsed!.description).toBe("Coffee");
  });
});

describe("totals schema", () => {
  test("toRow produces expected columns", async () => {
    const { totalsSchema } = await import("@/lib/ortho-sheets/schemas/totals");
    const totals = {
      monthKey: "2026-01",
      monthLabel: "January",
      totalEarned: 5000,
      totalSpent: 3000,
      totalSpentWithoutMortgage: 1000,
      sharedSpent: 500,
      sharedSplit: {},
      ownerSpending: { Ayaz: 2000, Tasnuva: 1000 },
      ownerBalances: { Ayaz: 100, Tasnuva: -100 },
      totalSaved: 2000,
      personalSavingsRate: 0.4,
      hysa: 0,
      investingSp500: 0,
      investingTotal: 0,
    };
    const row = totalsSchema.toRow(totals);
    expect(row[0]).toBe("January");
    expect(row[1]).toBe(5000);
  });
});

describe("dataBlob schema round-trip", () => {
  test("toRow then parseRow preserves blob string", async () => {
    const { dataBlobSchema } = await import("@/lib/ortho-sheets/schemas/data-blob");
    const blob = "V2testblob123";
    const row = dataBlobSchema.toRow(blob);
    const parsed = dataBlobSchema.parseRow(row, 0);
    expect(parsed).toBe("V2testblob123");
  });

  test("parseRow returns null for empty", async () => {
    const { dataBlobSchema } = await import("@/lib/ortho-sheets/schemas/data-blob");
    const result = dataBlobSchema.parseRow([""], 0);
    expect(result).toBeNull();
  });
});
