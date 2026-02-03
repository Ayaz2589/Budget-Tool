import { test, expect } from "bun:test";
import pako from "pako";
import { serializeToBlob } from "@/lib/minifiedPayload";
import { parseExportedPdfData } from "@/lib/pdfExport";

const DATA_START = "BUDGET_TOOL_DATA_START";
const DATA_END = "BUDGET_TOOL_DATA_END";

test("parseExportedPdfData returns empty when no block", () => {
  const result = parseExportedPdfData("random text");
  expect(result.expenses).toEqual([]);
  expect(result.income).toEqual([]);
});

test("parseExportedPdfData returns empty for legacy EXPENSE block (V2 only)", () => {
  const block = `BUDGET_TOOL_DATA_START
EXPENSE@@e1@@2025-01-15@@10.50@@Coffee@@50/50@@manual@@
BUDGET_TOOL_DATA_END`;
  const result = parseExportedPdfData(block);
  expect(result.expenses).toEqual([]);
  expect(result.income).toEqual([]);
});

test("parseExportedPdfData returns empty for legacy INCOME block (V2 only)", () => {
  const block = `BUDGET_TOOL_DATA_START
INCOME@@i1@@2025-01-01@@3000@@Paycheck@@Paycheck@@Ayaz@@
BUDGET_TOOL_DATA_END`;
  const result = parseExportedPdfData(block);
  expect(result.expenses).toEqual([]);
  expect(result.income).toEqual([]);
});

test("parseExportedPdfData returns empty for block that does not start with V2", () => {
  const block = `BUDGET_TOOL_DATA_ START EXPENSE@@e1@@2025-01-01@@1@@X@@Y@@manual@@ BUDGET_TOOL_DATA_END`;
  const result = parseExportedPdfData(block);
  expect(result.expenses).toEqual([]);
  expect(result.income).toEqual([]);
});

test("parseExportedPdfData V2 round-trip using serializeToBlob (export path includes categories)", () => {
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
        id: "income-2025-01-01-paycheck-3000",
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
  const v2Block = serializeToBlob(input);
  const pdfText = `${DATA_START}\n${v2Block}\n${DATA_END}`;
  const result = parseExportedPdfData(pdfText);

  expect(result.expenses).toHaveLength(1);
  expect(result.expenses[0]!.id).toBe("manual-e1");
  expect(result.expenses[0]!.date).toBe("2025-01-15");
  expect(result.expenses[0]!.amount).toBe(10.5);
  expect(result.expenses[0]!.description).toBe("Coffee");
  expect(result.expenses[0]!.category).toBe("50/50");
  expect(result.expenses[0]!.source).toBe("manual");

  expect(result.income).toHaveLength(1);
  expect(result.income[0]!.id).toBe("income-2025-01-01-paycheck-3000");
  expect(result.income[0]!.amount).toBe(3000);
  expect(result.income[0]!.category).toBe("Paycheck");

  expect(result.debts).toHaveLength(1);
  expect(result.debts[0]!.id).toBe("d1");
  expect(result.debts[0]!.name).toBe("Loan");
  expect(result.debts[0]!.initialAmount).toBe(5000);
  expect(result.debts[0]!.owner).toBe("Ayaz");

  expect(result.debtPayments).toHaveLength(1);
  expect(result.debtPayments[0]!.id).toBe("dp1");
  expect(result.debtPayments[0]!.debtId).toBe("d1");
  expect(result.debtPayments[0]!.amount).toBe(200);

  expect(result.presetTransactions).toHaveLength(1);
  expect(result.presetTransactions[0]!.id).toBe("preset-1");
  expect(result.presetTransactions[0]!.source).toBe("manual");

  expect(result.expenseCategoriesWithColors).toEqual([
    { name: "50/50", color: "blue" },
    { name: "Amazon", color: "orange" },
  ]);
  expect(result.incomeCategoriesWithColors).toEqual([
    { name: "Paycheck", color: "green" },
  ]);
  expect(result.cardSources).toEqual(["amex", "chase", "manual"]);
});

