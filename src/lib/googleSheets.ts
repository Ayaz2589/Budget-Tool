/**
 * Backward-compatible barrel re-export.
 *
 * Domain sheets are now handled by genjutsu-db. This file re-exports the
 * remaining special-case modules (Data blob, Totals) for consumers that
 * still import from `@/lib/googleSheets`.
 */
export {
  writeDataBlob,
  readDataBlob,
  writeTotalsSheet,
  buildTotalsValues,
  validateExpenseSource,
  createSheetsClient,
} from "./sheets";

export type { SheetsClient } from "./sheets";
