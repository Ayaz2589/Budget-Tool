import { test, expect, mock, beforeEach, afterEach } from "bun:test";
import { extractSpreadsheetId, syncAllSheetsBatch } from "@/lib/googleSheets";
import type { MonthTotals } from "@/types/totals";

test("extractSpreadsheetId extracts id from URL", () => {
  const url =
    "https://docs.google.com/spreadsheets/d/1abc_def-123/edit#gid=0";
  expect(extractSpreadsheetId(url)).toBe("1abc_def-123");
});

test("extractSpreadsheetId returns raw id when no /d/", () => {
  expect(extractSpreadsheetId("1abc_def-123")).toBe("1abc_def-123");
});

test("extractSpreadsheetId handles URL with path", () => {
  const url =
    "https://docs.google.com/spreadsheets/d/xyz789/view";
  expect(extractSpreadsheetId(url)).toBe("xyz789");
});

const okResponse = new Response(JSON.stringify({ ok: true }), { status: 200 });

beforeEach(() => {
  mock.restore();
});

afterEach(() => {
  mock.restore();
});

test("syncAllSheetsBatch uses batchClear and batchUpdate endpoints", async () => {
  const fetchMock = mock(() => Promise.resolve(okResponse.clone()));
  globalThis.fetch = fetchMock as unknown as typeof fetch;
  const monthTotals: MonthTotals = {
    monthKey: "2026-02",
    monthLabel: "February 2026",
    totalEarned: 1000,
    totalSpent: 500,
    totalSpentWithoutMortgage: 400,
    total5050Spent: 200,
    split5050: 100,
    novasPurchase: 50,
    novasTotalSpending: 250,
    iOweNova: 25,
    myTotalSpendingWithoutMortgage: 350,
    totalSaved: 500,
    personalSavingsRate: 0.5,
    hysa: 0,
    investingSp500: 0,
    investingTotal: 0,
  };

  await syncAllSheetsBatch("token", "sheet-123", {
    expenses: [],
    mortgageExpenses: [],
    income: [],
    debts: [],
    debtPayments: [],
    presetTransactions: [],
    dataBlob: "V2abc",
    months: [monthTotals],
    grandTotal: { ...monthTotals, monthKey: "grand", monthLabel: "Grand Total" },
  });

  expect(fetchMock).toHaveBeenCalledTimes(2);
  expect((fetchMock.mock.calls[0] as unknown[])[0]).toContain(
    "/values:batchClear"
  );
  expect((fetchMock.mock.calls[1] as unknown[])[0]).toContain(
    "/values:batchUpdate"
  );
});

test("syncAllSheetsBatch throws when batchClear fails", async () => {
  const fetchMock = mock(() =>
    Promise.resolve(new Response("rate limit", { status: 429 }))
  );
  globalThis.fetch = fetchMock as unknown as typeof fetch;
  const monthTotals: MonthTotals = {
    monthKey: "2026-02",
    monthLabel: "February 2026",
    totalEarned: 0,
    totalSpent: 0,
    totalSpentWithoutMortgage: 0,
    total5050Spent: 0,
    split5050: 0,
    novasPurchase: 0,
    novasTotalSpending: 0,
    iOweNova: 0,
    myTotalSpendingWithoutMortgage: 0,
    totalSaved: 0,
    personalSavingsRate: 0,
    hysa: 0,
    investingSp500: 0,
    investingTotal: 0,
  };

  await expect(
    syncAllSheetsBatch("token", "sheet-123", {
      expenses: [],
      mortgageExpenses: [],
      income: [],
      debts: [],
      debtPayments: [],
      presetTransactions: [],
      dataBlob: "V2abc",
      months: [monthTotals],
      grandTotal: { ...monthTotals, monthKey: "grand", monthLabel: "Grand Total" },
    })
  ).rejects.toThrow(/batch clear failed/i);
});
