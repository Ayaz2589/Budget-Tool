import type { ParseResult } from "@/lib/types";

/**
 * Chase CSV parser stub.
 * Add implementation when you have a sample Chase CSV (columns may differ).
 * Expected: date, description, amount; detect credits vs debits for expenses.
 */
export function parseChaseCsv(_csvText: string): ParseResult {
  return { expenses: [], source: "chase" };
}
