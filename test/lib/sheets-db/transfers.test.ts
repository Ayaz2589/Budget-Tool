import { test, expect, describe, mock, beforeEach, afterEach } from "bun:test";
import type { OwnerTransfer, PresetTransaction } from "@/lib/sheets-db/types";
import {
  readOwnerTransfers,
  readPresets,
  writeOwnerTransfers,
  writePresets,
  buildOwnerTransfersValues,
  buildPresetsValues,
} from "@/lib/sheets-db/transfers";
import type { TransportContext } from "@/lib/sheets-db/transport";

const ctx: TransportContext = { token: "test-token", spreadsheetId: "sheet-1" };

const okResponse = () => new Response(JSON.stringify({ ok: true }), { status: 200 });

beforeEach(() => {
  mock.restore();
});
afterEach(() => {
  mock.restore();
});

describe("readOwnerTransfers", () => {
  test("parses transfer rows", async () => {
    const fetchMock = mock(() =>
      Promise.resolve(
        new Response(
          JSON.stringify({
            values: [["t1", "2026-01-15", "Ayaz", "Tasnuva", 100, "Rent share"]],
          }),
          { status: 200 },
        ),
      ),
    );
    globalThis.fetch = fetchMock as unknown as typeof fetch;

    const transfers = await readOwnerTransfers(ctx);
    expect(transfers).toHaveLength(1);
    expect(transfers[0]).toMatchObject({
      id: "t1",
      date: "2026-01-15",
      fromOwner: "Ayaz",
      toOwner: "Tasnuva",
      amount: 100,
      note: "Rent share",
    });
  });

  test("generates ID when empty", async () => {
    const fetchMock = mock(() =>
      Promise.resolve(
        new Response(
          JSON.stringify({
            values: [["", "2026-01-15", "Ayaz", "Tasnuva", 50, ""]],
          }),
          { status: 200 },
        ),
      ),
    );
    globalThis.fetch = fetchMock as unknown as typeof fetch;

    const transfers = await readOwnerTransfers(ctx);
    expect(transfers[0]?.id).toBeTruthy();
  });

  test("skips rows with missing owners", async () => {
    const fetchMock = mock(() =>
      Promise.resolve(
        new Response(
          JSON.stringify({
            values: [["t1", "2026-01-15", "", "Tasnuva", 100, ""]],
          }),
          { status: 200 },
        ),
      ),
    );
    globalThis.fetch = fetchMock as unknown as typeof fetch;

    const transfers = await readOwnerTransfers(ctx);
    expect(transfers).toHaveLength(0);
  });

  test("skips rows with zero amount", async () => {
    const fetchMock = mock(() =>
      Promise.resolve(
        new Response(
          JSON.stringify({
            values: [["t1", "2026-01-15", "Ayaz", "Tasnuva", 0, ""]],
          }),
          { status: 200 },
        ),
      ),
    );
    globalThis.fetch = fetchMock as unknown as typeof fetch;

    const transfers = await readOwnerTransfers(ctx);
    expect(transfers).toHaveLength(0);
  });
});

describe("readPresets", () => {
  test("parses preset rows", async () => {
    const fetchMock = mock(() =>
      Promise.resolve(
        new Response(
          JSON.stringify({
            values: [["p1", "amex", "Groceries", "Food", "Ayaz"]],
          }),
          { status: 200 },
        ),
      ),
    );
    globalThis.fetch = fetchMock as unknown as typeof fetch;

    const presets = await readPresets(ctx);
    expect(presets).toHaveLength(1);
    expect(presets[0]).toMatchObject({
      id: "p1",
      source: "amex",
      description: "Groceries",
      category: "Food",
      owner: "Ayaz",
    });
  });

  test("skips rows with empty ID", async () => {
    const fetchMock = mock(() =>
      Promise.resolve(
        new Response(
          JSON.stringify({
            values: [["", "amex", "Groceries", "Food", "Ayaz"]],
          }),
          { status: 200 },
        ),
      ),
    );
    globalThis.fetch = fetchMock as unknown as typeof fetch;

    const presets = await readPresets(ctx);
    expect(presets).toHaveLength(0);
  });

  test("validates expense source fallback to manual", async () => {
    const fetchMock = mock(() =>
      Promise.resolve(
        new Response(
          JSON.stringify({
            values: [["p1", "unknown-card", "Test", "Cat", "Owner"]],
          }),
          { status: 200 },
        ),
      ),
    );
    globalThis.fetch = fetchMock as unknown as typeof fetch;

    const presets = await readPresets(ctx);
    expect(presets[0]?.source).toBe("manual");
  });
});

describe("buildOwnerTransfersValues", () => {
  test("returns header plus data rows", () => {
    const transfers: OwnerTransfer[] = [
      { id: "t1", date: "2026-01-15", fromOwner: "Ayaz", toOwner: "Tasnuva", amount: 100 },
    ];
    const values = buildOwnerTransfersValues(transfers);
    expect(values[0]).toEqual(["Id", "Date", "From Owner", "To Owner", "Amount", "Note"]);
    expect(values[1]).toEqual(["t1", "2026-01-15", "Ayaz", "Tasnuva", 100, ""]);
  });
});

describe("buildPresetsValues", () => {
  test("returns header plus data rows", () => {
    const presets: PresetTransaction[] = [
      { id: "p1", source: "amex", description: "Groceries", category: "Food", owner: "Ayaz" },
    ];
    const values = buildPresetsValues(presets);
    expect(values[0]).toEqual(["Id", "Source", "Description", "Category", "Owner"]);
    expect(values[1]).toEqual(["p1", "amex", "Groceries", "Food", "Ayaz"]);
  });
});

describe("writeOwnerTransfers", () => {
  test("calls clear then update", async () => {
    const calls: string[] = [];
    const fetchMock = mock((url: string) => {
      calls.push(url);
      return Promise.resolve(okResponse());
    });
    globalThis.fetch = fetchMock as unknown as typeof fetch;

    await writeOwnerTransfers(ctx, []);
    expect(calls.some((u) => u.includes(":clear"))).toBe(true);
  });
});

describe("writePresets", () => {
  test("calls clear then update", async () => {
    const calls: string[] = [];
    const fetchMock = mock((url: string) => {
      calls.push(url);
      return Promise.resolve(okResponse());
    });
    globalThis.fetch = fetchMock as unknown as typeof fetch;

    await writePresets(ctx, []);
    expect(calls.some((u) => u.includes(":clear"))).toBe(true);
  });
});
