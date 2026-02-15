/**
 * Shared low-level Google Sheets API utilities.
 */

import { tryRepairDate } from "@/lib/dateRepair";

/** Base URL for the Google Sheets v4 REST API. */
export const SHEETS_API = "https://sheets.googleapis.com/v4/spreadsheets";

/** Generate a unique ID for new records. */
export function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

/** Parse a cell value as a positive number, stripping currency/commas. Returns null if invalid. */
export function parseAmount(value: unknown): number | null {
  if (typeof value === "number" && !Number.isNaN(value)) return value;
  const s = String(value ?? "").replace(/[$,\s]/g, "");
  const n = parseFloat(s);
  return Number.isNaN(n) ? null : n;
}

const ISO_DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

/** Normalize a date value from Sheets: may be ISO string, serial number, or corrupted. */
export function normalizeDate(value: unknown): string | null {
  if (value == null) return null;
  const s = String(value).trim();
  if (ISO_DATE_PATTERN.test(s)) return s;
  return tryRepairDate(s);
}

/** Test whether a string looks like an ISO date (YYYY-MM-DD). */
export function looksLikeIsoDate(value: string): boolean {
  return ISO_DATE_PATTERN.test(value.trim());
}

/** Normalize category values read from sheets: blank or "Uncategorized" becomes "". */
export function normalizeCategoryFromSheet(value: string): string {
  const t = value.trim();
  if (!t || t.toLowerCase() === "uncategorized") return "";
  return t;
}

/** Parse an owner cell value, returning the trimmed string. */
export function parseOwner(value: unknown): string {
  return String(value ?? "").trim();
}

/** Extract the spreadsheet ID from a full Google Sheets URL or return the raw ID. */
export function extractSpreadsheetId(urlOrId: string): string | null {
  const match = urlOrId.match(/\/d\/([a-zA-Z0-9-_]+)/);
  return match ? match[1]! : urlOrId;
}

/** Read values from a given range in a spreadsheet. */
export async function getSheetValues(
  accessToken: string,
  spreadsheetId: string,
  range: string,
  valueRenderOption: "FORMATTED_VALUE" | "UNFORMATTED_VALUE" = "FORMATTED_VALUE",
): Promise<unknown[][]> {
  const params = new URLSearchParams({ valueRenderOption });
  const url = `${SHEETS_API}/${spreadsheetId}/values/${encodeURIComponent(range)}?${params}`;
  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Sheets read failed: ${res.status} ${err}`);
  }
  const data = (await res.json()) as { values?: unknown[][] };
  const values = data.values;
  if (!Array.isArray(values) || values.length === 0) return [];
  return values.map((row) => (Array.isArray(row) ? [...row] : []));
}

/** Clear a range in a spreadsheet. */
export async function clearRange(
  accessToken: string,
  spreadsheetId: string,
  range: string,
): Promise<void> {
  const url = `${SHEETS_API}/${spreadsheetId}/values/${encodeURIComponent(range)}:clear`;
  const res = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({}),
  });
  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Sheets clear failed: ${res.status} ${err}`);
  }
}

/** Write values to a range (PUT for overwrite, POST+append for appending). */
export async function updateSheet(
  accessToken: string,
  spreadsheetId: string,
  range: string,
  values: unknown[][],
  append: boolean,
): Promise<void> {
  const url = append
    ? `${SHEETS_API}/${spreadsheetId}/values/${encodeURIComponent(range)}:append?valueInputOption=USER_ENTERED`
    : `${SHEETS_API}/${spreadsheetId}/values/${encodeURIComponent(range)}?valueInputOption=USER_ENTERED`;
  const method = append ? "POST" : "PUT";
  const res = await fetch(url, {
    method,
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ values }),
  });
  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Sheets update failed: ${res.status} ${err}`);
  }
}
