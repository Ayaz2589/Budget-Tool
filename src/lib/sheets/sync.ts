/**
 * Batch sync operations and sheet structure management.
 */

import type { Expense, Debt, DebtPayment, Income, OwnerTransfer, PresetTransaction } from "@/types/core";
import type { MonthTotals } from "@/types/totals";
import type { SheetIds } from "@/types/sheets";
import { SHEETS_API } from "./api";
import { ALL_SHEET_TITLES, SHEET_CLEAR_RANGES, SHEET_WRITE_RANGES } from "./constants";
import { buildExpensesValues } from "./expenses";
import { buildIncomeValues } from "./income";
import { buildDebtsValues, buildDebtPaymentsValues } from "./debts";
import { buildOwnerTransfersValues, buildPresetsValues } from "./transfers";
import { buildTotalsValues } from "./totals";

export type { SheetIds };

/** Payload for a full batch sync to Google Sheets. */
export interface SyncPayload {
  expenses: Expense[];
  mortgageExpenses: Expense[];
  income: Income[];
  debts: Debt[];
  debtPayments: DebtPayment[];
  ownerTransfers?: OwnerTransfer[];
  presetTransactions: PresetTransaction[];
  dataBlob: string;
  months: MonthTotals[];
  grandTotal: MonthTotals;
}

/** Clear all sheets and write all data in two batch API calls. */
export async function syncAllSheetsBatch(
  accessToken: string,
  spreadsheetId: string,
  payload: SyncPayload,
): Promise<void> {
  // 1. Batch clear all sheets
  const clearRes = await fetch(`${SHEETS_API}/${spreadsheetId}/values:batchClear`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ ranges: [...SHEET_CLEAR_RANGES] }),
  });
  if (!clearRes.ok) {
    const err = await clearRes.text();
    throw new Error(`Sheets batch clear failed: ${clearRes.status} ${err}`);
  }

  // 2. Batch update all sheets with fresh data
  const totalsValues = buildTotalsValues(payload.months, payload.grandTotal);
  const updateRes = await fetch(`${SHEETS_API}/${spreadsheetId}/values:batchUpdate`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      valueInputOption: "USER_ENTERED",
      data: [
        { range: SHEET_WRITE_RANGES.expenses, values: buildExpensesValues(payload.expenses) },
        { range: SHEET_WRITE_RANGES.mortgage, values: buildExpensesValues(payload.mortgageExpenses) },
        { range: SHEET_WRITE_RANGES.income, values: buildIncomeValues(payload.income) },
        { range: SHEET_WRITE_RANGES.debts, values: buildDebtsValues(payload.debts) },
        { range: SHEET_WRITE_RANGES.debtPayments, values: buildDebtPaymentsValues(payload.debtPayments) },
        { range: SHEET_WRITE_RANGES.ownerTransfers, values: buildOwnerTransfersValues(payload.ownerTransfers ?? []) },
        { range: SHEET_WRITE_RANGES.presets, values: buildPresetsValues(payload.presetTransactions) },
        { range: SHEET_WRITE_RANGES.data, values: [[payload.dataBlob]] },
        { range: SHEET_WRITE_RANGES.totals, values: totalsValues },
      ],
    }),
  });
  if (!updateRes.ok) {
    const err = await updateRes.text();
    throw new Error(`Sheets batch update failed: ${updateRes.status} ${err}`);
  }
}

/** Read the sheet IDs (numeric gid) for all expected tabs. Returns null if any are missing. */
export async function getSheetIds(
  accessToken: string,
  spreadsheetId: string,
): Promise<SheetIds | null> {
  const metaUrl = `${SHEETS_API}/${spreadsheetId}?fields=sheets.properties(sheetId,title)`;
  const res = await fetch(metaUrl, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (!res.ok) return null;
  const data = (await res.json()) as {
    sheets?: { properties: { sheetId: number; title: string } }[];
  };
  const byTitle: Record<string, number> = {};
  for (const s of data.sheets ?? []) {
    byTitle[s.properties.title] = s.properties.sheetId;
  }

  const expenses = byTitle["Expenses"];
  const income = byTitle["Income"];
  const totals = byTitle["Totals"];
  const debts = byTitle["Debts"];
  const debtPayments = byTitle["DebtPayments"];
  const mortgage = byTitle["Mortgage"];
  const ownerTransfers = byTitle["OwnerTransfers"];
  const presetTransactions = byTitle["PresetTransactions"];

  if (
    expenses == null ||
    income == null ||
    totals == null ||
    debts == null ||
    debtPayments == null ||
    mortgage == null ||
    ownerTransfers == null ||
    presetTransactions == null
  ) {
    return null;
  }

  return { expenses, income, totals, debts, debtPayments, mortgage, ownerTransfers, presetTransactions };
}

/** Ensure that all required sheet tabs exist, creating any that are missing. */
export async function ensureSheetsExist(
  accessToken: string,
  spreadsheetId: string,
): Promise<void> {
  const metaUrl = `${SHEETS_API}/${spreadsheetId}?fields=sheets.properties(sheetId,title)`;
  const res = await fetch(metaUrl, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (!res.ok) throw new Error("Failed to get spreadsheet metadata");
  const data = (await res.json()) as {
    sheets?: { properties: { sheetId: number; title: string } }[];
  };
  const titles = new Set((data.sheets ?? []).map((s) => s.properties.title));
  const toAdd = ALL_SHEET_TITLES.filter((t) => !titles.has(t));
  if (toAdd.length === 0) return;

  const addRes = await fetch(`${SHEETS_API}/${spreadsheetId}:batchUpdate`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      requests: toAdd.map((title) => ({
        addSheet: { properties: { title } },
      })),
    }),
  });
  if (!addRes.ok) {
    const err = await addRes.text();
    throw new Error(`Failed to add sheets: ${addRes.status} ${err}`);
  }
}
