import { test, expect, mock, beforeEach, afterEach } from "bun:test";
import {
  extractSpreadsheetId,
  getSheetValues,
  readExpensesFromSheet,
  readIncomeFromSheet,
  syncAllSheetsBatch,
} from "@/lib/googleSheets";
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

test("getSheetValues throws with status on read failure", async () => {
  const fetchMock = mock(() =>
    Promise.resolve(new Response("forbidden", { status: 403 }))
  );
  globalThis.fetch = fetchMock as unknown as typeof fetch;

  await expect(
    getSheetValues("token", "sheet-123", "Expenses!A2:G")
  ).rejects.toThrow(/Sheets read failed: 403/i);
});

test("readExpensesFromSheet parses modern rows with id and owner", async () => {
  const fetchMock = mock(() =>
    Promise.resolve(
      new Response(
        JSON.stringify({
          values: [
            ["e1", "2026-02-06", "10.5", "Coffee", "Food", "manual", "Ayaz"],
          ],
        }),
        { status: 200 }
      )
    )
  );
  globalThis.fetch = fetchMock as unknown as typeof fetch;

  const expenses = await readExpensesFromSheet("token", "sheet-123");
  expect(expenses).toHaveLength(1);
  expect(expenses[0]).toMatchObject({
    id: "e1",
    date: "2026-02-06",
    amount: 10.5,
    description: "Coffee",
    category: "Food",
    source: "manual",
    owner: "Ayaz",
  });
});

test("readIncomeFromSheet normalizes Uncategorized to empty category", async () => {
  const fetchMock = mock(() =>
    Promise.resolve(
      new Response(
        JSON.stringify({
          values: [["2026-02-06", "1000", "Paycheck", "Uncategorized", "Ayaz"]],
        }),
        { status: 200 }
      )
    )
  );
  globalThis.fetch = fetchMock as unknown as typeof fetch;

  const income = await readIncomeFromSheet("token", "sheet-123");
  expect(income).toHaveLength(1);
  expect(income[0]?.category).toBe("");
  expect(income[0]?.owner).toBe("Ayaz");
});
