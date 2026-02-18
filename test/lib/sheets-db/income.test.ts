import { test, expect, describe, mock, beforeEach, afterEach } from "bun:test";
import type { Income } from "@/lib/sheets-db/types";
import {
  readIncome,
  writeIncome,
  appendIncome,
  buildIncomeValues,
} from "@/lib/sheets-db/income";
import type { TransportContext } from "@/lib/sheets-db/transport";

const ctx: TransportContext = { token: "test-token", spreadsheetId: "sheet-1" };

const okResponse = () => new Response(JSON.stringify({ ok: true }), { status: 200 });

beforeEach(() => {
  mock.restore();
});
afterEach(() => {
  mock.restore();
});

describe("readIncome", () => {
  test("parses income rows with owner", async () => {
    const fetchMock = mock(() =>
      Promise.resolve(
        new Response(
          JSON.stringify({
            values: [["2026-02-06", 1000, "Paycheck", "Salary", "Ayaz"]],
          }),
          { status: 200 },
        ),
      ),
    );
    globalThis.fetch = fetchMock as unknown as typeof fetch;

    const income = await readIncome(ctx);
    expect(income).toHaveLength(1);
    expect(income[0]).toMatchObject({
      date: "2026-02-06",
      amount: 1000,
      description: "Paycheck",
      owner: "Ayaz",
    });
    expect(income[0]?.id).toBeTruthy();
  });

  test("normalizes Uncategorized to empty category", async () => {
    const fetchMock = mock(() =>
      Promise.resolve(
        new Response(
          JSON.stringify({
            values: [["2026-02-06", 500, "Bonus", "Uncategorized", ""]],
          }),
          { status: 200 },
        ),
      ),
    );
    globalThis.fetch = fetchMock as unknown as typeof fetch;

    const income = await readIncome(ctx);
    expect(income[0]?.category).toBe("");
  });

  test("skips rows with invalid data", async () => {
    const fetchMock = mock(() =>
      Promise.resolve(
        new Response(
          JSON.stringify({
            values: [
              ["not-a-date", 100, "Test", "Cat", ""],
              ["2026-01-01", -10, "Negative", "Cat", ""],
            ],
          }),
          { status: 200 },
        ),
      ),
    );
    globalThis.fetch = fetchMock as unknown as typeof fetch;

    const income = await readIncome(ctx);
    expect(income).toHaveLength(0);
  });

  test("returns empty array for empty sheet", async () => {
    const fetchMock = mock(() =>
      Promise.resolve(new Response(JSON.stringify({}), { status: 200 })),
    );
    globalThis.fetch = fetchMock as unknown as typeof fetch;

    const income = await readIncome(ctx);
    expect(income).toEqual([]);
  });
});

describe("buildIncomeValues", () => {
  test("returns header row plus data rows", () => {
    const income: Income[] = [
      {
        id: "i1",
        date: "2026-01-15",
        amount: 1000,
        description: "Paycheck",
        category: "Salary",
        owner: "Ayaz",
      },
    ];
    const values = buildIncomeValues(income);
    expect(values[0]).toEqual(["Date", "Amount", "Description", "Category", "Owner"]);
    expect(values[1]).toEqual(["2026-01-15", 1000, "Paycheck", "Salary", "Ayaz"]);
  });

  test("uses Uncategorized for empty category", () => {
    const income: Income[] = [
      { id: "i1", date: "2026-01-15", amount: 100, description: "T", category: "", owner: "" },
    ];
    const values = buildIncomeValues(income);
    expect(values[1]?.[3]).toBe("Uncategorized");
  });
});

describe("writeIncome", () => {
  test("calls clear then update", async () => {
    const calls: string[] = [];
    const fetchMock = mock((url: string) => {
      calls.push(url);
      return Promise.resolve(okResponse());
    });
    globalThis.fetch = fetchMock as unknown as typeof fetch;

    await writeIncome(ctx, []);
    expect(calls.some((u) => u.includes(":clear"))).toBe(true);
  });
});

describe("appendIncome", () => {
  test("writes without clearing", async () => {
    const fetchMock = mock(() => Promise.resolve(okResponse()));
    globalThis.fetch = fetchMock as unknown as typeof fetch;

    await appendIncome(ctx, [
      { id: "i1", date: "2026-01-15", amount: 100, description: "T", category: "C" },
    ]);
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });
});
