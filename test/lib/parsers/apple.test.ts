import { test, expect } from "bun:test";
import { parseAppleCsv } from "@/lib/parsers/apple";

test("parseAppleCsv parses purchase rows", () => {
  const csv = `Transaction Date,Clearing Date,Description,Merchant,Category,Type,Amount (USD),Purchased By
02/01/2026,02/02/2026,Coffee Shop,Coffee,Food,Purchase,$5.25,Ayaz`;

  const result = parseAppleCsv(csv);
  expect(result.source).toBe("apple");
  expect(result.expenses.length).toBe(1);
  expect(result.expenses[0]?.date).toBe("2026-02-01");
  expect(result.expenses[0]?.amount).toBe(5.25);
  expect(result.expenses[0]?.owner).toBe("Ayaz");
});

test("parseAppleCsv skips payment rows", () => {
  const csv = `Transaction Date,Clearing Date,Description,Merchant,Category,Type,Amount (USD),Purchased By
02/01/2026,02/02/2026,Payment,,Payment,Payment,$100.00,Ayaz`;

  const result = parseAppleCsv(csv);
  expect(result.expenses).toEqual([]);
});

test("parseAppleCsv returns empty when required columns are missing", () => {
  const csv = `Date,Description,Amount
02/01/2026,Coffee,5`;

  const result = parseAppleCsv(csv);
  expect(result.expenses).toEqual([]);
});
