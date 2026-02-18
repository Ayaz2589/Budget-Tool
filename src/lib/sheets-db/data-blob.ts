/**
 * Data blob repository for the sheets database layer.
 * Handles the opaque V2 backup blob stored in Data!A1.
 */

import type { TransportContext } from "./transport";
import { getSheetValues, updateSheet } from "./transport";
import { SHEET_RANGES, SHEET_WRITE_RANGES } from "./schema";

export async function readDataBlob(ctx: TransportContext): Promise<string | null> {
  const rows = await getSheetValues(ctx, SHEET_RANGES.dataCell, "UNFORMATTED_VALUE");
  if (!rows.length || !rows[0]?.length) return null;
  const value = String(rows[0][0] ?? "").trim();
  return value || null;
}

export async function writeDataBlob(ctx: TransportContext, blob: string): Promise<void> {
  await updateSheet(ctx, SHEET_WRITE_RANGES.data, [[blob]], false);
}
