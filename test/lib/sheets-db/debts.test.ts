import { test, expect, describe, mock, beforeEach, afterEach } from "bun:test";
import type { Debt, DebtPayment } from "@/lib/sheets-db/types";
import {
  readDebts,
  readDebtPayments,
  writeDebts,
  writeDebtPayments,
  buildDebtsValues,
  buildDebtPaymentsValues,
} from "@/lib/sheets-db/debts";
import type { TransportContext } from "@/lib/sheets-db/transport";

const ctx: TransportContext = { token: "test-token", spreadsheetId: "sheet-1" };

const okResponse = () => new Response(JSON.stringify({ ok: true }), { status: 200 });

beforeEach(() => {
  mock.restore();
});
afterEach(() => {
  mock.restore();
});

describe("readDebts", () => {
  test("parses debt rows", async () => {
    const fetchMock = mock(() =>
      Promise.resolve(
        new Response(
          JSON.stringify({
            values: [["d1", "Car Loan", 15000, "2025-01-01", "Ayaz"]],
          }),
          { status: 200 },
        ),
      ),
    );
    globalThis.fetch = fetchMock as unknown as typeof fetch;

    const debts = await readDebts(ctx);
    expect(debts).toHaveLength(1);
    expect(debts[0]).toMatchObject({
      id: "d1",
      name: "Car Loan",
      initialAmount: 15000,
      startDate: "2025-01-01",
      owner: "Ayaz",
    });
  });

  test("generates ID when missing", async () => {
    const fetchMock = mock(() =>
      Promise.resolve(
        new Response(
          JSON.stringify({
            values: [["", "Car Loan", 15000, "", ""]],
          }),
          { status: 200 },
        ),
      ),
    );
    globalThis.fetch = fetchMock as unknown as typeof fetch;

    const debts = await readDebts(ctx);
    expect(debts[0]?.id).toBeTruthy();
    expect(debts[0]?.id).not.toBe("");
  });

  test("skips rows with missing name", async () => {
    const fetchMock = mock(() =>
      Promise.resolve(
        new Response(
          JSON.stringify({ values: [["d1", "", 15000, "", ""]] }),
          { status: 200 },
        ),
      ),
    );
    globalThis.fetch = fetchMock as unknown as typeof fetch;

    const debts = await readDebts(ctx);
    expect(debts).toHaveLength(0);
  });

  test("skips rows with negative amount", async () => {
    const fetchMock = mock(() =>
      Promise.resolve(
        new Response(
          JSON.stringify({ values: [["d1", "Loan", -100, "", ""]] }),
          { status: 200 },
        ),
      ),
    );
    globalThis.fetch = fetchMock as unknown as typeof fetch;

    const debts = await readDebts(ctx);
    expect(debts).toHaveLength(0);
  });
});

describe("readDebtPayments", () => {
  test("parses payment rows", async () => {
    const fetchMock = mock(() =>
      Promise.resolve(
        new Response(
          JSON.stringify({
            values: [["p1", "d1", "2026-01-15", 500, "First payment"]],
          }),
          { status: 200 },
        ),
      ),
    );
    globalThis.fetch = fetchMock as unknown as typeof fetch;

    const payments = await readDebtPayments(ctx);
    expect(payments).toHaveLength(1);
    expect(payments[0]).toMatchObject({
      id: "p1",
      debtId: "d1",
      date: "2026-01-15",
      amount: 500,
      note: "First payment",
    });
  });

  test("skips rows with missing debtId", async () => {
    const fetchMock = mock(() =>
      Promise.resolve(
        new Response(
          JSON.stringify({ values: [["p1", "", "2026-01-15", 500, ""]] }),
          { status: 200 },
        ),
      ),
    );
    globalThis.fetch = fetchMock as unknown as typeof fetch;

    const payments = await readDebtPayments(ctx);
    expect(payments).toHaveLength(0);
  });
});

describe("buildDebtsValues", () => {
  test("returns header plus data rows", () => {
    const debts: Debt[] = [
      { id: "d1", name: "Car Loan", initialAmount: 15000, startDate: "2025-01-01", owner: "Ayaz" },
    ];
    const values = buildDebtsValues(debts);
    expect(values[0]).toEqual(["Id", "Name", "Initial Amount", "Start Date", "Owner"]);
    expect(values[1]).toEqual(["d1", "Car Loan", 15000, "2025-01-01", "Ayaz"]);
  });
});

describe("buildDebtPaymentsValues", () => {
  test("returns header plus data rows", () => {
    const payments: DebtPayment[] = [
      { id: "p1", debtId: "d1", date: "2026-01-15", amount: 500, note: "Payment" },
    ];
    const values = buildDebtPaymentsValues(payments);
    expect(values[0]).toEqual(["Id", "Debt Id", "Date", "Amount", "Note"]);
    expect(values[1]).toEqual(["p1", "d1", "2026-01-15", 500, "Payment"]);
  });
});

describe("writeDebts", () => {
  test("calls clear then update", async () => {
    const calls: string[] = [];
    const fetchMock = mock((url: string) => {
      calls.push(url);
      return Promise.resolve(okResponse());
    });
    globalThis.fetch = fetchMock as unknown as typeof fetch;

    await writeDebts(ctx, []);
    expect(calls.some((u) => u.includes(":clear"))).toBe(true);
  });
});

describe("writeDebtPayments", () => {
  test("calls clear then update", async () => {
    const calls: string[] = [];
    const fetchMock = mock((url: string) => {
      calls.push(url);
      return Promise.resolve(okResponse());
    });
    globalThis.fetch = fetchMock as unknown as typeof fetch;

    await writeDebtPayments(ctx, []);
    expect(calls.some((u) => u.includes(":clear"))).toBe(true);
  });
});
