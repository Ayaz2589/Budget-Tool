import type { ParseResult } from "@/types/core";
import type { CsvSource } from "@/types/import";
import { parseAmexCsv } from "./amex";
import { parseChaseCsv } from "./chase";
import { parseAppleCsv } from "./apple";

export type { CsvSource } from "@/types/import";

const STRIP_BOM = /^\uFEFF/;

export function detectCsvSource(csvText: string): CsvSource {
  const trimmed = csvText.replace(STRIP_BOM, "").trim();
  const firstLine = trimmed.split(/\r?\n/)[0] ?? "";
  const lower = firstLine.toLowerCase();
  if (lower.includes("card member") && lower.includes("amount") && lower.includes("description")) {
    return "amex";
  }
  if (lower.includes("chase")) return "chase";
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
  const cleanText = csvText.replace(STRIP_BOM, "").trim();
  const detected = source ?? detectCsvSource(cleanText);
  switch (detected) {
    case "amex":
      return parseAmexCsv(cleanText);
    case "chase":
      return parseChaseCsv(cleanText);
    case "apple":
      return parseAppleCsv(cleanText);
    default:
      return { expenses: [], source: "amex" };
  }
}

export { parseAmexCsv, cleanDescription } from "./amex";
export { parseChaseCsv, parseChasePdfFromText } from "./chase";
export { parseAppleCsv } from "./apple";
