/**
 * Backward-compatible barrel re-export.
 *
 * The Google Sheets integration now lives in `@/lib/sheets-db/`.
 * This file re-exports the public API so any legacy imports continue to work.
 */
export {
  createSheetsClient,
  extractSpreadsheetId,
  isSheetsDbError,
} from "./sheets-db";

export type {
  SheetsDbClient,
  SheetsDbConfig,
  SyncPayload,
} from "./sheets-db";
