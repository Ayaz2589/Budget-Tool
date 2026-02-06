import { test, expect, mock } from "bun:test";
import { buildExportString, downloadExportString } from "@/lib/exportString";
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

test("downloadExportString creates object URL and clicks anchor", () => {
  const createObjectURL = mock(() => "blob:test");
  const revokeObjectURL = mock(() => {});
  const originalCreate = URL.createObjectURL;
  const originalRevoke = URL.revokeObjectURL;
  URL.createObjectURL = createObjectURL as unknown as typeof URL.createObjectURL;
  URL.revokeObjectURL = revokeObjectURL as unknown as typeof URL.revokeObjectURL;

  const click = mock(() => {});
  const originalCreateElement = document.createElement.bind(document);
  const createElementMock = mock((tag: string) => {
    const el = originalCreateElement(tag);
    if (tag === "a") {
      (el as HTMLAnchorElement).click = click as unknown as () => void;
    }
    return el;
  });
  document.createElement = createElementMock as unknown as typeof document.createElement;

  downloadExportString("BUDGET_TOOL_DATA_START\nV2abc\nBUDGET_TOOL_DATA_END");

  expect(createObjectURL).toHaveBeenCalledTimes(1);
  expect(click).toHaveBeenCalledTimes(1);
  expect(revokeObjectURL).toHaveBeenCalledTimes(1);

  URL.createObjectURL = originalCreate;
  URL.revokeObjectURL = originalRevoke;
  document.createElement = originalCreateElement as typeof document.createElement;
});
