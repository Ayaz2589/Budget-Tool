/**
 * Backward-compatible barrel re-export.
 *
 * The Google Sheets integration is split into:
 * - `@/lib/sheets-db/` — generic library (schema-driven)
 * - `@/lib/ortho-sheets/` — Ortho domain layer
 *
 * This file re-exports the public API so any legacy imports continue to work.
 */
export {
  createOrthoSheetsClient,
} from "./ortho-sheets";

export {
  extractSpreadsheetId,
  isSheetsDbError,
} from "./sheets-db";

export type {
  SheetsClient,
  SheetsClientConfig,
} from "./sheets-db";

export type {
  SyncPayload,
} from "./ortho-sheets";
