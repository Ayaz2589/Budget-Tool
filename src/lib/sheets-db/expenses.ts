/**
 * Expense and Mortgage repository for the sheets database layer.
 */

import type { Expense } from "./types";
import type { TransportContext } from "./transport";
import { getSheetValues, clearRange, updateSheet, generateId } from "./transport";
import { SHEET_RANGES, SHEET_WRITE_RANGES } from "./schema";
import {
  parseAmount,
  normalizeDate,
  looksLikeIsoDate,
  normalizeCategoryFromSheet,
  validateExpenseSource,
  hasIdColumn,
  validateExpense,
} from "./normalize";

async function readExpenseSheet(
  ctx: TransportContext,
  range: string,
  defaultCategory: string,
  defaultDescription: string,
): Promise<Expense[]> {
  const rows = await getSheetValues(ctx, range, "UNFORMATTED_VALUE");
  const expenses: Expense[] = [];

  for (const row of rows) {
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
    if (!date || amount == null || amount <= 0) continue;

    expenses.push({
      id,
      date,
      amount,
      description: description || defaultDescription,
      category,
      source,
      owner,
      paidByOwner: owner,
    });
  }

  return expenses;
}

export async function readExpenses(ctx: TransportContext): Promise<Expense[]> {
  return readExpenseSheet(ctx, SHEET_RANGES.expensesRead, "", "Expense");
}

export async function readMortgage(ctx: TransportContext): Promise<Expense[]> {
  return readExpenseSheet(ctx, SHEET_RANGES.mortgageRead, "Mortgage", "Mortgage");
}

export function buildExpensesValues(expenses: Expense[]): unknown[][] {
  const headers = [["ID", "Date", "Amount", "Description", "Category", "Source", "Owner"]];
  const rows = expenses.map((e) => [
    e.id,
    e.date,
    e.amount,
    e.description,
    e.category || "Uncategorized",
    e.source,
    e.paidByOwner ?? e.owner ?? "",
  ]);
  return [...headers, ...rows];
}

export async function writeExpenses(
  ctx: TransportContext,
  expenses: Expense[],
): Promise<void> {
  for (const e of expenses) validateExpense(e);
  const values = buildExpensesValues(expenses);
  await clearRange(ctx, "Expenses!A1:G10000");
  if (values.length > 0) {
    await updateSheet(ctx, SHEET_WRITE_RANGES.expenses, values, false);
  }
}

export async function writeMortgage(
  ctx: TransportContext,
  expenses: Expense[],
): Promise<void> {
  for (const e of expenses) validateExpense(e);
  const values = buildExpensesValues(expenses);
  await clearRange(ctx, "Mortgage!A1:G10000");
  if (values.length > 0) {
    await updateSheet(ctx, SHEET_WRITE_RANGES.mortgage, values, false);
  }
}

export async function appendExpenses(
  ctx: TransportContext,
  expenses: Expense[],
): Promise<void> {
  for (const e of expenses) validateExpense(e);
  const values = expenses.map((e) => [
    e.id,
    e.date,
    e.amount,
    e.description,
    e.category || "Uncategorized",
    e.source,
    e.paidByOwner ?? e.owner ?? "",
  ]);
  await updateSheet(ctx, "Expenses!A:G", values, false);
}