test("parseExportedPdfData V2 with whitespace in Base64: strips and decodes", () => {
  const payload = { expenses: [], income: [], debts: [], debtPayments: [], presetTransactions: [] };
  const jsonString = JSON.stringify(payload);
  const compressed = pako.gzip(new TextEncoder().encode(jsonString));
  let binary = "";
  for (let i = 0; i < compressed.length; i++) {
    binary += String.fromCharCode(compressed[i]!);
  }
  const base64 = btoa(binary);
  const v2WithNewlines = "V2" + base64.replace(/(.{40})/g, "$1\n");
  const pdfText = `${DATA_START}\n${v2WithNewlines}\n${DATA_END}`;
  const result = parseExportedPdfData(pdfText);
  expect(result.expenses).toEqual([]);
  expect(result.income).toEqual([]);
  expect(result.debts).toEqual([]);
  expect(result.debtPayments).toEqual([]);
  expect(result.presetTransactions).toEqual([]);
});

test("parseExportedPdfData table fallback when no data block: parses expense and income rows", () => {
  const pdfText =
    "January 2026 ID Date Description Amount amex-abc123 2026-01-15 Coffee Shop $12.50 50/50 American Express AYAZ UDDIN " +
    "2026-01-31 Paycheck $4,178.40 Paycheck ";
  const result = parseExportedPdfData(pdfText);
  expect(result.expenses).toHaveLength(1);
  expect(result.expenses[0]!.id).toBe("amex-abc123");
  expect(result.expenses[0]!.date).toBe("2026-01-15");
  expect(result.expenses[0]!.amount).toBe(12.5);
  expect(result.expenses[0]!.source).toBe("amex");
  expect(result.income).toHaveLength(1);
  expect(result.income[0]!.date).toBe("2026-01-31");
  expect(result.income[0]!.description).toBe("Paycheck");
  expect(result.income[0]!.amount).toBe(4178.4);
  expect(result.debts).toEqual([]);
  expect(result.debtPayments).toEqual([]);
  expect(result.presetTransactions).toEqual([]);
});

test("parseExportedPdfData V2 minified (short-key) format: parses correctly", () => {
  const payload = {
    e: [{ i: "manual-x1", d: "2025-02-01", a: 25, desc: "Lunch", c: "50/50", s: "manual" }],
    i: [{ i: "inc-1", d: "2025-02-01", a: 3000, desc: "Paycheck", c: "Paycheck" }],
    d: [],
    dp: [],
    pt: [],
  };
  const jsonString = JSON.stringify(payload);
  const compressed = pako.gzip(new TextEncoder().encode(jsonString));
  let binary = "";
  for (let i = 0; i < compressed.length; i++) {
    binary += String.fromCharCode(compressed[i]!);
  }
  const base64 = btoa(binary);
  const pdfText = `${DATA_START}\nV2${base64}\n${DATA_END}`;
  const result = parseExportedPdfData(pdfText);
  expect(result.expenses).toHaveLength(1);
  expect(result.expenses[0]!.id).toBe("manual-x1");
  expect(result.expenses[0]!.amount).toBe(25);
  expect(result.expenses[0]!.category).toBe("50/50");
  expect(result.income).toHaveLength(1);
  expect(result.income[0]!.amount).toBe(3000);
  expect(result.debts).toEqual([]);
  expect(result.debtPayments).toEqual([]);
});

test("parsed PDF result with categories yields names for setExpenseCategories/setIncomeCategories (app contract)", () => {
  const parsed = {
    expenses: [],
    income: [],
    debts: [],
    debtPayments: [],
    presetTransactions: [],
    expenseCategoriesWithColors: [
      { name: "50/50", color: "blue" },
      { name: "Amazon", color: "orange" },
    ],
    incomeCategoriesWithColors: [{ name: "Paycheck", color: "green" }],
  };
  const expenseNames = Array.isArray(parsed.expenseCategoriesWithColors)
    ? parsed.expenseCategoriesWithColors.map((x) => x.name)
    : [];
  const incomeNames = Array.isArray(parsed.incomeCategoriesWithColors)
    ? parsed.incomeCategoriesWithColors.map((x) => x.name)
    : [];
  expect(expenseNames).toEqual(["50/50", "Amazon"]);
  expect(incomeNames).toEqual(["Paycheck"]);
});
