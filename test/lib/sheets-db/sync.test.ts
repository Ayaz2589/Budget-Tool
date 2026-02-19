import { test, expect, describe, mock, beforeEach, afterEach } from "bun:test";
import { createSheetsClient } from "@/lib/sheets-db/client";
import type { SheetSchema } from "@/lib/sheets-db/types";

interface Contact {
  id: string;
  name: string;
}

interface Order {
  id: string;
  total: number;
}

interface Note {
  id: string;
  text: string;
}

const contactSchema: SheetSchema<Contact> = {
  sheetName: "Contacts",
  headers: ["ID", "Name"],
  readRange: "Contacts!A2:B",
  writeRange: "Contacts!A1:B",
  clearRange: "Contacts!A1:B10000",
  appendSupported: false,
  parseRow(row) {
    const id = String(row[0] ?? "").trim();
    const name = String(row[1] ?? "").trim();
    return id ? { id, name } : null;
  },
  toRow(c) { return [c.id, c.name]; },
};

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
    return id ? { id, total } : null;
  },
  toRow(o) { return [o.id, o.total]; },
};

const noteSchema: SheetSchema<Note> = {
  sheetName: "Notes",
  headers: ["ID", "Text"],
  readRange: "Notes!A2:B",
  writeRange: "Notes!A1:B",
  clearRange: "Notes!A1:B10000",
  appendSupported: false,
  parseRow(row) {
    const id = String(row[0] ?? "").trim();
    const text = String(row[1] ?? "").trim();
    return id ? { id, text } : null;
  },
  toRow(n) { return [n.id, n.text]; },
};

const okResponse = () => new Response(JSON.stringify({ ok: true }), { status: 200 });

beforeEach(() => { mock.restore(); });
afterEach(() => { mock.restore(); });

describe("batchSync (generic)", () => {
  test("clears all ranges then writes all data in 2 API calls", async () => {
    const calls: { url: string; body?: string }[] = [];
    const fetchMock = mock((url: string, init?: RequestInit) => {
      calls.push({ url, body: init?.body as string });
      return Promise.resolve(okResponse());
    });
    globalThis.fetch = fetchMock as unknown as typeof fetch;

    const db = createSheetsClient({
      token: "tok",
      spreadsheetId: "sheet-1",
      schemas: { contacts: contactSchema, orders: orderSchema, notes: noteSchema },
    });

    await db.batchSync({
      contacts: [{ id: "c1", name: "Alice" }],
      orders: [{ id: "o1", total: 100 }],
      notes: [{ id: "n1", text: "Hello" }],
    });

    expect(calls.length).toBe(2);
    expect(calls[0].url).toContain("/values:batchClear");
    expect(calls[1].url).toContain("/values:batchUpdate");

    // Verify clear ranges
    const clearBody = JSON.parse(calls[0].body!);
    expect(clearBody.ranges).toContain("Contacts!A1:B10000");
    expect(clearBody.ranges).toContain("Orders!A1:B10000");
    expect(clearBody.ranges).toContain("Notes!A1:B10000");

    // Verify write data
    const updateBody = JSON.parse(calls[1].body!);
    expect(updateBody.data.length).toBe(3);
    expect(updateBody.valueInputOption).toBe("USER_ENTERED");
  });

  test("empty payload for one schema clears but writes headers only", async () => {
    const calls: { url: string; body?: string }[] = [];
    const fetchMock = mock((url: string, init?: RequestInit) => {
      calls.push({ url, body: init?.body as string });
      return Promise.resolve(okResponse());
    });
    globalThis.fetch = fetchMock as unknown as typeof fetch;

    const db = createSheetsClient({
      token: "tok",
      spreadsheetId: "sheet-1",
      schemas: { contacts: contactSchema, orders: orderSchema },
    });

    await db.batchSync({
      contacts: [{ id: "c1", name: "Alice" }],
      // orders not provided = empty
    });

    expect(calls.length).toBe(2);
    const updateBody = JSON.parse(calls[1].body!);
    // Both schemas should have data entries
    expect(updateBody.data.length).toBe(2);
    // Orders entry should have just headers
    const ordersEntry = updateBody.data.find((d: { range: string }) => d.range.includes("Orders"));
    expect(ordersEntry.values).toEqual([["ID", "Total"]]);
  });

  test("throws when batchClear fails", async () => {
    const fetchMock = mock(() =>
      Promise.resolve(new Response("rate limit", { status: 429 })),
    );
    globalThis.fetch = fetchMock as unknown as typeof fetch;

    const db = createSheetsClient({
      token: "tok",
      spreadsheetId: "sheet-1",
      schemas: { contacts: contactSchema },
    });

    await expect(db.batchSync({ contacts: [] })).rejects.toThrow();
  });

  test("throws when batchUpdate fails after clear", async () => {
    let callCount = 0;
    const fetchMock = mock(() => {
      callCount++;
      if (callCount === 1) return Promise.resolve(okResponse());
      return Promise.resolve(new Response("error", { status: 500 }));
    });
    globalThis.fetch = fetchMock as unknown as typeof fetch;

    const db = createSheetsClient({
      token: "tok",
      spreadsheetId: "sheet-1",
      schemas: { contacts: contactSchema },
    });

    await expect(db.batchSync({ contacts: [] })).rejects.toThrow();
  });
});

describe("ensureSchema (generic)", () => {
  test("creates missing sheets from schema sheetNames", async () => {
    const calls: { url: string; body?: string }[] = [];
    const fetchMock = mock((url: string, init?: RequestInit) => {
      calls.push({ url, body: init?.body as string });
      // First call: metadata returns only "Contacts" sheet
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

    const db = createSheetsClient({
      token: "tok",
      spreadsheetId: "sheet-1",
      schemas: { contacts: contactSchema, orders: orderSchema },
    });

    await db.ensureSchema();

    // Should have made 2 calls: metadata + batchUpdate to add missing "Orders"
    expect(calls.length).toBe(2);
    const addBody = JSON.parse(calls[1].body!);
    expect(addBody.requests).toHaveLength(1);
    expect(addBody.requests[0].addSheet.properties.title).toBe("Orders");
  });

  test("skips creation when all sheets exist", async () => {
    const fetchMock = mock(() =>
      Promise.resolve(
        new Response(
          JSON.stringify({
            sheets: [
              { properties: { sheetId: 0, title: "Contacts" } },
              { properties: { sheetId: 1, title: "Orders" } },
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
      schemas: { contacts: contactSchema, orders: orderSchema },
    });

    await db.ensureSchema();
    // Only 1 call: metadata (no batchUpdate needed)
    expect(fetchMock.mock.calls.length).toBe(1);
  });
});
