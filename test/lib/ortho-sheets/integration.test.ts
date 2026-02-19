import { test, expect, describe, mock, beforeEach, afterEach } from "bun:test";
import { createOrthoSheetsClient } from "@/lib/ortho-sheets";

const okResponse = () => new Response(JSON.stringify({ ok: true }), { status: 200 });

beforeEach(() => { mock.restore(); });
afterEach(() => { mock.restore(); });

describe("Ortho batchSync integration", () => {
  test("clears all schema ranges and writes all data in 2 API calls", async () => {
    const calls: { url: string; body?: string }[] = [];
    const fetchMock = mock((url: string, init?: RequestInit) => {
      calls.push({ url, body: init?.body as string });
      return Promise.resolve(okResponse());
    });
    globalThis.fetch = fetchMock as unknown as typeof fetch;

    const db = createOrthoSheetsClient({ token: "tok", spreadsheetId: "sheet-1" });

    await db.batchSync({
      expenses: [
        {
          id: "e1",
          date: "2024-01-15",
          amount: 50,
          description: "Groceries",
          category: "Food",
          source: "manual",
          owner: "Owner 1",
          allocation: { type: "owner", assignedTo: "Owner 1" },
        },
      ],
      income: [
        {
          id: "i1",
          date: "2024-01-01",
          amount: 5000,
          description: "Salary",
          category: "Employment",
          owner: "Owner 1",
        },
      ],
    });

    // Should be exactly 2 API calls: batchClear + batchUpdate
    expect(calls.length).toBe(2);
    expect(calls[0].url).toContain("/values:batchClear");
    expect(calls[1].url).toContain("/values:batchUpdate");

    // batchClear should include all 9 schema clear ranges
    const clearBody = JSON.parse(calls[0].body!);
    expect(clearBody.ranges.length).toBe(9);

    // batchUpdate should include all 9 schemas (some with headers only)
    const updateBody = JSON.parse(calls[1].body!);
    expect(updateBody.data.length).toBe(9);
    expect(updateBody.valueInputOption).toBe("USER_ENTERED");

    // Verify expense data is present
    const expensesEntry = updateBody.data.find(
      (d: { range: string }) => d.range.includes("Expenses"),
    );
    expect(expensesEntry).toBeDefined();
    // Headers row + 1 data row
    expect(expensesEntry.values.length).toBe(2);
  });

  test("schemas with no payload data get headers-only write", async () => {
    const calls: { url: string; body?: string }[] = [];
    const fetchMock = mock((url: string, init?: RequestInit) => {
      calls.push({ url, body: init?.body as string });
      return Promise.resolve(okResponse());
    });
    globalThis.fetch = fetchMock as unknown as typeof fetch;

    const db = createOrthoSheetsClient({ token: "tok", spreadsheetId: "sheet-1" });

    // Only provide expenses, everything else should get headers only
    await db.batchSync({
      expenses: [
        {
          id: "e1",
          date: "2024-01-15",
          amount: 50,
          description: "Test",
          category: "Food",
          source: "manual",
          owner: "Owner 1",
          allocation: { type: "owner", assignedTo: "Owner 1" },
        },
      ],
    });

    const updateBody = JSON.parse(calls[1].body!);

    // Income entry should be headers only
    const incomeEntry = updateBody.data.find(
      (d: { range: string }) => d.range.includes("Income"),
    );
    expect(incomeEntry).toBeDefined();
    expect(incomeEntry.values.length).toBe(1); // headers only
  });

  test("readAll via repo returns parsed entities", async () => {
    const fetchMock = mock(() =>
      Promise.resolve(
        new Response(
          JSON.stringify({
            values: [
              ["e1", "2024-01-15", "50", "Groceries", "Food", "manual", "Owner 1", "owner:Owner 1"],
            ],
          }),
          { status: 200 },
        ),
      ),
    );
    globalThis.fetch = fetchMock as unknown as typeof fetch;

    const db = createOrthoSheetsClient({ token: "tok", spreadsheetId: "sheet-1" });
    const expenses = await db.repo("expenses").readAll();
    expect(expenses.length).toBeGreaterThanOrEqual(1);
    expect(expenses[0].id).toBe("e1");
    expect(expenses[0].description).toBe("Groceries");
  });
});
