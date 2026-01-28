import type { Expense, ParseResult } from "@/lib/types";
import { cleanDescription } from "./amex";

function hashId(
  date: string,
  description: string,
  amount: number,
  purchasedBy: string
): string {
  const str = `${date}|${description}|${amount}|${purchasedBy}`;
  let h = 0;
  for (let i = 0; i < str.length; i++) {
    const c = str.charCodeAt(i);
    h = (h << 5) - h + c;
    h |= 0;
  }
  return `apple-${Math.abs(h).toString(36)}`;
}

function parseCsvLine(line: string): string[] {
  const result: string[] = [];
  let current = "";
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const c = line[i];
    if (c === '"') {
      inQuotes = !inQuotes;
    } else if (c === "," && !inQuotes) {
      result.push(current);
      current = "";
    } else {
      current += c;
    }
  }
  result.push(current);
  return result;
}

function parseAppleDate(value: string): string {
  // MM/DD/YYYY
  const parts = value.trim().split("/");
  if (parts.length !== 3) return value;
  const [m, d, y] = parts;
  const year = y!.length === 2 ? `20${y}` : y;
  const month = m!.padStart(2, "0");
  const day = d!.padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function parseAmount(value: string): number {
  const cleaned = value.replace(/[$,]/g, "").trim();
  const n = parseFloat(cleaned);
  return Number.isNaN(n) ? 0 : Math.abs(n);
}

/**
 * Apple Card CSV: Transaction Date, Clearing Date, Description, Merchant,
 * Category, Type, Amount (USD), Purchased By.
 * We import Purchase and Installment rows only (skip Payment).
 */
export function parseAppleCsv(csvText: string): ParseResult {
  const cleanText = csvText.replace(/^\uFEFF/, "").trim();
  const lines = cleanText.split(/\r?\n/);
  if (lines.length < 2) return { expenses: [], source: "apple" };

  const headerLine = lines[0];
  const cols = parseCsvLine(headerLine).map((c) => c.trim().replace(/^\uFEFF/, ""));
  const colLower = cols.map((c) => c.toLowerCase());

  const dateIdx = colLower.indexOf("transaction date");
  const descIdx = colLower.indexOf("description");
  const amountIdx = colLower.findIndex(
    (c) => c === "amount (usd)" || c === "amount"
  );
  const typeIdx = colLower.indexOf("type");
  const purchasedByIdx = colLower.indexOf("purchased by");

  if (dateIdx === -1 || descIdx === -1 || amountIdx === -1) {
    return { expenses: [], source: "apple" };
  }

  const expenses: Expense[] = [];

  for (let i = 1; i < lines.length; i++) {
    const values = parseCsvLine(lines[i]);
    const type = (values[typeIdx] ?? "").trim();
    // Skip payments (credits); import Purchase and Installment only
    if (type.toLowerCase() === "payment") continue;

    const dateRaw = values[dateIdx] ?? "";
    const rawDescription = (values[descIdx] ?? "").trim();
    const description = cleanDescription(rawDescription);
    const amount = parseAmount(values[amountIdx] ?? "0");
    const purchasedBy = purchasedByIdx >= 0 ? (values[purchasedByIdx] ?? "").trim() : "";

    if (!dateRaw || amount <= 0) continue;

    const date = parseAppleDate(dateRaw);
    const id = hashId(date, rawDescription, amount, purchasedBy);

    expenses.push({
      id,
      date,
      amount,
      description,
      category: "",
      source: "apple",
      cardMember: purchasedBy || undefined,
    });
  }

  return { expenses, source: "apple" };
}
