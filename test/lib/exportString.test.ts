import { test, expect } from "bun:test";
import { buildExportString } from "@/lib/exportString";
import { parseExportedPdfData } from "@/lib/pdfExport";

test("buildExportString produces markers + V2 blob", () => {
  const text = buildExportString(
    [
      {
        id: "exp-1",
        date: "2025-01-01",
        amount: 25,
        description: "Lunch",
        category: "Food",
        source: "manual",
      },
    ],
    [],
    [],
    [],
    [],
    [{ name: "Food", color: "#fff" }],
    [],
  );
  expect(text).toContain("BUDGET_TOOL_DATA_START");
  expect(text).toContain("BUDGET_TOOL_DATA_END");
  const parsed = parseExportedPdfData(text);
  expect(parsed.expenses[0]?.id).toBe("exp-1");
});
