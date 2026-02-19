/**
 * Expense and Mortgage schema definitions using the generic SheetSchema<T> interface.
 */

import type { SheetSchema } from "@/lib/sheets-db";
import { normalizeDate, parseAmount, hasIdColumn, looksLikeIsoDate, generateId } from "@/lib/sheets-db";
import type { Expense } from "../types";
import { normalizeCategoryFromSheet, validateExpenseSource, validateExpense } from "../normalize";
import { EXPENSE_FORMATTING, MORTGAGE_FORMATTING, ORTHO_HEADER_FORMAT } from "../formatting";

function parseExpenseRow(
  row: unknown[],
  defaultCategory: string,
  defaultDescription: string,
): Expense | null {
  const isIdRow = hasIdColumn(row, 7, looksLikeIsoDate);
  let id: string;
  let dateRaw: unknown;
  let amount: number | null;
  let description: string;
  let category: string;
  let rawSource: string;
  let owner: string | undefined;

  if (isIdRow) {
    id = String(row[0] ?? "").trim();
    dateRaw = row[1];
    amount = parseAmount(row[2]);
    description = String(row[3] ?? "").trim();
    category = defaultCategory || normalizeCategoryFromSheet(String(row[4] ?? ""));
    rawSource = String(row[5] ?? "").trim().toLowerCase();
    owner = String(row[6] ?? "").trim() || undefined;
  } else {
    id = generateId();
    dateRaw = row[0];
    amount = parseAmount(row[1]);
    description = String(row[2] ?? "").trim();
    category = defaultCategory || normalizeCategoryFromSheet(String(row[3] ?? ""));
    rawSource = String(row[4] ?? "").trim().toLowerCase();
    owner = String(row[5] ?? "").trim() || undefined;
  }

  const date = normalizeDate(dateRaw);
  const source = validateExpenseSource(rawSource);
  if (!date || amount == null || amount <= 0) return null;

  return {
    id,
    date,
    amount,
    description: description || defaultDescription,
    category,
    source,
    owner,
    paidByOwner: owner,
  };
}

function expenseToRow(expense: Expense): unknown[] {
  return [
    expense.id,
    expense.date,
    expense.amount,
    expense.description,
    expense.category || "Uncategorized",
    expense.source,
    expense.paidByOwner ?? expense.owner ?? "",
  ];
}

export const expenseSchema: SheetSchema<Expense> = {
  sheetName: "Expenses",
  headers: ["ID", "Date", "Amount", "Description", "Category", "Source", "Owner"],
  readRange: "Expenses!A2:G",
  writeRange: "Expenses!A1:G",
  clearRange: "Expenses!A1:G10000",
  appendSupported: true,
  parseRow(row) {
    return parseExpenseRow(row, "", "Expense");
  },
  toRow: expenseToRow,
  validate: validateExpense,
  formatting: EXPENSE_FORMATTING,
  headerFormatting: ORTHO_HEADER_FORMAT,
};

export const mortgageSchema: SheetSchema<Expense> = {
  sheetName: "Mortgage",
  headers: ["ID", "Date", "Amount", "Description", "Category", "Source", "Owner"],
  readRange: "Mortgage!A2:G",
  writeRange: "Mortgage!A1:G",
  clearRange: "Mortgage!A1:G10000",
  appendSupported: false,
  parseRow(row) {
    return parseExpenseRow(row, "Mortgage", "Mortgage");
  },
  toRow: expenseToRow,
  validate: validateExpense,
  formatting: MORTGAGE_FORMATTING,
  headerFormatting: ORTHO_HEADER_FORMAT,
};
