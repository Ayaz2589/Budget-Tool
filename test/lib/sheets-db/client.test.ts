import { test, expect, describe, mock, beforeEach, afterEach } from "bun:test";
import { createSheetsClient } from "@/lib/sheets-db/client";
import type { SheetSchema } from "@/lib/sheets-db/types";

// ---------------------------------------------------------------------------
// Test schema: Contacts (non-Ortho)
// ---------------------------------------------------------------------------

interface Contact {
  id: string;
  name: string;
  email: string;
}

const contactSchema: SheetSchema<Contact> = {
  sheetName: "Contacts",
  headers: ["ID", "Name", "Email"],
  readRange: "Contacts!A2:C",
  writeRange: "Contacts!A1:C",
  clearRange: "Contacts!A1:C10000",
  appendSupported: true,
  parseRow(row) {
    const id = String(row[0] ?? "").trim();
    const name = String(row[1] ?? "").trim();
    const email = String(row[2] ?? "").trim();
    if (!id || !name) return null;
    return { id, name, email };
  },
  toRow(c) {
    return [c.id, c.name, c.email];
  },
};

interface Order {
  id: string;
  total: number;
}

const orderSchema: SheetSchema<Order> = {
  sheetName: "Orders",
  headers: ["ID", "Total"],
  readRange: "Orders!A2:B",
  writeRange: "Orders!A1:B",
  clearRange: "Orders!A1:B10000",
  appendSupported: false,
  parseRow(row) {
    const id = String(row[0] ?? "").trim();
    const total = Number(row[1] ?? 0);
    if (!id) return null;
    return { id, total };
  },
  toRow(o) {
    return [o.id, o.total];
  },
  validate(o) {
    if (!o.id) throw new Error("ID required");
    if (o.total <= 0) throw new Error("Total must be positive");
  },
};

const okResponse = () => new Response(JSON.stringify({ ok: true }), { status: 200 });

beforeEach(() => { mock.restore(); });
afterEach(() => { mock.restore(); });

// ---------------------------------------------------------------------------
// T006: Generic client factory tests
// ---------------------------------------------------------------------------

describe("createSheetsClient (generic)", () => {
  test("repo() returns Repository with readAll/writeAll/append", () => {
    const db = createSheetsClient({
      token: "tok",
      spreadsheetId: "sheet-1",
      schemas: { contacts: contactSchema },
    });
    const repo = db.repo("contacts");
    expect(typeof repo.readAll).toBe("function");
    expect(typeof repo.writeAll).toBe("function");
    expect(typeof repo.append).toBe("function");
  });

  test("has ensureSchema method", () => {
    const db = createSheetsClient({
      token: "tok",
      spreadsheetId: "sheet-1",
      schemas: { contacts: contactSchema },
    });
    expect(typeof db.ensureSchema).toBe("function");
  });

  test("has batchSync method", () => {
    const db = createSheetsClient({
      token: "tok",
      spreadsheetId: "sheet-1",
      schemas: { contacts: contactSchema },
    });
    expect(typeof db.batchSync).toBe("function");
  });

  test("has applyFormatting method", () => {
    const db = createSheetsClient({
      token: "tok",
      spreadsheetId: "sheet-1",
      schemas: { contacts: contactSchema },
    });
    expect(typeof db.applyFormatting).toBe("function");
  });

  test("extractSpreadsheetId extracts id from URL", () => {
    const db = createSheetsClient({
      token: "tok",
      spreadsheetId: "sheet-1",
      schemas: { contacts: contactSchema },
    });
    expect(db.extractSpreadsheetId("https://docs.google.com/spreadsheets/d/1abc_def-123/edit")).toBe("1abc_def-123");
  });

  test("extractSpreadsheetId returns raw ID", () => {
    const db = createSheetsClient({
      token: "tok",
      spreadsheetId: "sheet-1",
      schemas: { contacts: contactSchema },
    });
    expect(db.extractSpreadsheetId("1abc_def-123")).toBe("1abc_def-123");
  });

  test("rejects schema with empty sheetName", () => {
    const bad: SheetSchema<Contact> = { ...contactSchema, sheetName: "" };
    expect(() =>
      createSheetsClient({ token: "tok", spreadsheetId: "s", schemas: { c: bad } }),
    ).toThrow(/sheetName/);
  });

  test("rejects schema with empty headers", () => {
    const bad: SheetSchema<Contact> = { ...contactSchema, headers: [] };
    expect(() =>
      createSheetsClient({ token: "tok", spreadsheetId: "s", schemas: { c: bad } }),
    ).toThrow(/headers/);
  });

  test("rejects duplicate sheetName across schemas", () => {
    const dup: SheetSchema<Order> = { ...orderSchema, sheetName: "Contacts" };
    expect(() =>
      createSheetsClient({
        token: "tok",
        spreadsheetId: "s",
        schemas: { contacts: contactSchema, orders: dup },
      }),
    ).toThrow(/Duplicate/i);
  });

  test("supports multiple schemas", () => {
    const db = createSheetsClient({
      token: "tok",
      spreadsheetId: "sheet-1",
      schemas: { contacts: contactSchema, orders: orderSchema },
    });
    expect(typeof db.repo("contacts").readAll).toBe("function");
    expect(typeof db.repo("orders").readAll).toBe("function");
  });
});

