import type { ParseResult } from "@/types/core";
import type { CsvSource } from "@/types/import";
import { parseAmexCsv } from "./amex";
import { parseAppleCsv } from "./apple";
import { stripBom } from "./csv-utils";

export type { CsvSource } from "@/types/import";

export function detectCsvSource(csvText: string): CsvSource {
  const trimmed = stripBom(csvText).trim();
  const firstLine = trimmed.split(/\r?\n/)[0] ?? "";
  const lower = firstLine.toLowerCase();
  if (lower.includes("card member") && lower.includes("amount") && lower.includes("description")) {
    return "amex";
  }
  // Apple Card: Transaction Date, Clearing Date, Amount (USD), Purchased By
  if (
    lower.includes("transaction date") &&
    lower.includes("clearing date") &&
    lower.includes("amount (usd)")
  )
    return "apple";
  if (lower.includes("apple")) return "apple";
  return "unknown";
}

export function parseCsv(csvText: string, source?: CsvSource): ParseResult {
  const cleanText = stripBom(csvText).trim();
  const detected = source ?? detectCsvSource(cleanText);
  switch (detected) {
    case "amex":
      return parseAmexCsv(cleanText);
    case "apple":
      return parseAppleCsv(cleanText);
    default:
      return { expenses: [], source: "manual", error: "unknown-format" };
  }
}

export { parseAmexCsv, cleanDescription } from "./amex";
export { parseAppleCsv } from "./apple";
