import type { ParseResult } from "@/lib/types";
import { parseAmexCsv } from "./amex";
import { parseChaseCsv } from "./chase";
import { parseAppleCsv } from "./apple";

export type CsvSource = "amex" | "chase" | "apple" | "unknown";

export function detectCsvSource(csvText: string): CsvSource {
  const firstLine = csvText.trim().split(/\r?\n/)[0] ?? "";
  const lower = firstLine.toLowerCase();
  if (lower.includes("card member") && lower.includes("amount") && lower.includes("description")) {
    return "amex";
  }
  // Chase/Apple: add header checks when we have sample CSVs
  if (lower.includes("chase")) return "chase";
  if (lower.includes("apple")) return "apple";
  return "unknown";
}

export function parseCsv(csvText: string, source?: CsvSource): ParseResult {
  const detected = source ?? detectCsvSource(csvText);
  switch (detected) {
    case "amex":
      return parseAmexCsv(csvText);
    case "chase":
      return parseChaseCsv(csvText);
    case "apple":
      return parseAppleCsv(csvText);
    default:
      return { expenses: [], source: "amex" };
  }
}

export { parseAmexCsv } from "./amex";
export { parseChaseCsv } from "./chase";
export { parseAppleCsv } from "./apple";
