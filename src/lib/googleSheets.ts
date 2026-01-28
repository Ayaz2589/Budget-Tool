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
    "Nova's Purchase",
    "Nova's Total Spending",
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

export async function ensureSheetsExist(
  accessToken: string,
  spreadsheetId: string
): Promise<void> {
  const metaUrl = `${SHEETS_API}/${spreadsheetId}?fields=sheets.properties`;
  const res = await fetch(metaUrl, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (!res.ok) throw new Error("Failed to get spreadsheet metadata");
  const data = (await res.json()) as { sheets?: { properties: { title: string } }[] };
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
