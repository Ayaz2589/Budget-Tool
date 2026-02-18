/**
 * Income repository for the sheets database layer.
 */

import type { Income } from "./types";
import type { TransportContext } from "./transport";
import { getSheetValues, clearRange, updateSheet, generateId } from "./transport";
import { SHEET_RANGES, SHEET_WRITE_RANGES } from "./schema";
import {
  parseAmount,
  normalizeDate,
  normalizeCategoryFromSheet,
  parseOwner,
  validateIncome as validateIncomeRecord,
} from "./normalize";

export async function readIncome(ctx: TransportContext): Promise<Income[]> {
  const rows = await getSheetValues(ctx, SHEET_RANGES.incomeRead, "UNFORMATTED_VALUE");
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

export async function writeIncome(
  ctx: TransportContext,
  income: Income[],
): Promise<void> {
  for (const i of income) validateIncomeRecord(i);
  const values = buildIncomeValues(income);
  await clearRange(ctx, "Income!A1:I10000");
  if (values.length > 0) {
    await updateSheet(ctx, SHEET_WRITE_RANGES.income, values, false);
  }
}

export async function appendIncome(
  ctx: TransportContext,
  income: Income[],
): Promise<void> {
  for (const i of income) validateIncomeRecord(i);
  const values = income.map((i) => [
    i.date,
    i.amount,
    i.description,
    i.category || "Uncategorized",
    i.owner ?? "",
  ]);
  await updateSheet(ctx, "Income!A:E", values, false);
}
