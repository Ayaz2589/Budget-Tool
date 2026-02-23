/**
 * Read/write operations for the Data sheet (minified V2 blob in cell A1).
 */

import { getSheetValues, updateSheet, DATA_RANGES } from "./transport";

/** Write the minified V2 blob to the Data sheet (single cell A1). */
export async function writeDataBlob(
  accessToken: string,
  spreadsheetId: string,
  blob: string,
): Promise<void> {
  await updateSheet(accessToken, spreadsheetId, DATA_RANGES.dataWrite, [[blob]]);
}

/** Read the minified V2 blob from the Data sheet (A1). Returns null if empty or missing. */
export async function readDataBlob(
  accessToken: string,
  spreadsheetId: string,
): Promise<string | null> {
  const rows = await getSheetValues(accessToken, spreadsheetId, DATA_RANGES.dataRead, "UNFORMATTED_VALUE");
  if (!rows.length || !rows[0]?.length) return null;
  const value = String(rows[0][0] ?? "").trim();
  return value || null;
}
