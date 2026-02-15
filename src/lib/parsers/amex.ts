import type { Expense, ParseResult } from "@/lib/types";
import { hashId, parseAmount, parseCsvLine, parseDate } from "./csv-utils";

/**
 * Clean Amex/Apple Pay description for display: remove prefix, domains, normalize spaces.
 */
export function cleanDescription(raw: string): string {
  let s = raw.trim();
  // Remove "AplPay " (Apple Pay) prefix
  s = s.replace(/^AplPay\s+/i, "");
  // Remove trailing " domain.com/whatever XX" (website + 2-letter state)
  s = s.replace(/\s+[\w.-]+\.(com|org|net|io)(\/[\w./]*)?\s+[A-Z]{2}$/i, "");
  // Remove trailing " SOMETHING/BILL XX" (e.g. AMZN.COM/BILL WA)
  s = s.replace(/\s+[\w.-]+\/[\w.]+\s+[A-Z]{2}$/i, "");
  // Collapse multiple spaces and trim
  s = s.replace(/\s+/g, " ").trim();
  return s || raw.trim();
}

export function parseAmexCsv(csvText: string): ParseResult {
  const lines = csvText.trim().split(/\r?\n/);
  if (lines.length < 2) return { expenses: [], source: "amex" };

  const cols = lines[0].split(",").map((c) => c.trim().toLowerCase());
  const dateIdx = cols.indexOf("date");
  const descIdx = cols.indexOf("description");
  const cardIdx = cols.indexOf("card member");
  const amountIdx = cols.indexOf("amount");

  if (dateIdx === -1 || descIdx === -1 || amountIdx === -1) {
    return { expenses: [], source: "amex" };
  }

  const expenses: Expense[] = [];

  for (let i = 1; i < lines.length; i++) {
    const line = lines[i];
    const values = parseCsvLine(line);
    const dateRaw = values[dateIdx] ?? "";
    const rawDescription = (values[descIdx] ?? "").trim();
    const description = cleanDescription(rawDescription);
    const owner = cardIdx >= 0 ? (values[cardIdx] ?? "").trim() : "";
    const amount = parseAmount(values[amountIdx] ?? "0");

    if (!dateRaw || amount <= 0) continue;

    const date = parseDate(dateRaw);
    const id = hashId("amex", date, rawDescription, String(amount), owner);

    expenses.push({
      id,
      date,
      amount,
      description,
      category: "",
      source: "amex",
      owner: owner || undefined,
    });
  }

  return { expenses, source: "amex" };
}
