import { test, expect } from "bun:test";
import {
  detectCsvSource,
  parseCsv,
  parseAmexCsv,
  cleanDescription,
} from "@/lib/parsers";

test("detectCsvSource detects amex", () => {
  const header = "Date,Card Member,Description,Amount";
  expect(detectCsvSource(header)).toBe("amex");
});

test("detectCsvSource returns unknown for unsupported bank headers (legacy chase format)", () => {
  expect(detectCsvSource("Details,Posting Date,Description,Amount,Chase")).toBe(
    "unknown",
  );
});

test("detectCsvSource detects apple", () => {
  expect(
    detectCsvSource("Transaction Date,Clearing Date,Amount (USD),By"),
  ).toBe("apple");
});

test("detectCsvSource returns unknown for other", () => {
  expect(detectCsvSource("A,B,C")).toBe("unknown");
});

test("parseCsv with amex source parses expenses", () => {
  const csv = `Date,Card Member,Description,Amount
01/15/2025,Ayaz,Coffee,5.00`;
  const result = parseCsv(csv, "amex");
  expect(result.source).toBe("amex");
  expect(result.expenses.length).toBe(1);
  expect(result.expenses[0]!.description).toBe("Coffee");
  expect(result.expenses[0]!.amount).toBe(5);
  expect(result.expenses[0]!.date).toMatch(/^\d{4}-\d{2}-\d{2}$/);
});

test("parseCsv unknown returns empty", () => {
  const result = parseCsv("a,b,c", "unknown");
  expect(result.expenses).toEqual([]);
});

test("parseAmexCsv requires date description amount columns", () => {
  const csv = `Date,Description,Amount
01/15/2025,Coffee,5`;
  const result = parseAmexCsv(csv);
  expect(result.expenses.length).toBe(1);
  expect(result.expenses[0]!.amount).toBe(5);
});

test("cleanDescription removes AplPay prefix", () => {
  expect(cleanDescription("AplPay Starbucks")).toBe("Starbucks");
});

test("cleanDescription collapses spaces", () => {
  expect(cleanDescription("  a   b  ")).toBe("a b");
});
