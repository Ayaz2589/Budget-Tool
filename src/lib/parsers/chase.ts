import type { Expense, ParseResult } from "@/lib/types";
import { cleanDescription } from "./amex";

/**
 * Chase does not provide CSV; statements are PDF only.
 * This parser extracts transaction lines from text extracted from a Chase
 * statement PDF (e.g. via PDF.js). Chase statements use:
 * Transaction Date, Post Date, Description, Amount
 * with dates as MM/DD/YYYY or MM/DD/YY and amounts as $X.XX or ($X.XX) for credits.
 */

const SKIP_PATTERNS = [
  /transaction\s+date/i,
  /post\s+date/i,
  /^description$/i,
  /^amount$/i,
  /account\s+summary/i,
  /payment\s+due\s+date/i,
  /new\s+balance/i,
  /minimum\s+payment/i,
  /page\s+\d+\s+of\s+\d+/i,
  /opening\/closing\s+date/i,
  /credit\s+limit/i,
  /previous\s+balance/i,
  /payments?\s*,?\s*credits?/i,
  /purchases/i,
  /^\d+\s+\d+\s+\d+\s+/, // calendar numbers
  /^order\s+number\s+/i, // "Order Number 111-4870783-4565813"
  /^merchant\s+name\s+or\s+transaction\s+description$/i,
  /^date\s+of\s+transaction$/i,
  /^payment\s+thank\s+you/i, // payment line description
  /^remit\s+coupon/i,
  /^total\s+fees\s+charged/i,
  /^total\s+interest\s+charged/i,
  /^year-to-date/i,
  /^equal\s+pay\s+promo/i,
  /^purchases\s+and\s+redemptions/i,
  /^payments\s+and\s+other\s+credits/i,
  /^split\s+transaction/i,
];

function parseChaseDate(value: string): string {
  const parts = value.trim().split("/");
  if (parts.length !== 3) return value;
  const [m, d, y] = parts;
  const year = y!.length === 2 ? `20${y}` : y;
  const month = m!.padStart(2, "0");
  const day = d!.padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function parseAmount(raw: string): number {
  const isCredit = raw.startsWith("(") && raw.endsWith(")");
  const isNegative = raw.startsWith("-");
  const cleaned = raw.replace(/[$,()]/g, "").trim();
  const n = parseFloat(cleaned);
  if (Number.isNaN(n)) return 0;
  const abs = Math.abs(n);
  // Preserve sign so we can skip payments/credits (amount <= 0)
  if (isCredit || isNegative) return -abs;
  return abs;
}

function hashId(date: string, description: string, amount: number): string {
  const str = `chase|${date}|${description}|${amount}`;
  let h = 0;
  for (let i = 0; i < str.length; i++) {
    const c = str.charCodeAt(i);
    h = (h << 5) - h + c;
    h |= 0;
  }
  return `chase-${Math.abs(h).toString(36)}`;
}

// Chase PDF amounts: $37.92, -$224.46, -224.46, 37.92, .99, ($12.34)
const AMOUNT_REGEX =
  /(-\$?[\d,]+\.\d{2}|\$[\d,]+\.\d{2}|\([\d,]+\.\d{2}\)|[\d,]+\.\d{2}(?!%|\d)|\.\d{2}(?!%|\d))/g;
const DATE_REGEX = /\b(\d{1,2}\/\d{1,2}\/\d{2,4})\b/g;

/**
 * Parse Chase statement text (from PDF) into expenses.
 * Only imports purchases (positive amounts). Credits/refunds (negative or in parens) are skipped.
 * Uses amount-first matching: find each amount, then look backward for the nearest date and use
 * the text between as description (handles PDF text without reliable line breaks).
 */
export function parseChasePdfFromText(pdfText: string): ParseResult {
  const expenses: Expense[] = [];
  const normalized = pdfText.replace(/\s+/g, " ").trim();
  const seen = new Set<string>();

  let amountMatch: RegExpExecArray | null;
  AMOUNT_REGEX.lastIndex = 0;
  while ((amountMatch = AMOUNT_REGEX.exec(normalized)) !== null) {
    const amountRaw = amountMatch[1];
    const amount = parseAmount(amountRaw);
    if (amount <= 0) continue;

    const amountStart = amountMatch.index;
    const beforeAmount = normalized.slice(0, amountStart).trim();
    // Find last date before this amount (transaction or post date)
    const dateMatches = [...beforeAmount.matchAll(DATE_REGEX)];
    if (dateMatches.length === 0) continue;
    const lastDateMatch = dateMatches[dateMatches.length - 1];
    const transDate = lastDateMatch[1];
    const dateEnd = lastDateMatch.index! + lastDateMatch[0].length;
    const descriptionRaw = beforeAmount.slice(dateEnd).trim();
    if (descriptionRaw.length < 2) continue;
    if (SKIP_PATTERNS.some((p) => p.test(descriptionRaw))) continue;
    // Skip if description is only digits/dashes (e.g. order number fragment)
    if (/^[\d\s\-*]+$/.test(descriptionRaw)) continue;

    const date = parseChaseDate(transDate);
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) continue;

    const description = cleanDescription(descriptionRaw);
    const id = hashId(date, description, amount);
    if (seen.has(id)) continue;
    seen.add(id);

    expenses.push({
      id,
      date,
      amount,
      description,
      category: "",
      source: "chase",
      cardMember: "AYAZ UDDIN",
    });
  }

  return { expenses, source: "chase" };
}

/**
 * Chase CSV parser stub (Chase does not provide CSV; use PDF + parseChasePdfFromText).
 */
export function parseChaseCsv(_csvText: string): ParseResult {
  return { expenses: [], source: "chase" };
}