// ---------------------------------------------------------------------------
// T007: Generic repository tests
// ---------------------------------------------------------------------------

describe("Repository readAll", () => {
  test("calls parseRow on each sheet row", async () => {
    const fetchMock = mock(() =>
      Promise.resolve(
        new Response(
          JSON.stringify({
            values: [
              ["c1", "Alice", "alice@test.com"],
              ["c2", "Bob", "bob@test.com"],
            ],
          }),
          { status: 200 },
        ),
      ),
    );
    globalThis.fetch = fetchMock as unknown as typeof fetch;

    const db = createSheetsClient({
      token: "tok",
      spreadsheetId: "sheet-1",
      schemas: { contacts: contactSchema },
    });
    const results = await db.repo("contacts").readAll();
    expect(results).toHaveLength(2);
    expect(results[0]).toEqual({ id: "c1", name: "Alice", email: "alice@test.com" });
    expect(results[1]).toEqual({ id: "c2", name: "Bob", email: "bob@test.com" });
  });

  test("parseRow returning null skips the row", async () => {
    const fetchMock = mock(() =>
      Promise.resolve(
        new Response(
          JSON.stringify({
            values: [
              ["c1", "Alice", "alice@test.com"],
              ["", "", ""],
              ["c3", "Charlie", "charlie@test.com"],
            ],
          }),
          { status: 200 },
        ),
      ),
    );
    globalThis.fetch = fetchMock as unknown as typeof fetch;

    const db = createSheetsClient({
      token: "tok",
      spreadsheetId: "sheet-1",
      schemas: { contacts: contactSchema },
    });
    const results = await db.repo("contacts").readAll();
    expect(results).toHaveLength(2);
    expect(results[0]?.id).toBe("c1");
    expect(results[1]?.id).toBe("c3");
  });

  test("returns empty array for empty sheet", async () => {
    const fetchMock = mock(() =>
      Promise.resolve(new Response(JSON.stringify({}), { status: 200 })),
    );
    globalThis.fetch = fetchMock as unknown as typeof fetch;

    const db = createSheetsClient({
      token: "tok",
      spreadsheetId: "sheet-1",
      schemas: { contacts: contactSchema },
    });
    const results = await db.repo("contacts").readAll();
    expect(results).toEqual([]);
  });
});

