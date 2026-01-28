import type { Expense, Income } from "@/lib/types";
import type { MonthTotals } from "@/lib/totals";

const SHEETS_API = "https://sheets.googleapis.com/v4/spreadsheets";

export function extractSpreadsheetId(urlOrId: string): string | null {
  const match = urlOrId.match(/\/d\/([a-zA-Z0-9-_]+)/);
  return match ? match[1]! : urlOrId;
}

export async function appendExpenses(
  accessToken: string,
  spreadsheetId: string,
  expenses: Expense[]
): Promise<void> {
  const range = "Expenses!A:D";
  const values = expenses.map((e) => [
    e.date,
    e.amount,
    e.description,
    e.category || "",
  ]);
  await updateSheet(accessToken, spreadsheetId, range, values, false);
}

export async function appendIncome(
  accessToken: string,
  spreadsheetId: string,
  income: Income[]
): Promise<void> {
  const range = "Income!A:D";
  const values = income.map((i) => [i.date, i.amount, i.description, i.category]);
  await updateSheet(accessToken, spreadsheetId, range, values, false);
}

export async function clearAndWriteExpenses(
  accessToken: string,
  spreadsheetId: string,
  expenses: Expense[]
): Promise<void> {
  const headers = [["Date", "Amount", "Description", "Category"]];
  const rows = expenses.map((e) => [
    e.date,
    e.amount,
    e.description,
    e.category || "",
  ]);
  const values = [...headers, ...rows];
  const range = "Expenses!A1:D";
  await clearRange(accessToken, spreadsheetId, "Expenses!A1:D10000");
  if (values.length > 0) {
    await updateSheet(accessToken, spreadsheetId, range, values, false);
  }
}

export async function clearAndWriteIncome(
  accessToken: string,
  spreadsheetId: string,
  income: Income[]
): Promise<void> {
  const headers = [["Date", "Amount", "Description", "Category"]];
  const rows = income.map((i) => [i.date, i.amount, i.description, i.category]);
  const values = [...headers, ...rows];
  const range = "Income!A1:D";
  await clearRange(accessToken, spreadsheetId, "Income!A1:D10000");
  if (values.length > 0) {
    await updateSheet(accessToken, spreadsheetId, range, values, false);
  }
}

export async function writeTotalsSheet(
  accessToken: string,
  spreadsheetId: string,
  months: MonthTotals[],
  grandTotal: MonthTotals
): Promise<void> {
  const headers = [
    "Month",
    "Total Earned",
    "Total Spent",
    "Total Spent w/o Mortgage",
    "Total 50/50 Spent",
    "50/50 Split",
    "Tasnuva's Purchase",
    "Tasnuva's Total Spending",
    "I Owe Nova",
    "My Total Spending w/o Mortgage",
    "Total Saved",
    "Personal Savings Rate",
    "HYSA",
    "Investing (S&P 500)",
    "Investing Total",
  ];
  const rows = [
    headers,
    ...months.map((m) => [
      m.monthLabel,
      m.totalEarned,
      m.totalSpent,
      m.totalSpentWithoutMortgage,
      m.total5050Spent,
      m.split5050,
      m.novasPurchase,
      m.novasTotalSpending,
      m.iOweNova,
      m.myTotalSpendingWithoutMortgage,
      m.totalSaved,
      m.personalSavingsRate,
      m.hysa,
      m.investingSp500,
      m.investingTotal,
    ]),
    [
      grandTotal.monthLabel,
      grandTotal.totalEarned,
      grandTotal.totalSpent,
      grandTotal.totalSpentWithoutMortgage,
      grandTotal.total5050Spent,
      grandTotal.split5050,
      grandTotal.novasPurchase,
      grandTotal.novasTotalSpending,
      grandTotal.iOweNova,
      grandTotal.myTotalSpendingWithoutMortgage,
      grandTotal.totalSaved,
      grandTotal.personalSavingsRate,
      grandTotal.hysa,
      grandTotal.investingSp500,
      grandTotal.investingTotal,
    ],
  ];
  const range = "Totals!A1:O100";
  await clearRange(accessToken, spreadsheetId, range);
  await updateSheet(accessToken, spreadsheetId, range, rows, false);
}

