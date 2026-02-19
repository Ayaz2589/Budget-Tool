/**
 * Low-level HTTP transport for Google Sheets v4 REST API.
 * Wraps fetch errors in typed SheetsDbError instances.
 */

import { authError, rateLimitError, networkError, apiError } from "./errors";

export const SHEETS_API = "https://sheets.googleapis.com/v4/spreadsheets";

export interface TransportContext {
  token: string;
  spreadsheetId: string;
}

export function extractSpreadsheetId(urlOrId: string): string | null {
  const match = urlOrId.match(/\/d\/([a-zA-Z0-9-_]+)/);
  return match ? match[1]! : urlOrId;
}

function wrapHttpError(status: number, body: string, cause?: unknown): never {
  if (status === 401) {
    throw authError(`Authentication failed: ${status} ${body}`, cause);
  }
  if (status === 429) {
    throw rateLimitError(`Rate limited: ${status} ${body}`, undefined, cause);
  }
  throw apiError(`Sheets API error: ${status} ${body}`, cause);
}

async function fetchWithErrorHandling(
  url: string,
  init: RequestInit,
): Promise<Response> {
  let res: Response;
  try {
    res = await fetch(url, init);
  } catch (err) {
    throw networkError(
      `Network request failed: ${err instanceof Error ? err.message : String(err)}`,
      err,
    );
  }
  if (!res.ok) {
    const body = await res.text();
    wrapHttpError(res.status, body, res);
  }
  return res;
}

export async function getSheetValues(
  ctx: TransportContext,
  range: string,
  valueRenderOption: "FORMATTED_VALUE" | "UNFORMATTED_VALUE" = "FORMATTED_VALUE",
): Promise<unknown[][]> {
  const params = new URLSearchParams({ valueRenderOption });
  const url = `${SHEETS_API}/${ctx.spreadsheetId}/values/${encodeURIComponent(range)}?${params}`;
  const res = await fetchWithErrorHandling(url, {
    headers: { Authorization: `Bearer ${ctx.token}` },
  });
  const data = (await res.json()) as { values?: unknown[][] };
  const values = data.values;
  if (!Array.isArray(values) || values.length === 0) return [];
  return values.map((row) => (Array.isArray(row) ? [...row] : []));
}

export async function updateSheet(
  ctx: TransportContext,
  range: string,
  values: unknown[][],
  append: boolean,
): Promise<void> {
  const url = append
    ? `${SHEETS_API}/${ctx.spreadsheetId}/values/${encodeURIComponent(range)}:append?valueInputOption=USER_ENTERED`
    : `${SHEETS_API}/${ctx.spreadsheetId}/values/${encodeURIComponent(range)}?valueInputOption=USER_ENTERED`;
  const method = append ? "POST" : "PUT";
  await fetchWithErrorHandling(url, {
    method,
    headers: {
      Authorization: `Bearer ${ctx.token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ values }),
  });
}

export async function clearRange(
  ctx: TransportContext,
  range: string,
): Promise<void> {
  const url = `${SHEETS_API}/${ctx.spreadsheetId}/values/${encodeURIComponent(range)}:clear`;
  await fetchWithErrorHandling(url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${ctx.token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({}),
  });
}
