import { test, expect, describe, mock, beforeEach, afterEach } from "bun:test";
import type { SyncPayload, MonthTotals } from "@/lib/sheets-db/types";
import { syncAllSheetsBatch } from "@/lib/sheets-db/sync";
import type { TransportContext } from "@/lib/sheets-db/transport";

const ctx: TransportContext = { token: "test-token", spreadsheetId: "sheet-1" };

const okResponse = () => new Response(JSON.stringify({ ok: true }), { status: 200 });

const emptyMonthTotals: MonthTotals = {
  monthKey: "2026-01",
  monthLabel: "January 2026",
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

const minPayload: SyncPayload = {
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

describe("syncAllSheetsBatch", () => {
  test("successful batch writes all sheets (batchClear + batchUpdate)", async () => {
    const calls: string[] = [];
    const fetchMock = mock((url: string) => {
      calls.push(url);
      return Promise.resolve(okResponse());
    });
    globalThis.fetch = fetchMock as unknown as typeof fetch;

    await syncAllSheetsBatch(ctx, minPayload);
    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(calls[0]).toContain("/values:batchClear");
    expect(calls[1]).toContain("/values:batchUpdate");
  });

  test("throws when batchClear fails", async () => {
    const fetchMock = mock(() =>
      Promise.resolve(new Response("rate limit", { status: 429 })),
    );
    globalThis.fetch = fetchMock as unknown as typeof fetch;

    await expect(syncAllSheetsBatch(ctx, minPayload)).rejects.toThrow();
  });

  test("throws when batchUpdate fails after clear", async () => {
    let callCount = 0;
    const fetchMock = mock(() => {
      callCount++;
      if (callCount === 1) return Promise.resolve(okResponse());
      return Promise.resolve(new Response("server error", { status: 500 }));
    });
    globalThis.fetch = fetchMock as unknown as typeof fetch;

    await expect(syncAllSheetsBatch(ctx, minPayload)).rejects.toThrow();
  });

  test("handles empty arrays correctly", async () => {
    const fetchMock = mock(() => Promise.resolve(okResponse()));
    globalThis.fetch = fetchMock as unknown as typeof fetch;

    await syncAllSheetsBatch(ctx, minPayload);
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });
});
