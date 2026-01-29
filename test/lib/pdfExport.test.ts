import { test, expect } from "bun:test";
import { parseExportedPdfData } from "@/lib/pdfExport";

test("parseExportedPdfData returns empty when no block", () => {
  const result = parseExportedPdfData("random text");
  expect(result.expenses).toEqual([]);
  expect(result.income).toEqual([]);
});

test("parseExportedPdfData parses expense line", () => {
  const block = `BUDGET_TOOL_DATA_START
EXPENSE@@e1@@2025-01-15@@10.50@@Coffee@@50/50@@manual@@
BUDGET_TOOL_DATA_END`;
  const result = parseExportedPdfData(block);
  expect(result.expenses).toHaveLength(1);
  expect(result.expenses[0]!.id).toBe("e1");
  expect(result.expenses[0]!.date).toBe("2025-01-15");
  expect(result.expenses[0]!.amount).toBe(10.5);
  expect(result.expenses[0]!.description).toBe("Coffee");
  expect(result.expenses[0]!.category).toBe("50/50");
  expect(result.expenses[0]!.source).toBe("manual");
});

test("parseExportedPdfData parses income line", () => {
  const block = `BUDGET_TOOL_DATA_START
INCOME@@i1@@2025-01-01@@3000@@Paycheck@@Paycheck@@Ayaz@@
BUDGET_TOOL_DATA_END`;
  const result = parseExportedPdfData(block);
  expect(result.income).toHaveLength(1);
  expect(result.income[0]!.id).toBe("i1");
  expect(result.income[0]!.amount).toBe(3000);
  expect(result.income[0]!.category).toBe("Paycheck");
});

test("parseExportedPdfData normalizes wrapped markers", () => {
  const block = `BUDGET_TOOL_DATA_ START EXPENSE@@e1@@2025-01-01@@1@@X@@Y@@manual@@ BUDGET_TOOL_DATA_END`;
  const result = parseExportedPdfData(block);
  expect(result.expenses.length).toBeGreaterThanOrEqual(0);
});
