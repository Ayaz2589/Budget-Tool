/**
 * Minimal Google Sheets HTTP transport for data.ts and totals.ts.
 *
 * The 7 domain sheets are handled by genjutsu-db. These transport functions
 * remain for the two special-case sheets (Data blob, Totals) that are not
 * covered by model definitions.
 */

/** Base URL for the Google Sheets v4 REST API. */
const SHEETS_API = "https://sheets.googleapis.com/v4/spreadsheets";

/** A1-notation ranges for the Data and Totals sheets. */
export const DATA_RANGES = {
  dataRead: "Data!A1",
  dataWrite: "Data!A1",
  totalsWrite: "Totals!A1:Z100",
} as const;

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

/** Write values to a range (PUT for overwrite). */
export async function updateSheet(
  accessToken: string,
  spreadsheetId: string,
  range: string,
  values: unknown[][],
): Promise<void> {
  const url = `${SHEETS_API}/${spreadsheetId}/values/${encodeURIComponent(range)}?valueInputOption=USER_ENTERED`;
  const res = await fetch(url, {
    method: "PUT",
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
