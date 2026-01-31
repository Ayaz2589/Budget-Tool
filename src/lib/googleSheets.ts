import type {
  Debt,
  DebtPayment,
  Expense,
  Income,
  ExpenseSource,
  PresetTransaction,
} from "@/lib/types";
import type { MonthTotals } from "@/lib/totals";
import type { Rule } from "@/lib/rules";

const VALID_EXPENSE_SOURCES: ExpenseSource[] = [
  "amex",
  "amex-gold",
  "chase",
  "apple",
  "manual",
  "td",
];

const SHEETS_API = "https://sheets.googleapis.com/v4/spreadsheets";

function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

function parseAmount(value: unknown): number | null {
  if (typeof value === "number" && !Number.isNaN(value)) return value;
  const s = String(value ?? "").replace(/[$,\s]/g, "");
  const n = parseFloat(s);
  return Number.isNaN(n) ? null : n;
}

export function extractSpreadsheetId(urlOrId: string): string | null {
  const match = urlOrId.match(/\/d\/([a-zA-Z0-9-_]+)/);
  return match ? match[1]! : urlOrId;
}

export async function getSheetValues(
  accessToken: string,
  spreadsheetId: string,
  range: string,
  valueRenderOption: "FORMATTED_VALUE" | "UNFORMATTED_VALUE" = "FORMATTED_VALUE"
): Promise<unknown[][]> {
  const params = new URLSearchParams({ valueRenderOption });
  const url = `${SHEETS_API}/${spreadsheetId}/values/${encodeURIComponent(range)}?${params}`;
  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Sheets read failed: ${res.status} ${err}`);
  }
  const data = (await res.json()) as { values?: unknown[][] };
  const values = data.values;
  if (!Array.isArray(values) || values.length === 0) return [];
  return values.map((row) => (Array.isArray(row) ? [...row] : []));
}

import { tryRepairDate } from "@/lib/dateRepair";

/** Normalize a date value from Sheets: may be ISO string, serial number, or corrupted (currency-formatted). */
function normalizeDate(value: unknown): string | null {
  if (value == null) return null;
  const s = String(value).trim();
  if (ISO_DATE_PATTERN.test(s)) return s;
  return tryRepairDate(s);
}

const ISO_DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

function looksLikeIsoDate(value: string): boolean {
  return ISO_DATE_PATTERN.test(value.trim());
}

export async function readExpensesFromSheet(
  accessToken: string,
  spreadsheetId: string
): Promise<Expense[]> {
  const rows = await getSheetValues(
    accessToken,
    spreadsheetId,
    "Expenses!A2:G",
    "UNFORMATTED_VALUE",
  );
  const expenses: Expense[] = [];
  for (const row of rows) {
    const first = String(row[0] ?? "").trim();
    const hasIdColumn =
      row.length >= 7 && first.length > 0 && !looksLikeIsoDate(first);
    let id: string;
    let dateRaw: unknown;
    let amount: number | null;
    let description: string;
    let category: string;
    let rawSource: string;
    let cardMember: string | undefined;
    if (hasIdColumn) {
      id = first;
      dateRaw = row[1];
      amount = parseAmount(row[2]);
      description = String(row[3] ?? "").trim();
      category = String(row[4] ?? "").trim();
      rawSource = String(row[5] ?? "").trim().toLowerCase();
      cardMember = String(row[6] ?? "").trim() || undefined;
    } else {
      id = generateId();
      dateRaw = row[0];
      amount = parseAmount(row[1]);
      description = String(row[2] ?? "").trim();
      category = String(row[3] ?? "").trim();
      rawSource = String(row[4] ?? "").trim().toLowerCase();
      cardMember = String(row[5] ?? "").trim() || undefined;
    }
    const date = normalizeDate(dateRaw);
    const source: ExpenseSource = VALID_EXPENSE_SOURCES.includes(
      rawSource as ExpenseSource,
    )
      ? (rawSource as ExpenseSource)
      : "manual";
    if (!date || amount == null || amount <= 0) continue;
    expenses.push({
      id,
      date,
      amount,
      description: description || "Expense",
      category,
      source,
      cardMember,
    });
  }
  return expenses;
}

export async function readMortgageFromSheet(
  accessToken: string,
  spreadsheetId: string
): Promise<Expense[]> {
  const rows = await getSheetValues(
    accessToken,
    spreadsheetId,
    "Mortgage!A2:G",
    "UNFORMATTED_VALUE",
  );
  const expenses: Expense[] = [];
  for (const row of rows) {
    const first = String(row[0] ?? "").trim();
    const hasIdColumn =
      row.length >= 7 && first.length > 0 && !looksLikeIsoDate(first);
    let id: string;
    let dateRaw: unknown;
    let amount: number | null;
    let description: string;
    let rawSource: string;
    let cardMember: string | undefined;
    if (hasIdColumn) {
      id = first;
      dateRaw = row[1];
      amount = parseAmount(row[2]);
      description = String(row[3] ?? "").trim();
      rawSource = String(row[5] ?? "").trim().toLowerCase();
      cardMember = String(row[6] ?? "").trim() || undefined;
    } else {
      id = generateId();
      dateRaw = row[0];
      amount = parseAmount(row[1]);
      description = String(row[2] ?? "").trim();
      rawSource = String(row[4] ?? "").trim().toLowerCase();
      cardMember = String(row[5] ?? "").trim() || undefined;
    }
    const date = normalizeDate(dateRaw);
    const source: ExpenseSource = VALID_EXPENSE_SOURCES.includes(
      rawSource as ExpenseSource,
    )
      ? (rawSource as ExpenseSource)
      : "manual";
    if (!date || amount == null || amount <= 0) continue;
    expenses.push({
      id,
      date,
      amount,
      description: description || "Mortgage",
      category: "Mortgage",
      source,
      cardMember,
    });
  }
  return expenses;
}

export async function readIncomeFromSheet(
  accessToken: string,
  spreadsheetId: string
): Promise<Income[]> {
  const rows = await getSheetValues(
    accessToken,
    spreadsheetId,
    "Income!A2:I",
    "UNFORMATTED_VALUE",
  );
  const income: Income[] = [];
  for (const row of rows) {
    const date = normalizeDate(row[0]);
    const amount = parseAmount(row[1]);
    const description = String(row[2] ?? "").trim();
    const category = String(row[3] ?? "").trim();
    const owner =
      row.length >= 5 && (row[4] ?? "").toString().trim()
        ? parseDebtOwner(row[4])
        : undefined;
    const recurringAmount =
      row.length >= 6 ? parseAmount(row[5]) : undefined;
    const recurringFreq =
      row.length >= 7 ? parseRecurringFrequency(row[6]) : undefined;
    const recurringDay =
      row.length >= 8 ? parseRecurringDay(row[7]) : undefined;
    const recurringStart =
      row.length >= 9 ? normalizeDate(row[8]) : undefined;
    if (!date || amount == null || amount <= 0) continue;
    income.push({
      id: generateId(),
      date,
      amount,
      description: description || "Income",
      category: category || "Other",
      owner,
      recurringAmount:
        recurringAmount != null && recurringAmount > 0
          ? recurringAmount
          : undefined,
      recurringFrequency: recurringFreq,
      recurringDayOfMonth: recurringDay,
      recurringStartDate: recurringStart ?? undefined,
    });
  }
  return income;
}

function parseDebtOwner(value: unknown): "Ayaz" | "Tasnuva" {
  const s = String(value ?? "").trim();
  if (s === "Tasnuva") return "Tasnuva";
  return "Ayaz";
}

function parseRecurringDay(value: unknown): number | undefined {
  const n = Number(value);
  if (Number.isInteger(n) && n >= 1 && n <= 31) return n;
  return undefined;
}

function parseRecurringFrequency(
  value: unknown,
): "monthly" | "biweekly" {
  const s = String(value ?? "").trim().toLowerCase();
  if (s === "biweekly" || s === "bi-weekly") return "biweekly";
  return "monthly";
}

export async function readDebtsFromSheet(
  accessToken: string,
  spreadsheetId: string
): Promise<Debt[]> {
  const rows = await getSheetValues(
    accessToken,
    spreadsheetId,
    "Debts!A2:I",
    "UNFORMATTED_VALUE",
  );
  const debts: Debt[] = [];
  for (const row of rows) {
    const id = String(row[0] ?? "").trim();
    const name = String(row[1] ?? "").trim();
    const initialAmount = parseAmount(row[2]);
    const startDate = normalizeDate(row[3]);
    const owner = parseDebtOwner(row[4]);
    const recurringAmount = parseAmount(row[5]);
    const recurringDay = parseRecurringDay(row[6]);
    const recurringFrequency = parseRecurringFrequency(row[7]);
    const recurringStartDate = normalizeDate(row[8]);
    if (!name || initialAmount == null || initialAmount < 0) continue;
    debts.push({
      id: id || generateId(),
      name,
      initialAmount,
      startDate: startDate ?? undefined,
      owner,
      recurringAmount:
        recurringAmount != null && recurringAmount > 0
          ? recurringAmount
          : undefined,
      recurringFrequency,
      recurringDayOfMonth: recurringDay,
      recurringStartDate: recurringStartDate ?? undefined,
    });
  }
  return debts;
}

export async function readDebtPaymentsFromSheet(
  accessToken: string,
  spreadsheetId: string
): Promise<DebtPayment[]> {
  const rows = await getSheetValues(
    accessToken,
    spreadsheetId,
    "DebtPayments!A2:E",
    "UNFORMATTED_VALUE",
  );
  const payments: DebtPayment[] = [];
  for (const row of rows) {
    const id = String(row[0] ?? "").trim();
    const debtId = String(row[1] ?? "").trim();
    const date = normalizeDate(row[2]);
    const amount = parseAmount(row[3]);
    const note = String(row[4] ?? "").trim() || undefined;
    if (!debtId || !date || amount == null || amount <= 0) continue;
    payments.push({
      id: id || generateId(),
      debtId,
      date,
      amount,
      note,
    });
  }
  return payments;
}

export async function readRulesFromSheet(
  accessToken: string,
  spreadsheetId: string
): Promise<Rule[]> {
  const rows = await getSheetValues(accessToken, spreadsheetId, "Rules!A2:D");
  const rules: Rule[] = [];
  for (const row of rows) {
    if (!row || row.length < 4) continue;
    const [idRaw, enabledRaw, conditionRaw, actionRaw] = row;
    const id = String(idRaw ?? "").trim();
    if (!id) continue;
    try {
      const enabled =
        String(enabledRaw ?? "").toLowerCase() === "true" ||
        String(enabledRaw ?? "") === "1";
      const condition = JSON.parse(String(conditionRaw ?? "{}"));
      const action = JSON.parse(String(actionRaw ?? "{}"));
      rules.push({ id, enabled, condition, action });
    } catch {
      // ignore malformed rows
    }
  }
  return rules;
}

export async function appendExpenses(
  accessToken: string,
  spreadsheetId: string,
  expenses: Expense[]
): Promise<void> {
  const range = "Expenses!A:G";
  const values = expenses.map((e) => [
    e.id,
    e.date,
    e.amount,
    e.description,
    e.category || "",
    e.source,
    e.cardMember ?? "",
  ]);
  await updateSheet(accessToken, spreadsheetId, range, values, false);
}

export async function appendIncome(
  accessToken: string,
  spreadsheetId: string,
  income: Income[]
): Promise<void> {
  const range = "Income!A:I";
  const values = income.map((i) => [
    i.date,
    i.amount,
    i.description,
    i.category,
    i.owner === "Tasnuva" ? "Tasnuva" : "Ayaz",
    i.recurringAmount ?? "",
    i.recurringFrequency ?? "",
    i.recurringDayOfMonth ?? "",
    i.recurringStartDate ?? "",
  ]);
  await updateSheet(accessToken, spreadsheetId, range, values, false);
}

export async function clearAndWriteExpenses(
  accessToken: string,
  spreadsheetId: string,
  expenses: Expense[]
): Promise<void> {
  const headers = [
    [
      "ID",
      "Date",
      "Amount",
      "Description",
      "Category",
      "Source",
      "Card Member",
    ],
  ];
  const rows = expenses.map((e) => [
    e.id,
    e.date,
    e.amount,
    e.description,
    e.category || "",
    e.source,
    e.cardMember ?? "",
  ]);
  const values = [...headers, ...rows];
  const range = "Expenses!A1:G";
  await clearRange(accessToken, spreadsheetId, "Expenses!A1:G10000");
  if (values.length > 0) {
    await updateSheet(accessToken, spreadsheetId, range, values, false);
  }
}

export async function clearAndWriteMortgage(
  accessToken: string,
  spreadsheetId: string,
  expenses: Expense[]
): Promise<void> {
  const headers = [
    [
      "ID",
      "Date",
      "Amount",
      "Description",
      "Category",
      "Source",
      "Card Member",
    ],
  ];
  const rows = expenses.map((e) => [
    e.id,
    e.date,
    e.amount,
    e.description,
    e.category || "",
    e.source,
    e.cardMember ?? "",
  ]);
  const values = [...headers, ...rows];
  const range = "Mortgage!A1:G";
  await clearRange(accessToken, spreadsheetId, "Mortgage!A1:G10000");
  if (values.length > 0) {
    await updateSheet(accessToken, spreadsheetId, range, values, false);
  }
}

export async function clearAndWriteIncome(
  accessToken: string,
  spreadsheetId: string,
  income: Income[]
): Promise<void> {
  const headers = [
    [
      "Date",
      "Amount",
      "Description",
      "Category",
      "Owner",
      "Recurring Amount",
      "Recurring Frequency",
      "Recurring Day",
      "Recurring Start Date",
    ],
  ];
  const rows = income.map((i) => [
    i.date,
    i.amount,
    i.description,
    i.category,
    i.owner === "Tasnuva" ? "Tasnuva" : "Ayaz",
    i.recurringAmount ?? "",
    i.recurringFrequency ?? "",
    i.recurringDayOfMonth ?? "",
    i.recurringStartDate ?? "",
  ]);
  const values = [...headers, ...rows];
  const range = "Income!A1:I";
  await clearRange(accessToken, spreadsheetId, "Income!A1:I10000");
  if (values.length > 0) {
    await updateSheet(accessToken, spreadsheetId, range, values, false);
  }
}

export async function clearAndWriteDebts(
  accessToken: string,
  spreadsheetId: string,
  debts: Debt[]
): Promise<void> {
  const headers = [
    [
      "Id",
      "Name",
      "Initial Amount",
      "Start Date",
      "Owner",
      "Recurring Amount",
      "Recurring Day",
      "Recurring Frequency",
      "Recurring Start Date",
    ],
  ];
  const rows = debts.map((d) => [
    d.id,
    d.name,
    d.initialAmount,
    d.startDate ?? "",
    d.owner === "Tasnuva" ? "Tasnuva" : "Ayaz",
    d.recurringAmount ?? "",
    d.recurringDayOfMonth ?? "",
    d.recurringFrequency === "biweekly" ? "biweekly" : d.recurringFrequency ?? "",
    d.recurringStartDate ?? "",
  ]);
  const values = [...headers, ...rows];
  const range = "Debts!A1:I";
  await clearRange(accessToken, spreadsheetId, "Debts!A1:I10000");
  if (values.length > 0) {
    await updateSheet(accessToken, spreadsheetId, range, values, false);
  }
}

export async function clearAndWriteDebtPayments(
  accessToken: string,
  spreadsheetId: string,
  debtPayments: DebtPayment[]
): Promise<void> {
  const headers = [["Id", "Debt Id", "Date", "Amount", "Note"]];
  const rows = debtPayments.map((p) => [
    p.id,
    p.debtId,
    p.date,
    p.amount,
    p.note ?? "",
  ]);
  const values = [...headers, ...rows];
  const range = "DebtPayments!A1:E";
  await clearRange(accessToken, spreadsheetId, "DebtPayments!A1:E10000");
  if (values.length > 0) {
    await updateSheet(accessToken, spreadsheetId, range, values, false);
  }
}

export async function clearAndWriteRules(
  accessToken: string,
  spreadsheetId: string,
  rules: Rule[]
): Promise<void> {
  const headers = [["Id", "Enabled", "Condition", "Action"]];
  const rows = rules.map((rule) => [
    rule.id,
    rule.enabled ? "TRUE" : "FALSE",
    JSON.stringify(rule.condition),
    JSON.stringify(rule.action),
  ]);
  const values = [...headers, ...rows];
  const range = "Rules!A1:D";
  await clearRange(accessToken, spreadsheetId, "Rules!A1:D10000");
  if (values.length > 0) {
    await updateSheet(accessToken, spreadsheetId, range, values, false);
  }
}

export async function clearAndWritePresets(
  accessToken: string,
  spreadsheetId: string,
  presetTransactions: PresetTransaction[]
): Promise<void> {
  const headers = [["Id", "Source", "Description", "Category", "Card Member"]];
  const rows = presetTransactions.map((p) => [
    p.id,
    p.source,
    p.description,
    p.category,
    p.cardMember,
  ]);
  const values = [...headers, ...rows];
  const range = "PresetTransactions!A1:E";
  await clearRange(accessToken, spreadsheetId, "PresetTransactions!A1:E10000");
  if (values.length > 0) {
    await updateSheet(accessToken, spreadsheetId, range, values, false);
  }
}

export async function readPresetsFromSheet(
  accessToken: string,
  spreadsheetId: string
): Promise<PresetTransaction[]> {
  const rows = await getSheetValues(
    accessToken,
    spreadsheetId,
    "PresetTransactions!A2:E",
    "UNFORMATTED_VALUE",
  );
  const presets: PresetTransaction[] = [];
  for (const row of rows) {
    const id = String(row[0] ?? "").trim();
    const rawSource = String(row[1] ?? "").trim().toLowerCase();
    const description = String(row[2] ?? "").trim();
    const category = String(row[3] ?? "").trim();
    const cardMember = String(row[4] ?? "").trim();
    if (!id) continue;
    const source: ExpenseSource = VALID_EXPENSE_SOURCES.includes(
      rawSource as ExpenseSource,
    )
      ? (rawSource as ExpenseSource)
      : "manual";
    presets.push({
      id,
      source,
      description,
      category,
      cardMember,
    });
  }
  return presets;
}

/** Write the minified V2 blob to the Data sheet (single cell A1). */
export async function writeDataBlob(
  accessToken: string,
  spreadsheetId: string,
  blob: string,
): Promise<void> {
  await updateSheet(accessToken, spreadsheetId, "Data!A1", [[blob]], false);
}

/** Read the minified V2 blob from the Data sheet (A1). Returns null if empty or missing. */
export async function readDataBlob(
  accessToken: string,
  spreadsheetId: string,
): Promise<string | null> {
  const rows = await getSheetValues(
    accessToken,
    spreadsheetId,
    "Data!A1",
    "UNFORMATTED_VALUE",
  );
  if (!rows.length || !rows[0]?.length) return null;
  const value = String(rows[0][0] ?? "").trim();
  return value || null;
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
  debts: number;
  debtPayments: number;
  mortgage: number;
  rules: number;
  presetTransactions: number;
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
  const debts = byTitle["Debts"];
  const debtPayments = byTitle["DebtPayments"];
  const mortgage = byTitle["Mortgage"];
  const rules = byTitle["Rules"];
  const presetTransactions = byTitle["PresetTransactions"];
  if (
    expenses == null ||
    income == null ||
    totals == null ||
    debts == null ||
    debtPayments == null ||
    mortgage == null ||
    rules == null ||
    presetTransactions == null
  )
    return null;
  return { expenses, income, totals, debts, debtPayments, mortgage, rules, presetTransactions };
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
  const needed = [
    "Expenses",
    "Income",
    "Totals",
    "Debts",
    "DebtPayments",
    "Mortgage",
    "Rules",
    "PresetTransactions",
    "Data",
  ];
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

  // Expenses: header row bold + larger, all left align (A–G), column C (Amount) currency
  requests.push(
    repeatCellRequest(
      sheetIds.expenses,
      0,
      1,
      0,
      7,
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
      7,
      { horizontalAlignment: "LEFT" },
      leftAlignFields
    )
  );
  requests.push(
    repeatCellRequest(
      sheetIds.expenses,
      1,
      10000,
      2,
      3,
      {
        horizontalAlignment: "LEFT",
        numberFormat: { type: "CURRENCY", pattern: "$#,##0.00" },
      },
      currencyFields
    )
  );

  // Mortgage: same layout as Expenses (ID, Date, Amount, Description, Category, Source, Card Member), column C currency
  requests.push(
    repeatCellRequest(
      sheetIds.mortgage,
      0,
      1,
      0,
      7,
      { bold: true, fontSize: 12, horizontalAlignment: "LEFT" },
      headerFields
    )
  );
  requests.push(
    repeatCellRequest(
      sheetIds.mortgage,
      0,
      10000,
      0,
      7,
      { horizontalAlignment: "LEFT" },
      leftAlignFields
    )
  );
  requests.push(
    repeatCellRequest(
      sheetIds.mortgage,
      1,
      10000,
      2,
      3,
      {
        horizontalAlignment: "LEFT",
        numberFormat: { type: "CURRENCY", pattern: "$#,##0.00" },
      },
      currencyFields
    )
  );

  // Income: column B (Amount) currency, columns A–I (Date, Amount, Description, Category, Owner, Recurring*)
  requests.push(
    repeatCellRequest(
      sheetIds.income,
      0,
      1,
      0,
      9,
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
      9,
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

  // Debts: header bold + larger, all left align (A–I), columns C and F (Initial Amount, Recurring Amount) currency
  requests.push(
    repeatCellRequest(
      sheetIds.debts,
      0,
      1,
      0,
      9,
      { bold: true, fontSize: 12, horizontalAlignment: "LEFT" },
      headerFields
    )
  );
  requests.push(
    repeatCellRequest(
      sheetIds.debts,
      0,
      10000,
      0,
      9,
      { horizontalAlignment: "LEFT" },
      leftAlignFields
    )
  );
  requests.push(
    repeatCellRequest(
      sheetIds.debts,
      1,
      10000,
      2,
      3,
      {
        horizontalAlignment: "LEFT",
        numberFormat: { type: "CURRENCY", pattern: "$#,##0.00" },
      },
      currencyFields
    )
  );
  requests.push(
    repeatCellRequest(
      sheetIds.debts,
      1,
      10000,
      5,
      6,
      {
        horizontalAlignment: "LEFT",
        numberFormat: { type: "CURRENCY", pattern: "$#,##0.00" },
      },
      currencyFields
    )
  );

  // DebtPayments: header bold + larger, all left align (A–E), column D (Amount) currency
  requests.push(
    repeatCellRequest(
      sheetIds.debtPayments,
      0,
      1,
      0,
      5,
      { bold: true, fontSize: 12, horizontalAlignment: "LEFT" },
      headerFields
    )
  );
  requests.push(
    repeatCellRequest(
      sheetIds.debtPayments,
      0,
      10000,
      0,
      5,
      { horizontalAlignment: "LEFT" },
      leftAlignFields
    )
  );
  requests.push(
    repeatCellRequest(
      sheetIds.debtPayments,
      1,
      10000,
      3,
      4,
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

  // Rules: header row bold + larger, all left align (A–D)
  requests.push(
    repeatCellRequest(
      sheetIds.rules,
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
      sheetIds.rules,
      0,
      10000,
      0,
      4,
      { horizontalAlignment: "LEFT" },
      leftAlignFields
    )
  );

  // PresetTransactions: header row bold + larger, all left align (A–E)
  requests.push(
    repeatCellRequest(
      sheetIds.presetTransactions,
      0,
      1,
      0,
      5,
      { bold: true, fontSize: 12, horizontalAlignment: "LEFT" },
      headerFields
    )
  );
  requests.push(
    repeatCellRequest(
      sheetIds.presetTransactions,
      0,
      10000,
      0,
      5,
      { horizontalAlignment: "LEFT" },
      leftAlignFields
    )
  );

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
