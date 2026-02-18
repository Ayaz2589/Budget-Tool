import { test, expect, describe, mock, beforeEach, afterEach } from "bun:test";
import { createSheetsClient } from "@/lib/sheets-db/client";
import type { MonthTotals, SyncPayload } from "@/lib/sheets-db/types";

describe("createSheetsClient", () => {
  const client = createSheetsClient({ token: "test-token", spreadsheetId: "sheet-1" });

  test("returns object with all repository namespaces", () => {
    expect(client.expenses).toBeDefined();
    expect(client.income).toBeDefined();
    expect(client.debts).toBeDefined();
    expect(client.debtPayments).toBeDefined();
    expect(client.ownerTransfers).toBeDefined();
    expect(client.presets).toBeDefined();
    expect(client.totals).toBeDefined();
    expect(client.dataBlob).toBeDefined();
  });

  test("expenses repository has all methods", () => {
    expect(typeof client.expenses.readAll).toBe("function");
    expect(typeof client.expenses.readMortgage).toBe("function");
    expect(typeof client.expenses.writeAll).toBe("function");
    expect(typeof client.expenses.writeMortgage).toBe("function");
    expect(typeof client.expenses.append).toBe("function");
  });

  test("income repository has all methods", () => {
    expect(typeof client.income.readAll).toBe("function");
    expect(typeof client.income.writeAll).toBe("function");
    expect(typeof client.income.append).toBe("function");
  });

  test("debts repository has all methods", () => {
    expect(typeof client.debts.readAll).toBe("function");
    expect(typeof client.debts.writeAll).toBe("function");
  });

  test("debtPayments repository has all methods", () => {
    expect(typeof client.debtPayments.readAll).toBe("function");
    expect(typeof client.debtPayments.writeAll).toBe("function");
  });

  test("ownerTransfers repository has all methods", () => {
    expect(typeof client.ownerTransfers.readAll).toBe("function");
    expect(typeof client.ownerTransfers.writeAll).toBe("function");
  });

  test("presets repository has all methods", () => {
    expect(typeof client.presets.readAll).toBe("function");
    expect(typeof client.presets.writeAll).toBe("function");
  });

  test("totals repository has write method", () => {
    expect(typeof client.totals.write).toBe("function");
  });

  test("dataBlob repository has read and write methods", () => {
    expect(typeof client.dataBlob.read).toBe("function");
    expect(typeof client.dataBlob.write).toBe("function");
  });

  test("extractSpreadsheetId extracts id from URL", () => {
    const id = client.extractSpreadsheetId(
      "https://docs.google.com/spreadsheets/d/1abc_def-123/edit",
    );
    expect(id).toBe("1abc_def-123");
  });

  test("extractSpreadsheetId returns raw ID", () => {
    expect(client.extractSpreadsheetId("1abc_def-123")).toBe("1abc_def-123");
  });

  test("has batchSync method (stubbed)", () => {
    expect(typeof client.batchSync).toBe("function");
  });

  test("has ensureSchema method (stubbed)", () => {
    expect(typeof client.ensureSchema).toBe("function");
  });

  test("has getSheetIds method (stubbed)", () => {
    expect(typeof client.getSheetIds).toBe("function");
  });

  test("has applyFormatting method (stubbed)", () => {
    expect(typeof client.applyFormatting).toBe("function");
  });
});

// T027: Concurrency tests
describe("write mutex", () => {
  const emptyMonthTotals: MonthTotals = {
    monthKey: "2026-01",
    monthLabel: "January",
    totalEarned: 0,
    totalSpent: 0,
    totalSpentWithoutMortgage: 0,
    sharedSpent: 0,
    sharedSplit: {},
    ownerSpending: {},
    ownerBalances: {},
    totalSaved: 0,
    personalSavingsRate: 0,
    hysa: 0,
    investingSp500: 0,
    investingTotal: 0,
  };

  const payload: SyncPayload = {
    expenses: [],
    mortgageExpenses: [],
    income: [],
    debts: [],
    debtPayments: [],
    ownerTransfers: [],
    presetTransactions: [],
    months: [emptyMonthTotals],
    grandTotal: { ...emptyMonthTotals, monthKey: "grand", monthLabel: "Grand Total" },
    dataBlob: "V2test",
  };

  beforeEach(() => {
    mock.restore();
  });
  afterEach(() => {
    mock.restore();
  });

  test("two concurrent batchSync calls execute sequentially", async () => {
    const order: number[] = [];
    let callCount = 0;
    const fetchMock = mock(() => {
      callCount++;
      const current = callCount;
      return new Promise<Response>((resolve) => {
        setTimeout(() => {
          order.push(current);
          resolve(new Response(JSON.stringify({ ok: true }), { status: 200 }));
        }, current <= 2 ? 10 : 5);
      });
    });
    globalThis.fetch = fetchMock as unknown as typeof fetch;

    const client = createSheetsClient({ token: "tok", spreadsheetId: "sheet" });
    const p1 = client.batchSync(payload);
    const p2 = client.batchSync(payload);

    await Promise.all([p1, p2]);
    // Both should complete. With mutex, call 3 and 4 (second batchSync) must start AFTER calls 1 and 2 finish
    expect(fetchMock.mock.calls.length).toBe(4);
    // First two calls (batchClear + batchUpdate) should complete before second pair
    expect(order[0]).toBeLessThanOrEqual(2);
    expect(order[1]).toBeLessThanOrEqual(2);
  });
});