describe("Repository writeAll", () => {
  test("clears sheet then writes headers + data", async () => {
    const calls: { url: string; method: string; body?: string }[] = [];
    const fetchMock = mock((url: string, init?: RequestInit) => {
      calls.push({ url, method: init?.method ?? "GET", body: init?.body as string });
      return Promise.resolve(okResponse());
    });
    globalThis.fetch = fetchMock as unknown as typeof fetch;

    const db = createSheetsClient({
      token: "tok",
      spreadsheetId: "sheet-1",
      schemas: { contacts: contactSchema },
    });
    await db.repo("contacts").writeAll([
      { id: "c1", name: "Alice", email: "a@t.com" },
    ]);

    expect(calls.length).toBe(2);
    expect(calls[0].url).toContain(":clear");
    expect(calls[1].method).toBe("PUT");
    const body = JSON.parse(calls[1].body!);
    expect(body.values[0]).toEqual(["ID", "Name", "Email"]);
    expect(body.values[1]).toEqual(["c1", "Alice", "a@t.com"]);
  });
});

describe("Repository append", () => {
  test("throws when appendSupported is false", async () => {
    const db = createSheetsClient({
      token: "tok",
      spreadsheetId: "sheet-1",
      schemas: { orders: orderSchema },
    });
    await expect(
      db.repo("orders").append([{ id: "o1", total: 100 }]),
    ).rejects.toThrow(/not supported/i);
  });

  test("appends rows when appendSupported is true", async () => {
    const calls: { url: string }[] = [];
    const fetchMock = mock((url: string) => {
      calls.push({ url });
      return Promise.resolve(okResponse());
    });
    globalThis.fetch = fetchMock as unknown as typeof fetch;

    const db = createSheetsClient({
      token: "tok",
      spreadsheetId: "sheet-1",
      schemas: { contacts: contactSchema },
    });
    await db.repo("contacts").append([{ id: "c1", name: "Alice", email: "a@t.com" }]);
    expect(calls.length).toBe(1);
    expect(calls[0].url).toContain(":append");
  });
});

// ---------------------------------------------------------------------------
// Concurrency tests (write mutex)
// ---------------------------------------------------------------------------

describe("write mutex", () => {
  test("two concurrent writeAll calls execute sequentially", async () => {
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

    const db = createSheetsClient({
      token: "tok",
      spreadsheetId: "sheet-1",
      schemas: { contacts: contactSchema },
    });

    const p1 = db.repo("contacts").writeAll([{ id: "c1", name: "A", email: "a" }]);
    const p2 = db.repo("contacts").writeAll([{ id: "c2", name: "B", email: "b" }]);

    await Promise.all([p1, p2]);
    // First writeAll does clear + update (2 calls), then second writeAll does clear + update (2 calls)
    expect(fetchMock.mock.calls.length).toBe(4);
    expect(order[0]).toBeLessThanOrEqual(2);
    expect(order[1]).toBeLessThanOrEqual(2);
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

    const db = createSheetsClient({
      token: "tok",
      spreadsheetId: "sheet-1",
      schemas: { contacts: contactSchema, orders: orderSchema },
    });

    const p1 = db.batchSync({ contacts: [{ id: "c1", name: "A", email: "a" }] });
    const p2 = db.batchSync({ orders: [{ id: "o1", total: 50 }] });

    await Promise.all([p1, p2]);
    // Each batchSync = 2 calls (batchClear + batchUpdate), so 4 total
    expect(fetchMock.mock.calls.length).toBe(4);
    // First batchSync's 2 calls should complete before second's start
    expect(order[0]).toBeLessThanOrEqual(2);
    expect(order[1]).toBeLessThanOrEqual(2);
  });
});

// ---------------------------------------------------------------------------
// T031: Validation integration tests
// ---------------------------------------------------------------------------

