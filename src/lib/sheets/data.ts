/**
 * Read/write operations for the Data sheet (minified V2 blob in cell A1).
 */

import type { SheetsClient } from "./client";

/** Write the minified V2 blob to the Data sheet (single cell A1). */
export async function writeDataBlob(
  db: SheetsClient,
  blob: string,
): Promise<void> {
  await db.raw.writeRange("Data!A1", [[blob]]);
}

/** Read the minified V2 blob from the Data sheet (A1). Returns null if empty or missing. */
export async function readDataBlob(
  db: SheetsClient,
): Promise<string | null> {
  const rows = await db.raw.readRange("Data!A1", "UNFORMATTED_VALUE");
  if (!rows.length || !rows[0]?.length) return null;
  const value = String(rows[0][0] ?? "").trim();
  return value || null;
}
