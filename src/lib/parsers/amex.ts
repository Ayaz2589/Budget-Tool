import type { Expense, ParseResult } from "@/lib/types";

function hashId(date: string, description: string, amount: number, cardMember: string): string {
  const str = `${date}|${description}|${amount}|${cardMember}`;
  let h = 0;
  for (let i = 0; i < str.length; i++) {
    const c = str.charCodeAt(i);
    h = (h << 5) - h + c;
    h |= 0;
  }
  return `amex-${Math.abs(h).toString(36)}`;
}

function parseAmexDate(value: string): string {
  // MM/DD/YYYY or MM/DD/YY
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
    const cardMember = cardIdx >= 0 ? (values[cardIdx] ?? "").trim() : "";
    const amount = parseAmount(values[amountIdx] ?? "0");

    if (!dateRaw || amount <= 0) continue;

    const date = parseAmexDate(dateRaw);
    const id = hashId(date, rawDescription, amount, cardMember);

    expenses.push({
      id,
      date,
      amount,
      description,
      category: "",
      source: "amex",
      cardMember: cardMember || undefined,
    });
  }

  return { expenses, source: "amex" };
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
