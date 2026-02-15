/**
 * Read/write operations for the Income sheet.
 */

import type { Income } from "@/types/core";
import {
  generateId,
  parseAmount,
  normalizeDate,
  normalizeCategoryFromSheet,
  parseOwner,
  getSheetValues,
  clearRange,
  updateSheet,
} from "./api";
import { SHEET_RANGES } from "./constants";

/** Read all income rows from the Income sheet (A2:E). */
export async function readIncomeFromSheet(
  accessToken: string,
  spreadsheetId: string,
): Promise<Income[]> {
  const rows = await getSheetValues(accessToken, spreadsheetId, SHEET_RANGES.incomeRead, "UNFORMATTED_VALUE");
  const income: Income[] = [];

  for (const row of rows) {
    const date = normalizeDate(row[0]);
    const amount = parseAmount(row[1]);
    const description = String(row[2] ?? "").trim();
    const category = normalizeCategoryFromSheet(String(row[3] ?? ""));
    const owner =
      row.length >= 5 && (row[4] ?? "").toString().trim()
        ? parseOwner(row[4])
        : undefined;

    if (!date || amount == null || amount <= 0) continue;
    income.push({
      id: generateId(),
      date,
      amount,
      description: description || "Income",
      category: category || "",
      owner,
    });
  }

  return income;
}

/** Append income rows (no clear). */
export async function appendIncome(
  accessToken: string,
  spreadsheetId: string,
  income: Income[],
): Promise<void> {
  const values = income.map((i) => [
    i.date,
    i.amount,
    i.description,
    i.category || "Uncategorized",
    i.owner ?? "",
  ]);
  await updateSheet(accessToken, spreadsheetId, "Income!A:E", values, false);
}

/** Build the header + data rows array for income (used by batch sync). */
export function buildIncomeValues(income: Income[]): unknown[][] {
  const headers = [["Date", "Amount", "Description", "Category", "Owner"]];
  const rows = income.map((i) => [
    i.date,
    i.amount,
    i.description,
    i.category || "Uncategorized",
    i.owner ?? "",
  ]);
  return [...headers, ...rows];
}

/** Clear and rewrite the Income sheet. */
export async function clearAndWriteIncome(
  accessToken: string,
  spreadsheetId: string,
  income: Income[],
): Promise<void> {
  const values = buildIncomeValues(income);
  await clearRange(accessToken, spreadsheetId, "Income!A1:I10000");
  if (values.length > 0) {
    await updateSheet(accessToken, spreadsheetId, "Income!A1:E", values, false);
  }
}
