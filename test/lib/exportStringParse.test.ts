import { test, expect } from "bun:test";
import { serializeToBlob, parseFromBlob } from "@/lib/minifiedPayload";
import { parseExportedPdfData } from "@/lib/pdfExport";

test("parseExportedPdfData reads V2 blob between markers", () => {
  const blob = serializeToBlob({
    expenses: [
      {
        id: "exp-1",
        date: "2025-01-01",
        amount: 12,
        description: "Coffee",
        category: "Food",
        source: "manual",
      },
    ],
    income: [],
    debts: [],
    debtPayments: [],
    presetTransactions: [],
    expenseCategoriesWithColors: [{ name: "Food", color: "#fff" }],
    incomeCategoriesWithColors: [],
    owners: ["Alex"],
    cardSources: ["amex"],
  });

  const text = `BUDGET_TOOL_DATA_START ${blob} BUDGET_TOOL_DATA_END`;
  const parsed = parseExportedPdfData(text);
  expect(parsed.expenses[0]?.id).toBe("exp-1");
  expect(parsed.owners?.[0]).toBe("Alex");
});

test("parseFromBlob parses raw V2 export string", () => {
  const blob = serializeToBlob({
    expenses: [
      {
        id: "exp-2",
        date: "2025-02-01",
        amount: 50,
        description: "Groceries",
        category: "Food",
        source: "manual",
      },
    ],
    income: [],
    debts: [],
    debtPayments: [],
    presetTransactions: [],
    expenseCategoriesWithColors: [],
    incomeCategoriesWithColors: [],
  });

  const expanded = parseFromBlob(blob);
  expect(expanded.expenses[0]?.id).toBe("exp-2");
});
