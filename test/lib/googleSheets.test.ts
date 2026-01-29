import { test, expect } from "bun:test";
import { extractSpreadsheetId } from "@/lib/googleSheets";

test("extractSpreadsheetId extracts id from URL", () => {
  const url =
    "https://docs.google.com/spreadsheets/d/1abc_def-123/edit#gid=0";
  expect(extractSpreadsheetId(url)).toBe("1abc_def-123");
});

test("extractSpreadsheetId returns raw id when no /d/", () => {
  expect(extractSpreadsheetId("1abc_def-123")).toBe("1abc_def-123");
});

test("extractSpreadsheetId handles URL with path", () => {
  const url =
    "https://docs.google.com/spreadsheets/d/xyz789/view";
  expect(extractSpreadsheetId(url)).toBe("xyz789");
});
