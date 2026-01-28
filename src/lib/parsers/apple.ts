import type { ParseResult } from "@/lib/types";

/**
 * Apple Card CSV parser stub.
 * Add implementation when you have a sample Apple Card CSV (columns may differ).
 * Expected: date, description, amount; may include merchant or category.
 */
export function parseAppleCsv(_csvText: string): ParseResult {
  return { expenses: [], source: "apple" };
}
