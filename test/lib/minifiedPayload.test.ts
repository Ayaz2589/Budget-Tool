import { test, expect } from "bun:test";
import pako from "pako";
import { serializeToBlob, parseFromBlob } from "@/lib/minifiedPayload";

test("serializeToBlob and parseFromBlob round-trip", () => {
  const input = {
    expenses: [
      {
        id: "manual-e1",
        date: "2025-01-15",
        amount: 10.5,
        description: "Coffee",
        category: "50/50",
        source: "manual" as const,
      },
    ],
    income: [
      {
        id: "income-1",
        date: "2025-01-01",
        amount: 3000,
        description: "Paycheck",
        category: "Paycheck",
      },
    ],
    debts: [
      {
        id: "d1",
        name: "Loan",
        initialAmount: 5000,
        startDate: "2025-01-01",
        owner: "Ayaz" as const,
      },
    ],
    debtPayments: [
      { id: "dp1", debtId: "d1", date: "2025-01-15", amount: 200 },
    ],
    presetTransactions: [
      {
        id: "preset-1",
        source: "manual" as const,
        description: "Preset",
        category: "50/50",
        owner: "Ayaz",
      },
    ],
    expenseCategoriesWithColors: [
      { name: "50/50", color: "blue" },
      { name: "Amazon", color: "orange" },
    ],
    incomeCategoriesWithColors: [{ name: "Paycheck", color: "green" }],
    cardSources: ["amex", "chase", "manual"],
  };

  const blob = serializeToBlob(input);
  expect(blob.startsWith("V2")).toBe(true);
  expect(blob.length).toBeGreaterThan(10);

  const expanded = parseFromBlob(blob);
  expect(expanded.expenses).toHaveLength(1);
  expect(expanded.expenses[0]!.id).toBe("manual-e1");
  expect(expanded.expenses[0]!.amount).toBe(10.5);
  expect(expanded.income).toHaveLength(1);
  expect(expanded.income[0]!.amount).toBe(3000);
  expect(expanded.debts).toHaveLength(1);
  expect(expanded.debts[0]!.name).toBe("Loan");
  expect(expanded.debtPayments).toHaveLength(1);
  expect(expanded.presetTransactions).toHaveLength(1);
  expect(expanded.expenseCategoriesWithColors).toHaveLength(2);
  expect(expanded.incomeCategoriesWithColors).toHaveLength(1);
  expect(expanded.cardSources).toEqual(["amex", "chase", "manual"]);
});

test("parseFromBlob throws when blob does not start with V2", () => {
  expect(() => parseFromBlob("invalid")).toThrow("missing V2 prefix");
  expect(() => parseFromBlob("")).toThrow("missing V2 prefix");
});

test("serializeToBlob with empty data produces valid blob", () => {
  const blob = serializeToBlob({
    expenses: [],
    income: [],
    debts: [],
    debtPayments: [],
    presetTransactions: [],
  });
  expect(blob.startsWith("V2")).toBe(true);
  const expanded = parseFromBlob(blob);
  expect(expanded.expenses).toEqual([]);
  expect(expanded.income).toEqual([]);
  expect(expanded.debts).toEqual([]);
  expect(expanded.debtPayments).toEqual([]);
  expect(expanded.presetTransactions).toEqual([]);
  expect(expanded.expenseCategoriesWithColors).toEqual([]);
  expect(expanded.incomeCategoriesWithColors).toEqual([]);
});

test("serializeToBlob always includes ec and ic in encoded payload (empty arrays when no categories)", () => {
  const blob = serializeToBlob({
    expenses: [],
    income: [],
    debts: [],
    debtPayments: [],
    presetTransactions: [],
  });
  const base64Part = blob.slice(2);
  const binary = atob(base64Part);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  const decompressed = pako.ungzip(bytes, { to: "string" });
  const raw = JSON.parse(decompressed) as Record<string, unknown>;
  expect(raw).toHaveProperty("ec");
  expect(raw).toHaveProperty("ic");
  expect(Array.isArray(raw.ec)).toBe(true);
  expect(Array.isArray(raw.ic)).toBe(true);
  expect(raw.ec).toEqual([]);
  expect(raw.ic).toEqual([]);
});
