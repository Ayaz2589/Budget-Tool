/**
 * genjutsu-db model definitions for all 7 domain schemas.
 *
 * Each model maps 1:1 to a Google Sheet tab. Two special cases (Data blob, Totals)
 * are handled outside the model system in data.ts and totals.ts.
 */

import { defineModel, field } from "genjutsu-db";
import type { FormattingRule, HeaderFormat } from "genjutsu-db";
import type { ExpenseSource } from "@/types/core";
import { ALL_EXPENSE_SOURCES } from "@/types/core";

// ---------------------------------------------------------------------------
// App-specific validation (not in genjutsu-db)
// ---------------------------------------------------------------------------

/** Validate that a raw source string is a known ExpenseSource; falls back to "manual". */
export function validateExpenseSource(rawSource: string): ExpenseSource {
  const lower = rawSource.trim().toLowerCase();
  return ALL_EXPENSE_SOURCES.includes(lower as ExpenseSource)
    ? (lower as ExpenseSource)
    : "manual";
}

// ---------------------------------------------------------------------------
// Shared formatting presets
// ---------------------------------------------------------------------------

const HEADER_FORMAT: HeaderFormat = {
  bold: true,
  fontSize: 12,
  horizontalAlignment: "LEFT",
};

function currencyRule(startCol: number, endCol: number): FormattingRule {
  return {
    startCol,
    endCol,
    startRow: 1,
    endRow: 10_000,
    horizontalAlignment: "LEFT",
    numberFormat: { type: "CURRENCY", pattern: "$#,##0.00" },
  };
}

function leftAlignRule(endCol: number): FormattingRule {
  return {
    startCol: 0,
    endCol,
    startRow: 0,
    endRow: 10_000,
    horizontalAlignment: "LEFT",
  };
}

// ---------------------------------------------------------------------------
// Expense Model → "Expenses" tab
// ---------------------------------------------------------------------------

export const ExpenseModel = defineModel("Expenses", {
  id: field.string().primaryKey(),
  date: field.string(),
  amount: field.number(),
  description: field.string(),
  category: field.string().optional().default(""),
  source: field.string().optional().default("manual"),
  owner: field.string().optional().default(""),
});

ExpenseModel.headerFormatting = HEADER_FORMAT;
ExpenseModel.formatting = [leftAlignRule(7), currencyRule(2, 3)];

// ---------------------------------------------------------------------------
// Mortgage Model → "Mortgage" tab (same schema, different sheet)
// ---------------------------------------------------------------------------

export const MortgageModel = defineModel("Mortgage", {
  id: field.string().primaryKey(),
  date: field.string(),
  amount: field.number(),
  description: field.string(),
  category: field.string().optional().default("Mortgage"),
  source: field.string().optional().default("manual"),
  owner: field.string().optional().default(""),
});

MortgageModel.headerFormatting = HEADER_FORMAT;
MortgageModel.formatting = [leftAlignRule(7), currencyRule(2, 3)];

// ---------------------------------------------------------------------------
// Income Model → "Income" tab
// ---------------------------------------------------------------------------

export const IncomeModel = defineModel("Income", {
  id: field.string().primaryKey(),
  date: field.string(),
  amount: field.number(),
  description: field.string(),
  category: field.string().optional().default(""),
  owner: field.string().optional().default(""),
});

IncomeModel.headerFormatting = HEADER_FORMAT;
IncomeModel.formatting = [leftAlignRule(6), currencyRule(2, 3)];

// ---------------------------------------------------------------------------
// Debt Model → "Debts" tab
// ---------------------------------------------------------------------------

export const DebtModel = defineModel("Debts", {
  id: field.string().primaryKey(),
  name: field.string(),
  initialAmount: field.number(),
  startDate: field.string().optional(),
  owner: field.string().optional().default(""),
});

DebtModel.headerFormatting = HEADER_FORMAT;
DebtModel.formatting = [leftAlignRule(5), currencyRule(2, 3)];

// ---------------------------------------------------------------------------
// DebtPayment Model → "DebtPayments" tab
// ---------------------------------------------------------------------------

export const DebtPaymentModel = defineModel("DebtPayments", {
  id: field.string().primaryKey(),
  debtId: field.string(),
  date: field.string(),
  amount: field.number(),
  note: field.string().optional().default(""),
});

DebtPaymentModel.headerFormatting = HEADER_FORMAT;
DebtPaymentModel.formatting = [leftAlignRule(5), currencyRule(3, 4)];

// ---------------------------------------------------------------------------
// OwnerTransfer Model → "OwnerTransfers" tab
// ---------------------------------------------------------------------------

export const OwnerTransferModel = defineModel("OwnerTransfers", {
  id: field.string().primaryKey(),
  date: field.string(),
  fromOwner: field.string(),
  toOwner: field.string(),
  amount: field.number(),
  note: field.string().optional().default(""),
});

OwnerTransferModel.headerFormatting = HEADER_FORMAT;
OwnerTransferModel.formatting = [leftAlignRule(6), currencyRule(4, 5)];

// ---------------------------------------------------------------------------
// PresetTransaction Model → "PresetTransactions" tab
// ---------------------------------------------------------------------------

export const PresetTransactionModel = defineModel("PresetTransactions", {
  id: field.string().primaryKey(),
  source: field.string().optional().default(""),
  description: field.string(),
  category: field.string().optional().default(""),
  owner: field.string().optional().default(""),
});

PresetTransactionModel.headerFormatting = HEADER_FORMAT;
PresetTransactionModel.formatting = [leftAlignRule(5)];
