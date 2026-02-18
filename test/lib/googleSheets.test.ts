import { test, expect, mock, beforeEach, afterEach } from "bun:test";
import {
  createSheetsClient,
  extractSpreadsheetId,
} from "@/lib/sheets-db";
import type { MonthTotals } from "@/lib/sheets-db";

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

test("batchSync uses batchClear and batchUpdate endpoints", async () => {
  const fetchMock = mock(() => Promise.resolve(okResponse.clone()));
  globalThis.fetch = fetchMock as unknown as typeof fetch;
  const monthTotals: MonthTotals = {
    monthKey: "2026-02",
    monthLabel: "February 2026",
    totalEarned: 1000,
    totalSpent: 500,
    totalSpentWithoutMortgage: 400,
    sharedSpent: 200,
    sharedSplit: { Ayaz: 100, Tasnuva: 100 },
    ownerSpending: { Ayaz: 350, Tasnuva: 50 },
    ownerBalances: { Ayaz: 25 },
    totalSaved: 500,
    personalSavingsRate: 0.5,
    hysa: 0,
    investingSp500: 0,
    investingTotal: 0,
  };

  const db = createSheetsClient({ token: "token", spreadsheetId: "sheet-123" });
  await db.batchSync({
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

test("batchSync throws when batchClear fails", async () => {
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

  const db = createSheetsClient({ token: "token", spreadsheetId: "sheet-123" });
  await expect(
    db.batchSync({
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
  ).rejects.toThrow(/rate limit/i);
});

test("expenses.readAll throws with status on read failure", async () => {
  const fetchMock = mock(() =>
    Promise.resolve(new Response("forbidden", { status: 403 }))
  );
  globalThis.fetch = fetchMock as unknown as typeof fetch;

  const db = createSheetsClient({ token: "token", spreadsheetId: "sheet-123" });
  await expect(db.expenses.readAll()).rejects.toThrow(/403/);
});

test("expenses.readAll parses modern rows with id and owner", async () => {
  const fetchMock = mock(() =>
    Promise.resolve(
      new Response(
        JSON.stringify({
          values: [
            ["id", "date", "amount", "description", "category", "source", "owner"],
            ["e1", "2026-02-06", "10.5", "Coffee", "Food", "manual", "Ayaz"],
          ],
        }),
        { status: 200 }
      )
    )
  );
  globalThis.fetch = fetchMock as unknown as typeof fetch;

  const db = createSheetsClient({ token: "token", spreadsheetId: "sheet-123" });
  const expenses = await db.expenses.readAll();
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

test("income.readAll normalizes Uncategorized to empty category", async () => {
  const fetchMock = mock(() =>
    Promise.resolve(
      new Response(
        JSON.stringify({
          values: [
            ["date", "amount", "description", "category", "owner"],
            ["2026-02-06", "1000", "Paycheck", "Uncategorized", "Ayaz"],
          ],
        }),
        { status: 200 }
      )
    )
  );
  globalThis.fetch = fetchMock as unknown as typeof fetch;

  const db = createSheetsClient({ token: "token", spreadsheetId: "sheet-123" });
  const income = await db.income.readAll();
  expect(income).toHaveLength(1);
  expect(income[0]?.category).toBe("");
  expect(income[0]?.owner).toBe("Ayaz");
});
