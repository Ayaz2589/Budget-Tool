/**
 * Public API barrel for the Google Sheets database layer.
 */

export { createSheetsClient } from "./client";
export type { SheetsDbClient, ExpenseRepository, EntityRepository, TotalsRepository, DataBlobRepository } from "./client";

export type {
  Expense,
  Income,
  Debt,
  DebtPayment,
  OwnerTransfer,
  PresetTransaction,
  ExpenseSource,
  ExpenseAllocation,
  MonthTotals,
  SheetIds,
  SheetsDbConfig,
  SyncPayload,
} from "./types";
export { ALL_EXPENSE_SOURCES } from "./types";

export { SheetsDbError, isSheetsDbError } from "./errors";
export type { SheetsDbErrorKind, ValidationIssue } from "./errors";

export { extractSpreadsheetId } from "./transport";
