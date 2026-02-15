/**
 * Google Sheets integration — barrel re-exports.
 *
 * All public API is re-exported here so consumers can import from
 * `@/lib/sheets` (or from `@/lib/googleSheets` for backward compatibility).
 */

// Shared API utilities
export {
  extractSpreadsheetId,
  getSheetValues,
  generateId,
  parseAmount,
  normalizeDate,
  looksLikeIsoDate,
  normalizeCategoryFromSheet,
  parseOwner,
  clearRange,
  updateSheet,
  SHEETS_API,
} from "./api";

// Constants
export {
  SHEET_NAMES,
  ALL_SHEET_TITLES,
  SHEET_RANGES,
  SHEET_WRITE_RANGES,
  SHEET_CLEAR_RANGES,
} from "./constants";

// Validation
export { validateExpenseSource, hasIdColumn, findMissingHeaders } from "./validate";

// Expenses
export {
  readExpensesFromSheet,
  readMortgageFromSheet,
  appendExpenses,
  clearAndWriteExpenses,
  clearAndWriteMortgage,
  buildExpensesValues,
} from "./expenses";

// Income
export {
  readIncomeFromSheet,
  appendIncome,
  clearAndWriteIncome,
  buildIncomeValues,
} from "./income";

// Debts
export {
  readDebtsFromSheet,
  readDebtPaymentsFromSheet,
  clearAndWriteDebts,
  clearAndWriteDebtPayments,
  buildDebtsValues,
  buildDebtPaymentsValues,
} from "./debts";

// Transfers & Presets
export {
  readOwnerTransfersFromSheet,
  readPresetsFromSheet,
  clearAndWritePresets,
  buildOwnerTransfersValues,
  buildPresetsValues,
} from "./transfers";

// Totals
export { writeTotalsSheet, buildTotalsValues } from "./totals";

// Data blob
export { writeDataBlob, readDataBlob } from "./data";

// Sync & structure
export type { SyncPayload } from "./sync";
export {
  syncAllSheetsBatch,
  getSheetIds,
  ensureSheetsExist,
} from "./sync";
export type { SheetIds } from "./sync";

// Formatting
export { applySheetsFormatting } from "./formatting";
