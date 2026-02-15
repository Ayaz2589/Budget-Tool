/**
 * Backward-compatible barrel re-export.
 *
 * The Google Sheets integration has been split into focused modules under
 * `@/lib/sheets/`. This file re-exports everything so existing consumers
 * (`@/lib/googleSheets`) continue to work without import changes.
 */
export {
  // API utilities
  extractSpreadsheetId,
  getSheetValues,

  // Expense read/write
  readExpensesFromSheet,
  readMortgageFromSheet,
  appendExpenses,
  clearAndWriteExpenses,
  clearAndWriteMortgage,

  // Income read/write
  readIncomeFromSheet,
  appendIncome,
  clearAndWriteIncome,

  // Debt read/write
  readDebtsFromSheet,
  readDebtPaymentsFromSheet,
  clearAndWriteDebts,
  clearAndWriteDebtPayments,

  // Transfer & preset read/write
  readOwnerTransfersFromSheet,
  readPresetsFromSheet,
  clearAndWritePresets,

  // Data blob
  writeDataBlob,
  readDataBlob,

  // Totals
  writeTotalsSheet,

  // Sync & structure
  syncAllSheetsBatch,
  getSheetIds,
  ensureSheetsExist,
  applySheetsFormatting,
} from "./sheets";

export type { SheetIds, SyncPayload } from "./sheets";
