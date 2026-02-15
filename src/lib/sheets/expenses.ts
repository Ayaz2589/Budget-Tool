/**
 * Read/write operations for the Expenses and Mortgage sheets.
 */

import type { Expense } from "@/types/core";
import {
  generateId,
  parseAmount,
  normalizeDate,
  looksLikeIsoDate,
  normalizeCategoryFromSheet,
  getSheetValues,
  clearRange,
  updateSheet,
} from "./api";
import { SHEET_RANGES } from "./constants";
import { validateExpenseSource, hasIdColumn } from "./validate";

/**
 * Read expense rows from a named sheet.
 * Works for both "Expenses" and "Mortgage" sheets since they share the same column layout.
 */
async function readExpenseSheet(
  accessToken: string,
  spreadsheetId: string,
  range: string,
  defaultCategory: string,
  defaultDescription: string,
): Promise<Expense[]> {
  const rows = await getSheetValues(accessToken, spreadsheetId, range, "UNFORMATTED_VALUE");
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

/** Read all expenses from the Expenses sheet (A2:G). */
export async function readExpensesFromSheet(
  accessToken: string,
  spreadsheetId: string,
): Promise<Expense[]> {
  return readExpenseSheet(accessToken, spreadsheetId, SHEET_RANGES.expensesRead, "", "Expense");
}

/** Read all mortgage expenses from the Mortgage sheet (A2:G). */
export async function readMortgageFromSheet(
  accessToken: string,
  spreadsheetId: string,
): Promise<Expense[]> {
  return readExpenseSheet(accessToken, spreadsheetId, SHEET_RANGES.mortgageRead, "Mortgage", "Mortgage");
}

/** Append expense rows (no clear). */
export async function appendExpenses(
  accessToken: string,
  spreadsheetId: string,
  expenses: Expense[],
): Promise<void> {
  const values = expenses.map((e) => [
    e.id,
    e.date,
    e.amount,
    e.description,
    e.category || "Uncategorized",
    e.source,
    e.paidByOwner ?? e.owner ?? "",
  ]);
  await updateSheet(accessToken, spreadsheetId, "Expenses!A:G", values, false);
}

/** Build the header + data rows array for expenses (used by batch sync). */
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

/** Clear and rewrite the Expenses sheet. */
export async function clearAndWriteExpenses(
  accessToken: string,
  spreadsheetId: string,
  expenses: Expense[],
): Promise<void> {
  const values = buildExpensesValues(expenses);
  await clearRange(accessToken, spreadsheetId, "Expenses!A1:G10000");
  if (values.length > 0) {
    await updateSheet(accessToken, spreadsheetId, "Expenses!A1:G", values, false);
  }
}

/** Clear and rewrite the Mortgage sheet. */
export async function clearAndWriteMortgage(
  accessToken: string,
  spreadsheetId: string,
  expenses: Expense[],
): Promise<void> {
  const values = buildExpensesValues(expenses);
  await clearRange(accessToken, spreadsheetId, "Mortgage!A1:G10000");
  if (values.length > 0) {
    await updateSheet(accessToken, spreadsheetId, "Mortgage!A1:G", values, false);
  }
}
