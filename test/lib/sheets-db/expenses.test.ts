import { test, expect, describe, mock, beforeEach, afterEach } from "bun:test";
import type { Expense } from "@/lib/sheets-db/types";
import {
  readExpenses,
  readMortgage,
  writeExpenses,
  writeMortgage,
  appendExpenses,
  buildExpensesValues,
} from "@/lib/sheets-db/expenses";
import type { TransportContext } from "@/lib/sheets-db/transport";

const ctx: TransportContext = { token: "test-token", spreadsheetId: "sheet-1" };

const okResponse = () => new Response(JSON.stringify({ ok: true }), { status: 200 });

beforeEach(() => {
  mock.restore();
});
afterEach(() => {
  mock.restore();
});

describe("readExpenses", () => {
  test("parses modern rows with ID and owner", async () => {
    const fetchMock = mock(() =>
      Promise.resolve(
        new Response(
          JSON.stringify({
            values: [
              ["e1", "2026-02-06", 10.5, "Coffee", "Food", "manual", "Ayaz"],
            ],
          }),
          { status: 200 },
        ),
      ),
    );
    globalThis.fetch = fetchMock as unknown as typeof fetch;

    const expenses = await readExpenses(ctx);
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

  test("handles legacy rows without ID (date-first)", async () => {
    const fetchMock = mock(() =>
      Promise.resolve(
        new Response(
          JSON.stringify({
            values: [
              ["2026-02-06", "10.5", "Coffee", "Food", "manual", "Ayaz"],
            ],
          }),
          { status: 200 },
        ),
      ),
    );
    globalThis.fetch = fetchMock as unknown as typeof fetch;

    const expenses = await readExpenses(ctx);
    expect(expenses).toHaveLength(1);
    expect(expenses[0]?.date).toBe("2026-02-06");
    expect(expenses[0]?.amount).toBe(10.5);
    expect(expenses[0]?.id).toBeTruthy();
  });

  test("skips rows with invalid date", async () => {
    const fetchMock = mock(() =>
      Promise.resolve(
        new Response(
          JSON.stringify({
            values: [["e1", "not-a-date", 10, "Test", "Cat", "manual", ""]],
          }),
          { status: 200 },
        ),
      ),
    );
    globalThis.fetch = fetchMock as unknown as typeof fetch;

    const expenses = await readExpenses(ctx);
    expect(expenses).toHaveLength(0);
  });

  test("skips rows with zero or negative amount", async () => {
    const fetchMock = mock(() =>
      Promise.resolve(
        new Response(
          JSON.stringify({
            values: [
              ["e1", "2026-01-01", 0, "Free", "Cat", "manual", ""],
              ["e2", "2026-01-01", -5, "Refund", "Cat", "manual", ""],
            ],
          }),
          { status: 200 },
        ),
      ),
    );
    globalThis.fetch = fetchMock as unknown as typeof fetch;

    const expenses = await readExpenses(ctx);
    expect(expenses).toHaveLength(0);
  });

  test("returns empty array for empty sheet", async () => {
    const fetchMock = mock(() =>
      Promise.resolve(new Response(JSON.stringify({}), { status: 200 })),
    );
    globalThis.fetch = fetchMock as unknown as typeof fetch;

    const expenses = await readExpenses(ctx);
    expect(expenses).toEqual([]);
  });
});

describe("readMortgage", () => {
  test("applies default Mortgage category and description", async () => {
    const fetchMock = mock(() =>
      Promise.resolve(
        new Response(
          JSON.stringify({
            values: [["m1", "2026-01-01", 2000, "", "", "manual", ""]],
          }),
          { status: 200 },
        ),
      ),
    );
    globalThis.fetch = fetchMock as unknown as typeof fetch;

    const expenses = await readMortgage(ctx);
    expect(expenses).toHaveLength(1);
    expect(expenses[0]?.category).toBe("Mortgage");
    expect(expenses[0]?.description).toBe("Mortgage");
  });
});

describe("buildExpensesValues", () => {
  test("returns header row plus data rows", () => {
    const expenses: Expense[] = [
      {
        id: "e1",
        date: "2026-01-15",
        amount: 42.5,
        description: "Coffee",
        category: "Food",
        source: "amex",
        owner: "Ayaz",
        paidByOwner: "Ayaz",
      },
    ];
    const values = buildExpensesValues(expenses);
    expect(values[0]).toEqual(["ID", "Date", "Amount", "Description", "Category", "Source", "Owner"]);
    expect(values[1]).toEqual(["e1", "2026-01-15", 42.5, "Coffee", "Food", "amex", "Ayaz"]);
  });

  test("uses Uncategorized for empty category", () => {
    const expenses: Expense[] = [
      {
        id: "e1",
        date: "2026-01-15",
        amount: 10,
        description: "Test",
        category: "",
        source: "manual",
      },
    ];
    const values = buildExpensesValues(expenses);
    expect(values[1]?.[4]).toBe("Uncategorized");
  });

  test("round-trips: build then read recovers original data", async () => {
    const original: Expense[] = [
      {
        id: "e1",
        date: "2026-01-15",
        amount: 42.5,
        description: "Coffee",
        category: "Food",
        source: "amex",
        paidByOwner: "Ayaz",
      },
    ];
    const built = buildExpensesValues(original);
    const dataRows = built.slice(1);

    const fetchMock = mock(() =>
      Promise.resolve(
        new Response(JSON.stringify({ values: dataRows }), { status: 200 }),
      ),
    );
    globalThis.fetch = fetchMock as unknown as typeof fetch;

    const recovered = await readExpenses(ctx);
    expect(recovered).toHaveLength(1);
    expect(recovered[0]?.id).toBe("e1");
    expect(recovered[0]?.amount).toBe(42.5);
    expect(recovered[0]?.source).toBe("amex");
  });
});

// T022: Legacy format normalization tests
describe("legacy format handling", () => {
  test("row without ID column generates ID", async () => {
    const fetchMock = mock(() =>
      Promise.resolve(
        new Response(
          JSON.stringify({
            values: [["2026-02-06", "50", "Coffee", "Food", "amex", "Ayaz"]],
          }),
          { status: 200 },
        ),
      ),
    );
    globalThis.fetch = fetchMock as unknown as typeof fetch;

    const expenses = await readExpenses(ctx);
    expect(expenses).toHaveLength(1);
    expect(expenses[0]?.id).toBeTruthy();
    expect(expenses[0]?.id.length).toBeGreaterThan(0);
  });

  test("serial date number converts to ISO", async () => {
    const fetchMock = mock(() =>
      Promise.resolve(
        new Response(
          JSON.stringify({
            values: [["e1", 46038, 50, "Test", "Cat", "manual", ""]],
          }),
          { status: 200 },
        ),
      ),
    );
    globalThis.fetch = fetchMock as unknown as typeof fetch;

    const expenses = await readExpenses(ctx);
    expect(expenses).toHaveLength(1);
    expect(expenses[0]?.date).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });

  test("corrupted date string repairs via tryRepairDate", async () => {
    const fetchMock = mock(() =>
      Promise.resolve(
        new Response(
          JSON.stringify({
            values: [["e1", "$46,038", 50, "Test", "Cat", "manual", ""]],
          }),
          { status: 200 },
        ),
      ),
    );
    globalThis.fetch = fetchMock as unknown as typeof fetch;

    const expenses = await readExpenses(ctx);
    expect(expenses).toHaveLength(1);
    expect(expenses[0]?.date).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });

  test("unknown source falls back to manual", async () => {
    const fetchMock = mock(() =>
      Promise.resolve(
        new Response(
          JSON.stringify({
            values: [["e1", "2026-01-01", 50, "Test", "Cat", "amex-platinum", ""]],
          }),
          { status: 200 },
        ),
      ),
    );
    globalThis.fetch = fetchMock as unknown as typeof fetch;

    const expenses = await readExpenses(ctx);
    expect(expenses[0]?.source).toBe("manual");
  });

  test("Uncategorized category normalizes to empty string", async () => {
    const fetchMock = mock(() =>
      Promise.resolve(
        new Response(
          JSON.stringify({
            values: [["e1", "2026-01-01", 50, "Test", "Uncategorized", "manual", ""]],
          }),
          { status: 200 },
        ),
      ),
    );
    globalThis.fetch = fetchMock as unknown as typeof fetch;

    const expenses = await readExpenses(ctx);
    expect(expenses[0]?.category).toBe("");
  });

  test("extra columns in row are ignored (forward-compatible)", async () => {
    const fetchMock = mock(() =>
      Promise.resolve(
        new Response(
          JSON.stringify({
            values: [["e1", "2026-01-01", 50, "Test", "Food", "manual", "Ayaz", "extra1", "extra2"]],
          }),
          { status: 200 },
        ),
      ),
    );
    globalThis.fetch = fetchMock as unknown as typeof fetch;

    const expenses = await readExpenses(ctx);
    expect(expenses).toHaveLength(1);
    expect(expenses[0]?.id).toBe("e1");
  });
});

describe("writeExpenses", () => {
  test("calls clear then update", async () => {
    const calls: string[] = [];
    const fetchMock = mock((url: string) => {
      calls.push(url);
      return Promise.resolve(okResponse());
    });
    globalThis.fetch = fetchMock as unknown as typeof fetch;

    await writeExpenses(ctx, []);
    expect(calls.some((u) => u.includes(":clear"))).toBe(true);
  });
});

describe("writeMortgage", () => {
  test("calls clear then update for mortgage range", async () => {
    const calls: string[] = [];
    const fetchMock = mock((url: string) => {
      calls.push(url);
      return Promise.resolve(okResponse());
    });
    globalThis.fetch = fetchMock as unknown as typeof fetch;

    await writeMortgage(ctx, []);
    expect(calls.some((u) => u.includes("Mortgage"))).toBe(true);
  });
});

describe("appendExpenses", () => {
  test("writes without clearing", async () => {
    const calls: string[] = [];
    const fetchMock = mock((url: string) => {
      calls.push(url);
      return Promise.resolve(okResponse());
    });
    globalThis.fetch = fetchMock as unknown as typeof fetch;

    const expenses: Expense[] = [
      {
        id: "e1",
        date: "2026-01-15",
        amount: 10,
        description: "Test",
        category: "Cat",
        source: "manual",
      },
    ];
    await appendExpenses(ctx, expenses);
    expect(calls.some((u) => u.includes(":clear"))).toBe(false);
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });
});