describe("schema validation", () => {
  test("writeAll calls validate before API call and rejects invalid record", async () => {
    const fetchMock = mock(() => Promise.resolve(okResponse()));
    globalThis.fetch = fetchMock as unknown as typeof fetch;

    const db = createSheetsClient({
      token: "tok",
      spreadsheetId: "sheet-1",
      schemas: { orders: orderSchema },
    });

    await expect(
      db.repo("orders").writeAll([{ id: "", total: 100 }]),
    ).rejects.toThrow("ID required");
    // No API calls should be made
    expect(fetchMock.mock.calls.length).toBe(0);
  });

  test("writeAll rejects negative total via validator", async () => {
    const fetchMock = mock(() => Promise.resolve(okResponse()));
    globalThis.fetch = fetchMock as unknown as typeof fetch;

    const db = createSheetsClient({
      token: "tok",
      spreadsheetId: "sheet-1",
      schemas: { orders: orderSchema },
    });

    await expect(
      db.repo("orders").writeAll([{ id: "o1", total: -5 }]),
    ).rejects.toThrow("Total must be positive");
    expect(fetchMock.mock.calls.length).toBe(0);
  });

  test("schema without validator writes without validation", async () => {
    const fetchMock = mock(() => Promise.resolve(okResponse()));
    globalThis.fetch = fetchMock as unknown as typeof fetch;

    const db = createSheetsClient({
      token: "tok",
      spreadsheetId: "sheet-1",
      schemas: { contacts: contactSchema },
    });

    // contactSchema has no validate — should write without issues
    await db.repo("contacts").writeAll([{ id: "c1", name: "A", email: "" }]);
    expect(fetchMock.mock.calls.length).toBe(2); // clear + write
  });
});

// ---------------------------------------------------------------------------
// T032: Formatting tests
// ---------------------------------------------------------------------------

describe("applyFormatting", () => {
  test("builds repeatCell requests from schema formatting and sends batchUpdate", async () => {
    const calls: { url: string; body?: string }[] = [];
    const fetchMock = mock((url: string, init?: RequestInit) => {
      calls.push({ url, body: init?.body as string });
      // Metadata call returns sheet with matching title
      if (url.includes("?fields=")) {
        return Promise.resolve(
          new Response(
            JSON.stringify({
              sheets: [{ properties: { sheetId: 42, title: "Orders" } }],
            }),
            { status: 200 },
          ),
        );
      }
      return Promise.resolve(okResponse());
    });
    globalThis.fetch = fetchMock as unknown as typeof fetch;

    const formattedOrderSchema: SheetSchema<Order> = {
      ...orderSchema,
      formatting: [
        { startCol: 1, endCol: 2, numberFormat: { type: "CURRENCY", pattern: "$#,##0.00" } },
      ],
      headerFormatting: { bold: true, fontSize: 12 },
    };

    const db = createSheetsClient({
      token: "tok",
      spreadsheetId: "sheet-1",
      schemas: { orders: formattedOrderSchema },
    });

    await db.applyFormatting();

    // 2 calls: metadata + batchUpdate
    expect(calls.length).toBe(2);
    expect(calls[1].url).toContain(":batchUpdate");

    const body = JSON.parse(calls[1].body!);
    expect(body.requests.length).toBeGreaterThanOrEqual(2); // header + data formatting
    // Verify a repeatCell request targets sheetId 42
    const repeatCells = body.requests.filter(
      (r: Record<string, unknown>) => "repeatCell" in r,
    );
    expect(repeatCells.length).toBeGreaterThanOrEqual(1);
    expect(repeatCells[0].repeatCell.range.sheetId).toBe(42);
  });

  test("schemas with no formatting are skipped", async () => {
    const calls: { url: string; body?: string }[] = [];
    const fetchMock = mock((url: string, init?: RequestInit) => {
      calls.push({ url, body: init?.body as string });
      if (url.includes("?fields=")) {
        return Promise.resolve(
          new Response(
            JSON.stringify({
              sheets: [{ properties: { sheetId: 0, title: "Contacts" } }],
            }),
            { status: 200 },
          ),
        );
      }
      return Promise.resolve(okResponse());
    });
    globalThis.fetch = fetchMock as unknown as typeof fetch;

    // contactSchema has no formatting or headerFormatting
    const db = createSheetsClient({
      token: "tok",
      spreadsheetId: "sheet-1",
      schemas: { contacts: contactSchema },
    });

    await db.applyFormatting();

    // No calls at all — early return since no schemas have formatting rules
    expect(calls.length).toBe(0);
  });
});