async function clearRange(
  accessToken: string,
  spreadsheetId: string,
  range: string
): Promise<void> {
  const url = `${SHEETS_API}/${spreadsheetId}/values/${encodeURIComponent(range)}:clear`;
  const res = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({}),
  });
  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Sheets clear failed: ${res.status} ${err}`);
  }
}

async function updateSheet(
  accessToken: string,
  spreadsheetId: string,
  range: string,
  values: unknown[][],
  append: boolean
): Promise<void> {
  const url = append
    ? `${SHEETS_API}/${spreadsheetId}/values/${encodeURIComponent(range)}:append?valueInputOption=USER_ENTERED`
    : `${SHEETS_API}/${spreadsheetId}/values/${encodeURIComponent(range)}?valueInputOption=USER_ENTERED`;
  const method = append ? "POST" : "PUT";
  const body = append ? { values } : { values };
  const res = await fetch(url, {
    method,
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Sheets update failed: ${res.status} ${err}`);
  }
}

export interface SheetIds {
  expenses: number;
  income: number;
  totals: number;
}

export async function getSheetIds(
  accessToken: string,
  spreadsheetId: string
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
  if (expenses == null || income == null || totals == null) return null;
  return { expenses, income, totals };
}

export async function ensureSheetsExist(
  accessToken: string,
  spreadsheetId: string
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
  const needed = ["Expenses", "Income", "Totals"];
  const toAdd = needed.filter((t) => !titles.has(t));
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
  fields: string
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

export async function applySheetsFormatting(
  accessToken: string,
  spreadsheetId: string,
  sheetIds: SheetIds
): Promise<void> {
  const requests: object[] = [];

  const leftAlignFields = "userEnteredFormat(horizontalAlignment)";
  const headerFields = "userEnteredFormat(textFormat,horizontalAlignment)";
  const currencyFields = "userEnteredFormat(numberFormat,horizontalAlignment)";
  const percentFields = "userEnteredFormat(numberFormat,horizontalAlignment)";

  // Expenses: header row bold + larger, all left align, column B (Amount) currency
  requests.push(
    repeatCellRequest(
      sheetIds.expenses,
      0,
      1,
      0,
      4,
      { bold: true, fontSize: 12, horizontalAlignment: "LEFT" },
      headerFields
    )
  );
  requests.push(
    repeatCellRequest(
      sheetIds.expenses,
      0,
      10000,
      0,
      4,
      { horizontalAlignment: "LEFT" },
      leftAlignFields
    )
  );
  requests.push(
    repeatCellRequest(
      sheetIds.expenses,
      1,
      10000,
      1,
      2,
      {
        horizontalAlignment: "LEFT",
        numberFormat: { type: "CURRENCY", pattern: "$#,##0.00" },
      },
      currencyFields
    )
  );

  // Income: same as Expenses
  requests.push(
    repeatCellRequest(
      sheetIds.income,
      0,
      1,
      0,
      4,
      { bold: true, fontSize: 12, horizontalAlignment: "LEFT" },
      headerFields
    )
  );
  requests.push(
    repeatCellRequest(
      sheetIds.income,
      0,
      10000,
      0,
      4,
      { horizontalAlignment: "LEFT" },
      leftAlignFields
    )
  );
  requests.push(
    repeatCellRequest(
      sheetIds.income,
      1,
      10000,
      1,
      2,
      {
        horizontalAlignment: "LEFT",
        numberFormat: { type: "CURRENCY", pattern: "$#,##0.00" },
      },
      currencyFields
    )
  );

  // Totals: header bold + larger, all left align; money columns $, Personal Savings Rate (col 11) %
  requests.push(
    repeatCellRequest(
      sheetIds.totals,
      0,
      1,
      0,
      15,
      { bold: true, fontSize: 12, horizontalAlignment: "LEFT" },
      headerFields
    )
  );
  requests.push(
    repeatCellRequest(
      sheetIds.totals,
      0,
      100,
      0,
      15,
      { horizontalAlignment: "LEFT" },
      leftAlignFields
    )
  );
  // Columns 1-10, 12-14 = currency; column 11 = Personal Savings Rate = percent
  for (let c = 1; c <= 14; c++) {
    if (c === 11) {
      requests.push(
        repeatCellRequest(
          sheetIds.totals,
          1,
          100,
          11,
          12,
          {
            horizontalAlignment: "LEFT",
            numberFormat: { type: "PERCENT", pattern: "0.0%" },
          },
          percentFields
        )
      );
    } else {
      requests.push(
        repeatCellRequest(
          sheetIds.totals,
          1,
          100,
          c,
          c + 1,
          {
            horizontalAlignment: "LEFT",
            numberFormat: { type: "CURRENCY", pattern: "$#,##0.00" },
          },
          currencyFields
        )
      );
    }
  }

  const batchRes = await fetch(`${SHEETS_API}/${spreadsheetId}:batchUpdate`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ requests }),
  });
  if (!batchRes.ok) {
    const err = await batchRes.text();
    throw new Error(`Formatting failed: ${batchRes.status} ${err}`);
  }
}
