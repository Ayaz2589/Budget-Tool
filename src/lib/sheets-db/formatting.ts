/**
 * Sheet formatting: bold headers, currency/percent number formats, alignment.
 */

import type { SheetIds } from "./types";
import type { TransportContext } from "./transport";
import { SHEETS_API } from "./transport";
import { apiError } from "./errors";

function repeatCellRequest(
  sheetId: number,
  startRow: number,
  endRow: number,
  startCol: number,
  endCol: number,
  format: {
    bold?: boolean;
    fontSize?: number;
    horizontalAlignment?: string;
    numberFormat?: { type: string; pattern?: string };
  },
  fields: string,
): { repeatCell: object } {
  const userEnteredFormat: Record<string, unknown> = {};
  if (format.bold != null || format.fontSize != null) {
    userEnteredFormat.textFormat = {};
    if (format.bold != null) (userEnteredFormat.textFormat as Record<string, unknown>).bold = format.bold;
    if (format.fontSize != null) (userEnteredFormat.textFormat as Record<string, unknown>).fontSize = format.fontSize;
  }
  if (format.horizontalAlignment != null) {
    userEnteredFormat.horizontalAlignment = format.horizontalAlignment;
  }
  if (format.numberFormat != null) {
    userEnteredFormat.numberFormat = format.numberFormat;
  }
  return {
    repeatCell: {
      range: {
        sheetId,
        startRowIndex: startRow,
        endRowIndex: endRow,
        startColumnIndex: startCol,
        endColumnIndex: endCol,
      },
      cell: { userEnteredFormat },
      fields,
    },
  };
}

