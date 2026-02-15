import type { Expense, ParseResult } from "@/lib/types";
import { cleanDescription } from "./amex";
import { hashId, parseAmount, parseCsvLine, parseDate, stripBom } from "./csv-utils";

/**
 * Apple Card CSV: Transaction Date, Clearing Date, Description, Merchant,
 * Category, Type, Amount (USD), Purchased By.
 * We import Purchase and Installment rows only (skip Payment).
 */
export function parseAppleCsv(csvText: string): ParseResult {
  const cleanText = stripBom(csvText).trim();
  const lines = cleanText.split(/\r?\n/);
  if (lines.length < 2) return { expenses: [], source: "apple" };

  const headerLine = lines[0];
  const cols = parseCsvLine(headerLine).map((c) => stripBom(c.trim()));
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

    const date = parseDate(dateRaw);
    const id = hashId("apple", date, rawDescription, String(amount), purchasedBy);

    expenses.push({
      id,
      date,
      amount,
      description,
      category: "",
      source: "apple",
      owner: purchasedBy || undefined,
    });
  }

  return { expenses, source: "apple" };
}
