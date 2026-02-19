/**
 * Ortho domain layer for Google Sheets persistence.
 * Uses the generic sheets-db library with Ortho-specific schemas.
 */

import { createSheetsClient } from "@/lib/sheets-db";
import { ORTHO_SCHEMAS } from "./schemas";

export function createOrthoSheetsClient(config: { token: string; spreadsheetId: string }) {
  return createSheetsClient({ ...config, schemas: ORTHO_SCHEMAS });
}

// Re-export schemas
export { ORTHO_SCHEMAS } from "./schemas";
export {
  expenseSchema,
  mortgageSchema,
  incomeSchema,
  debtSchema,
  debtPaymentSchema,
  ownerTransferSchema,
  presetSchema,
  totalsSchema,
  dataBlobSchema,
} from "./schemas";

// Re-export domain types
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
  SyncPayload,
} from "./types";
export { ALL_EXPENSE_SOURCES } from "./types";

// Re-export domain validators
export {
  normalizeCategoryFromSheet,
  parseOwner,
  validateExpenseSource,
  validateExpense,
  validateIncome,
  validateDebt,
  validateDebtPayment,
  validateOwnerTransfer,
  validatePresetTransaction,
} from "./normalize";

// Re-export totals utilities
export { buildTotalsHeaders, buildTotalsRow } from "./schemas/totals";
