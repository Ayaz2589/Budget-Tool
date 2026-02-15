/**
 * Shared CSV parsing utilities used by bank-specific parsers.
 */

/** Regex to strip the UTF-8 BOM (Byte Order Mark) from file contents. */
export const STRIP_BOM = /^\uFEFF/;

/**
 * Strip the UTF-8 BOM from text if present.
 */
export function stripBom(text: string): string {
  return text.replace(STRIP_BOM, "");
}

/**
 * Parse a single CSV line, respecting double-quote quoting.
 * Handles quoted fields that contain commas.
 */
export function parseCsvLine(line: string): string[] {
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

/**
 * Parse a currency amount string into a positive number.
 * Strips `$`, commas, and whitespace. Returns the absolute value.
 * Returns 0 for unparseable values.
 */
export function parseAmount(value: string): number {
  const cleaned = value.replace(/[$,]/g, "").trim();
  const n = parseFloat(cleaned);
  return Number.isNaN(n) ? 0 : Math.abs(n);
}

/**
 * Parse a US-style date (MM/DD/YYYY or MM/DD/YY) into ISO format (YYYY-MM-DD).
 * Returns the original string if it cannot be parsed.
 */
export function parseDate(raw: string): string {
  const parts = raw.trim().split("/");
  if (parts.length !== 3) return raw;
  const [m, d, y] = parts;
  const year = y!.length === 2 ? `20${y}` : y;
  const month = m!.padStart(2, "0");
  const day = d!.padStart(2, "0");
  return `${year}-${month}-${day}`;
}

/**
 * Generate a deterministic hash ID from the given parts, prefixed with the
 * specified source label (e.g. "amex", "apple").
 */
export function hashId(prefix: string, ...parts: string[]): string {
  const str = parts.join("|");
  let h = 0;
  for (let i = 0; i < str.length; i++) {
    const c = str.charCodeAt(i);
    h = (h << 5) - h + c;
    h |= 0;
  }
  return `${prefix}-${Math.abs(h).toString(36)}`;
}
