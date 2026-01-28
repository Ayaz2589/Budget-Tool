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

function parseChaseDate(
  value: string,
  statementYear?: number,
  statementMonth?: number,
): string {
  const parts = value.trim().split("/");
  if (parts.length === 3) {
    const [m, d, y] = parts;
    const year = y!.length === 2 ? `20${y}` : y;
    const month = m!.padStart(2, "0");
    const day = d!.padStart(2, "0");
    return `${year}-${month}-${day}`;
  }
  if (parts.length === 2 && statementYear != null && statementMonth != null) {
    const [m, d] = parts;
    const txMonth = parseInt(m!, 10);
    const month = m!.padStart(2, "0");
    const day = d!.padStart(2, "0");
    // e.g. statement 01/15/26, transaction 12/31 → Dec is before Jan, use prior year
    const year =
      txMonth > statementMonth ? statementYear - 1 : statementYear;
    return `${year}-${month}-${day}`;
  }
  if (parts.length === 2 && statementYear != null) {
    const [m, d] = parts;
    const month = m!.padStart(2, "0");
    const day = d!.padStart(2, "0");
    return `${statementYear}-${month}-${day}`;
  }
  return value;
}

/** Extract statement closing date (YYYY-MM-DD) from PDF text. */
function extractStatementClosing(pdfText: string): { year: number; month: number; day: number } | null {
  const m = pdfText.match(STATEMENT_CLOSING_RE);
  if (!m) return null;
  // Group 1-3: Opening/Closing Date ... - MM/DD/YY
  // Group 4-6: Statement Date: MM/DD/YY
  const mm = m[1] ?? m[4];
  const dd = m[2] ?? m[5];
  const yy = m[3] ?? m[6];
  if (!mm || !dd || !yy) return null;
  const year = yy.length === 2 ? 2000 + parseInt(yy, 10) : parseInt(yy, 10);
  const month = parseInt(mm, 10);
  const day = parseInt(dd, 10);
  if (month < 1 || month > 12 || day < 1 || day > 31) return null;
  return { year, month, day };
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
// Full date MM/DD/YY or MM/DD/YYYY
const DATE_REGEX_FULL = /\b(\d{1,2}\/\d{1,2}\/\d{2,4})\b/g;
// Transaction dates use MM/DD only (year from statement)
const DATE_REGEX_MMDD = /\b(\d{1,2}\/\d{1,2})\b(?!\/\d)/g;
// Statement period: "Opening/Closing Date MM/DD/YY - MM/DD/YY" or "Statement Date: MM/DD/YY"
const STATEMENT_CLOSING_RE =
  /(?:Opening\/Closing Date|Statement Date:?)\s*\d{1,2}\/\d{1,2}\/\d{2,4}\s*-\s*(\d{1,2})\/(\d{1,2})\/(\d{2,4})|Statement Date:\s*(\d{1,2})\/(\d{1,2})\/(\d{2,4})/i;

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

  const statementClosing = extractStatementClosing(normalized);
  const statementYear = statementClosing?.year;
  const statementMonth = statementClosing?.month;
  // Reject dates more than 45 days after statement closing (e.g. Equal Pay Promo expiration)
  const maxValidDate = statementClosing
    ? new Date(statementClosing.year, statementClosing.month - 1, statementClosing.day + 45)
    : null;

  let amountMatch: RegExpExecArray | null;
  AMOUNT_REGEX.lastIndex = 0;
  while ((amountMatch = AMOUNT_REGEX.exec(normalized)) !== null) {
    const amountRaw = amountMatch[1];
    const amount = parseAmount(amountRaw);
    if (amount <= 0) continue;

    const amountStart = amountMatch.index;
    const beforeAmount = normalized.slice(0, amountStart).trim();
    const nearAmount = beforeAmount.slice(-120); // Last 120 chars before amount (likely transaction line)

    // Prefer MM/DD (transaction format) within the transaction line; infer year from statement
    let transDate: string | null = null;
    let isMmdd = false;
    const mmddMatches = [...nearAmount.matchAll(DATE_REGEX_MMDD)];
    if (mmddMatches.length > 0 && statementYear != null) {
      const lastMmdd = mmddMatches[mmddMatches.length - 1];
      transDate = lastMmdd[1];
      isMmdd = true;
    }

    // Fallback: last full date (MM/DD/YY) before amount
    if (!transDate) {
      const fullMatches = [...beforeAmount.matchAll(DATE_REGEX_FULL)];
      if (fullMatches.length === 0) continue;
      const lastFull = fullMatches[fullMatches.length - 1];
      const parsed = parseChaseDate(lastFull[1]!);
      if (!/^\d{4}-\d{2}-\d{2}$/.test(parsed)) continue;
      // Reject dates far in future (Equal Pay Promo expiration, etc.)
      if (maxValidDate && new Date(parsed) > maxValidDate) continue;
      transDate = lastFull[1];
    }

    if (!transDate) continue;

    // Match transDate; for MM/DD avoid matching inside MM/DD/YY (e.g. 09/16 in 09/16/25)
    const datePattern = isMmdd
      ? transDate.replace(/\//g, "\\/") + "(?!/\\d)"
      : transDate.replace(/\//g, "\\/");
    const dateMatches = [...beforeAmount.matchAll(new RegExp(datePattern, "g"))];
    const lastDateMatch = dateMatches[dateMatches.length - 1];
    const dateEnd = lastDateMatch
      ? lastDateMatch.index! + lastDateMatch[0].length
      : beforeAmount.length;
    const descriptionRaw = beforeAmount.slice(dateEnd).trim();
    if (descriptionRaw.length < 2) continue;
    if (SKIP_PATTERNS.some((p) => p.test(descriptionRaw))) continue;
    if (/^[\d\s\-*]+$/.test(descriptionRaw)) continue;

    const date = parseChaseDate(transDate, statementYear, statementMonth);
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) continue;
    if (maxValidDate && new Date(date) > maxValidDate) continue;

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
