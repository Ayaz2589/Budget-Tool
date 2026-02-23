/**
 * Repair corrupted date values (e.g. from Google Sheets when Date column
 * was mistakenly formatted as currency, producing "$46,038" or serial numbers).
 */

const ISO_DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

export function isValidDate(date: string): boolean {
  return ISO_DATE_PATTERN.test(date);
}

/** Convert Google Sheets serial date (days since 1899-12-30) to YYYY-MM-DD. */
function serialToIsoDate(serial: number): string {
  const epoch = new Date(1899, 11, 30).getTime();
  const ms = serial * 86400000 + epoch;
  const d = new Date(ms);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

/**
 * Try to normalize a corrupted date value to YYYY-MM-DD.
 * Returns null if the value cannot be converted.
 */
export function tryRepairDate(value: string): string | null {
  if (ISO_DATE_PATTERN.test(value.trim())) return value.trim();
  const num = parseFloat(value.replace(/[$,\s]/g, ""));
  if (!Number.isNaN(num) && num > 0 && num < 1000000) {
    return serialToIsoDate(num);
  }
  return null;
}