export async function getSheetIds(ctx: TransportContext): Promise<SheetIds | null> {
  const metaUrl = `${SHEETS_API}/${ctx.spreadsheetId}?fields=sheets.properties(sheetId,title)`;
  const res = await fetch(metaUrl, {
    headers: { Authorization: `Bearer ${ctx.token}` },
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

export async function applyFormatting(
  ctx: TransportContext,
  sheetIds: SheetIds,
): Promise<void> {
  const requests: object[] = [];

  const leftAlignFields = "userEnteredFormat(horizontalAlignment)";
  const headerFields = "userEnteredFormat(textFormat,horizontalAlignment)";
  const currencyFields = "userEnteredFormat(numberFormat,horizontalAlignment)";
  const percentFields = "userEnteredFormat(numberFormat,horizontalAlignment)";

  // Expenses
  requests.push(repeatCellRequest(sheetIds.expenses, 0, 1, 0, 7, { bold: true, fontSize: 12, horizontalAlignment: "LEFT" }, headerFields));
  requests.push(repeatCellRequest(sheetIds.expenses, 0, 10000, 0, 7, { horizontalAlignment: "LEFT" }, leftAlignFields));
  requests.push(repeatCellRequest(sheetIds.expenses, 1, 10000, 2, 3, { horizontalAlignment: "LEFT", numberFormat: { type: "CURRENCY", pattern: "$#,##0.00" } }, currencyFields));

  // Mortgage
  requests.push(repeatCellRequest(sheetIds.mortgage, 0, 1, 0, 7, { bold: true, fontSize: 12, horizontalAlignment: "LEFT" }, headerFields));
  requests.push(repeatCellRequest(sheetIds.mortgage, 0, 10000, 0, 7, { horizontalAlignment: "LEFT" }, leftAlignFields));
  requests.push(repeatCellRequest(sheetIds.mortgage, 1, 10000, 2, 3, { horizontalAlignment: "LEFT", numberFormat: { type: "CURRENCY", pattern: "$#,##0.00" } }, currencyFields));

  // Income
  requests.push(repeatCellRequest(sheetIds.income, 0, 1, 0, 9, { bold: true, fontSize: 12, horizontalAlignment: "LEFT" }, headerFields));
  requests.push(repeatCellRequest(sheetIds.income, 0, 10000, 0, 9, { horizontalAlignment: "LEFT" }, leftAlignFields));
  requests.push(repeatCellRequest(sheetIds.income, 1, 10000, 1, 2, { horizontalAlignment: "LEFT", numberFormat: { type: "CURRENCY", pattern: "$#,##0.00" } }, currencyFields));

  // Debts
  requests.push(repeatCellRequest(sheetIds.debts, 0, 1, 0, 9, { bold: true, fontSize: 12, horizontalAlignment: "LEFT" }, headerFields));
  requests.push(repeatCellRequest(sheetIds.debts, 0, 10000, 0, 9, { horizontalAlignment: "LEFT" }, leftAlignFields));
  requests.push(repeatCellRequest(sheetIds.debts, 1, 10000, 2, 3, { horizontalAlignment: "LEFT", numberFormat: { type: "CURRENCY", pattern: "$#,##0.00" } }, currencyFields));
  requests.push(repeatCellRequest(sheetIds.debts, 1, 10000, 5, 6, { horizontalAlignment: "LEFT", numberFormat: { type: "CURRENCY", pattern: "$#,##0.00" } }, currencyFields));

  // DebtPayments
  requests.push(repeatCellRequest(sheetIds.debtPayments, 0, 1, 0, 5, { bold: true, fontSize: 12, horizontalAlignment: "LEFT" }, headerFields));
  requests.push(repeatCellRequest(sheetIds.debtPayments, 0, 10000, 0, 5, { horizontalAlignment: "LEFT" }, leftAlignFields));
  requests.push(repeatCellRequest(sheetIds.debtPayments, 1, 10000, 3, 4, { horizontalAlignment: "LEFT", numberFormat: { type: "CURRENCY", pattern: "$#,##0.00" } }, currencyFields));

  // OwnerTransfers
  requests.push(repeatCellRequest(sheetIds.ownerTransfers, 0, 1, 0, 6, { bold: true, fontSize: 12, horizontalAlignment: "LEFT" }, headerFields));
  requests.push(repeatCellRequest(sheetIds.ownerTransfers, 0, 10000, 0, 6, { horizontalAlignment: "LEFT" }, leftAlignFields));
  requests.push(repeatCellRequest(sheetIds.ownerTransfers, 1, 10000, 4, 5, { horizontalAlignment: "LEFT", numberFormat: { type: "CURRENCY", pattern: "$#,##0.00" } }, currencyFields));

  // Totals
  requests.push(repeatCellRequest(sheetIds.totals, 0, 1, 0, 15, { bold: true, fontSize: 12, horizontalAlignment: "LEFT" }, headerFields));
  requests.push(repeatCellRequest(sheetIds.totals, 0, 100, 0, 15, { horizontalAlignment: "LEFT" }, leftAlignFields));
  for (let c = 1; c <= 14; c++) {
    if (c === 11) {
      requests.push(repeatCellRequest(sheetIds.totals, 1, 100, 11, 12, { horizontalAlignment: "LEFT", numberFormat: { type: "PERCENT", pattern: "0.0%" } }, percentFields));
    } else {
      requests.push(repeatCellRequest(sheetIds.totals, 1, 100, c, c + 1, { horizontalAlignment: "LEFT", numberFormat: { type: "CURRENCY", pattern: "$#,##0.00" } }, currencyFields));
    }
  }

  // PresetTransactions
  requests.push(repeatCellRequest(sheetIds.presetTransactions, 0, 1, 0, 5, { bold: true, fontSize: 12, horizontalAlignment: "LEFT" }, headerFields));
  requests.push(repeatCellRequest(sheetIds.presetTransactions, 0, 10000, 0, 5, { horizontalAlignment: "LEFT" }, leftAlignFields));

  const batchRes = await fetch(`${SHEETS_API}/${ctx.spreadsheetId}:batchUpdate`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${ctx.token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ requests }),
  });
  if (!batchRes.ok) {
    const err = await batchRes.text();
    throw apiError(`Formatting failed: ${batchRes.status} ${err}`);
  }
}
