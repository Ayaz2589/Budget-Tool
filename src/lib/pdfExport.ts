import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import pako from "pako";
import type {
  Debt,
  DebtPayment,
  Expense,
  Income,
  ExpenseSource,
  PresetTransaction,
} from "@/lib/types";
import type { Rule } from "@/lib/rules";
import { getMonthLabel, computeMonthTotals } from "@/lib/totals";
import { formatCurrency, formatPercent } from "@/lib/format";

/** Category name + Tailwind color for PDF payload (matches CategoryWithColor when used). */
interface CategoryWithColorPayload {
  name: string;
  color: string;
}

const AMOUNT_RE = /\$([\d,]+\.\d{2})/;
const INCOME_ROW_RE = /(\d{4}-\d{2}-\d{2})\s+(Paycheck|Rent)\s+\$([\d,]+\.\d{2})\s+(Paycheck|Rent)/g;

const SOURCE_LABELS: Record<ExpenseSource, string> = {
  amex: "American Express",
  chase: "Chase",
  apple: "Apple Card",
  manual: "Manual",
  td: "Debit (TD Bank)",
};

function groupByMonth<T extends { date: string }>(items: T[]): Map<string, T[]> {
  const map = new Map<string, T[]>();
  for (const item of items) {
    const key = item.date.slice(0, 7);
    if (!map.has(key)) map.set(key, []);
    map.get(key)!.push(item);
  }
  return map;
}

/** Returns all month keys that appear in either expenses or income, sorted newest first. */
function getMonthKeys(expenses: Expense[], income: Income[]): string[] {
  const keys = new Set<string>();
  for (const e of expenses) keys.add(e.date.slice(0, 7));
  for (const i of income) keys.add(i.date.slice(0, 7));
  return Array.from(keys).sort((a, b) => b.localeCompare(a));
}

export function downloadTransactionsAndIncomePdf(
  expenses: Expense[],
  income: Income[],
  debts: Debt[] = [],
  debtPayments: DebtPayment[] = [],
  rules: Rule[] = [],
  presetTransactions: PresetTransaction[] = [],
  expenseCategoriesWithColors: CategoryWithColorPayload[] = [],
  incomeCategoriesWithColors: CategoryWithColorPayload[] = []
): void {
  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
  const margin = 14;
  let y = 20;

  doc.setFontSize(18);
  doc.text("Transactions & Income", margin, y);
  y += 12;

  // Dashboard summary (current month, like the dashboard)
  const currentMonthKey = new Date().toISOString().slice(0, 7);
  const selectedMonth = computeMonthTotals(
    currentMonthKey,
    expenses,
    income,
    0,
    0,
    0,
  );
  if (y > 260) {
    doc.addPage();
    y = 20;
  }
  doc.setFontSize(14);
  doc.text(`Summary (${selectedMonth.monthLabel})`, margin, y);
  y += 8;
  const summaryRows: [string, string][] = [
    ["Total Earned", formatCurrency(selectedMonth.totalEarned)],
    ["Total Spent", formatCurrency(selectedMonth.totalSpent)],
    ["Total Spent w/o Mortgage", formatCurrency(selectedMonth.totalSpentWithoutMortgage)],
    ["50/50 Split", formatCurrency(selectedMonth.split5050)],
    ["Tasnuva's Total Spending", formatCurrency(selectedMonth.novasTotalSpending)],
    ["My Total Spending w/o Mortgage", formatCurrency(selectedMonth.myTotalSpendingWithoutMortgage)],
    ["Total Saved", formatCurrency(selectedMonth.totalSaved)],
    ["Personal Savings Rate", formatPercent(selectedMonth.personalSavingsRate)],
  ];
  const summaryHead = [["Metric", "Value"]];
  const summaryBody = summaryRows.map(([label, value]) => [label, value]);
  autoTable(doc, {
    startY: y,
    head: summaryHead,
    body: summaryBody,
    theme: "grid",
    margin: { left: margin, right: margin },
    tableWidth: "auto",
    styles: { fontSize: 9 },
    headStyles: { fillColor: [66, 66, 66], textColor: 255 },
  });
  y = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 14;

  const expenseByMonth = groupByMonth(expenses);
  const incomeByMonth = groupByMonth(income);
  const monthKeys = getMonthKeys(expenses, income);

  for (const monthKey of monthKeys) {
    const label = getMonthLabel(monthKey);
    const monthAll = (expenseByMonth.get(monthKey) ?? []).sort((a, b) =>
      b.date.localeCompare(a.date)
    );
    const monthExpenses = monthAll.filter(
      (e) => (e.category || "").toLowerCase() !== "mortgage"
    );
    const monthMortgage = monthAll.filter(
      (e) => (e.category || "").toLowerCase() === "mortgage"
    );
    const monthIncome = (incomeByMonth.get(monthKey) ?? []).sort((a, b) =>
      b.date.localeCompare(a.date)
    );

    // Section header
    if (y > 250) {
      doc.addPage();
      y = 20;
    }
    doc.setFontSize(14);
    doc.text(label, margin, y);
    y += 8;

    // Expenses table (non-mortgage)
    if (monthExpenses.length > 0) {
      const expenseHead = [
        "ID",
        "Date",
        "Description",
        "Amount",
        "Category",
        "Source",
        "Card Member",
      ];
      const expenseBody = monthExpenses.map((e) => [
        e.id,
        e.date,
        e.description.slice(0, 40) + (e.description.length > 40 ? "…" : ""),
        formatCurrency(e.amount),
        e.category || "—",
        SOURCE_LABELS[e.source] ?? e.source,
        e.cardMember ?? "—",
      ]);
      autoTable(doc, {
        startY: y,
        head: [expenseHead],
        body: expenseBody,
        theme: "grid",
        margin: { left: margin, right: margin },
        tableWidth: "auto",
        styles: { fontSize: 8 },
        headStyles: { fillColor: [66, 66, 66], textColor: 255 },
      });
      y = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 10;
    }

    // Mortgage table (per month)
    if (monthMortgage.length > 0) {
      if (y > 260) {
        doc.addPage();
        y = 20;
      }
      doc.setFontSize(12);
      doc.text("Mortgage", margin, y);
      y += 6;
      const mortgageHead = [
        "ID",
        "Date",
        "Description",
        "Amount",
        "Source",
      ];
      const mortgageBody = monthMortgage.map((e) => [
        e.id,
        e.date,
        e.description.slice(0, 40) + (e.description.length > 40 ? "…" : ""),
        formatCurrency(e.amount),
        SOURCE_LABELS[e.source] ?? e.source,
      ]);
      autoTable(doc, {
        startY: y,
        head: [mortgageHead],
        body: mortgageBody,
        theme: "grid",
        margin: { left: margin, right: margin },
        tableWidth: "auto",
        styles: { fontSize: 8 },
        headStyles: { fillColor: [66, 66, 66], textColor: 255 },
      });
      y = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 10;
    }

    // Income table
    if (monthIncome.length > 0) {
      if (y > 260) {
        doc.addPage();
        y = 20;
      }
      const incomeRecurringLabel = (i: Income): string => {
        if (i.recurringAmount == null || i.recurringAmount <= 0) return "—";
        if (i.recurringFrequency === "biweekly" && i.recurringStartDate)
          return `Biweekly from ${i.recurringStartDate}`;
        if (
          i.recurringFrequency === "monthly" &&
          i.recurringDayOfMonth != null &&
          i.recurringDayOfMonth >= 1 &&
          i.recurringDayOfMonth <= 31
        )
          return `Monthly on ${i.recurringDayOfMonth}`;
        return "—";
      };
      const incomeHead = [
        "Date",
        "Description",
        "Amount",
        "Category",
        "Owner",
        "Recurring",
      ];
      const incomeBody = monthIncome.map((i) => [
        i.date,
        (i.description || "Income").slice(0, 50) +
          ((i.description || "").length > 50 ? "…" : ""),
        formatCurrency(i.amount),
        i.category || "—",
        i.owner === "Tasnuva" ? "Tasnuva" : "Ayaz",
        incomeRecurringLabel(i),
      ]);
      autoTable(doc, {
        startY: y,
        head: [incomeHead],
        body: incomeBody,
        theme: "grid",
        margin: { left: margin, right: margin },
        tableWidth: "auto",
        styles: { fontSize: 8 },
        headStyles: { fillColor: [66, 66, 66], textColor: 255 },
      });
      y = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 14;
    }

    y += 6;
  }

  // Debts section
  if (debts.length > 0) {
    if (y > 250) {
      doc.addPage();
      y = 20;
    }
    doc.setFontSize(14);
    doc.text("Debts", margin, y);
    y += 8;
    const debtHead = [
      "Id",
      "Name",
      "Initial Amount",
      "Start Date",
      "Owner",
      "Recurring Amount",
      "Recurring Day",
      "Recurring Frequency",
      "Recurring Start Date",
    ];
    const debtBody = debts.map((d) => [
      d.id,
      d.name.slice(0, 25) + (d.name.length > 25 ? "…" : ""),
      formatCurrency(d.initialAmount),
      d.startDate ?? "—",
      d.owner === "Tasnuva" ? "Tasnuva" : "Ayaz",
      d.recurringAmount != null ? formatCurrency(d.recurringAmount) : "—",
      d.recurringDayOfMonth ?? "—",
      d.recurringFrequency ?? "—",
      d.recurringStartDate ?? "—",
    ]);
    autoTable(doc, {
      startY: y,
      head: [debtHead],
      body: debtBody,
      theme: "grid",
      margin: { left: margin, right: margin },
      tableWidth: "auto",
      styles: { fontSize: 7 },
      headStyles: { fillColor: [66, 66, 66], textColor: 255 },
    });
    y = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 10;
  }

  // Debt Payments section
  if (debtPayments.length > 0) {
    if (y > 260) {
      doc.addPage();
      y = 20;
    }
    doc.setFontSize(14);
    doc.text("Debt Payments", margin, y);
    y += 8;
    const dpHead = ["Id", "Debt Id", "Date", "Amount", "Note"];
    const dpBody = debtPayments.map((p) => [
      p.id,
      p.debtId,
      p.date,
      formatCurrency(p.amount),
      (p.note ?? "").slice(0, 30) + ((p.note?.length ?? 0) > 30 ? "…" : ""),
    ]);
    autoTable(doc, {
      startY: y,
      head: [dpHead],
      body: dpBody,
      theme: "grid",
      margin: { left: margin, right: margin },
      tableWidth: "auto",
      styles: { fontSize: 8 },
      headStyles: { fillColor: [66, 66, 66], textColor: 255 },
    });
    y = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 10;
  }

  // Machine-readable block for re-import (V2: gzip + Base64).
  const DATA_START = "BUDGET_TOOL_DATA_START";
  const DATA_END = "BUDGET_TOOL_DATA_END";
  const payload = {
    expenses,
    income,
    debts,
    debtPayments,
    rules,
    presetTransactions,
    expenseCategoriesWithColors,
    incomeCategoriesWithColors,
  };
  const jsonString = JSON.stringify(payload);
  const compressed = pako.gzip(new TextEncoder().encode(jsonString));
  let base64 = "";
  for (let i = 0; i < compressed.length; i++) {
    base64 += String.fromCharCode(compressed[i]!);
  }
  const base64Str = btoa(base64);
  const v2Block = "V2" + base64Str;
  if (y > 260) {
    doc.addPage();
    y = 20;
  }
  doc.setFontSize(7);
  const pageWidth = doc.internal.pageSize.getWidth();
  const maxWidth = pageWidth - margin * 2;
  doc.text(DATA_START, margin, y);
  y += 4;
  if (y > 280) {
    doc.addPage();
    y = 20;
  }
  const wrapped = doc.splitTextToSize(v2Block, maxWidth);
  for (const line of wrapped) {
    doc.text(line, margin, y);
    y += 4;
    if (y > 280) {
      doc.addPage();
      y = 20;
    }
  }
  doc.text(DATA_END, margin, y);

  const filename = `transactions-income-${new Date().toISOString().slice(0, 10)}.pdf`;
  doc.save(filename);
}

const DATA_START_MARKER = "BUDGET_TOOL_DATA_START";
const DATA_END_MARKER = "BUDGET_TOOL_DATA_END";
const VALID_EXPENSE_SOURCES = [
  "amex",
  "chase",
  "apple",
  "manual",
  "td",
] as const;

export interface ParsedExportedPdf {
  expenses: Expense[];
  income: Income[];
  debts: Debt[];
  debtPayments: DebtPayment[];
  rules: Rule[];
  presetTransactions: PresetTransaction[];
  expenseCategoriesWithColors?: CategoryWithColorPayload[];
  incomeCategoriesWithColors?: CategoryWithColorPayload[];
}

function emptyParsed(): ParsedExportedPdf {
  return {
    expenses: [],
    income: [],
    debts: [],
    debtPayments: [],
    rules: [],
    presetTransactions: [],
  };
}

/**
 * Parse text extracted from an exported transactions PDF (V2 data block only).
 * If the block starts with V2: decompress and parse JSON. Otherwise returns empty.
 * If no data block markers at all, uses table fallback (e.g. Chase PDF).
 */
export function parseExportedPdfData(pdfText: string): ParsedExportedPdf {
  const normalized = pdfText
    .replace(/\s+/g, " ")
    .replace(/BUDGET_\s*TOOL_\s*DATA_\s*START/g, "BUDGET_TOOL_DATA_START")
    .replace(/BUDGET_\s*TOOL_\s*DATA_\s*END/g, "BUDGET_TOOL_DATA_END");
  const startIdx = normalized.indexOf(DATA_START_MARKER);
  const endIdx = normalized.indexOf(DATA_END_MARKER);
  if (startIdx !== -1 && endIdx !== -1 && endIdx > startIdx) {
    const block = normalized
      .slice(startIdx + DATA_START_MARKER.length, endIdx)
      .replace(/\s+/g, " ")
      .trim();
    if (block.startsWith("V2")) {
      try {
        const base64Part = block.slice(2).replace(/\s/g, "");
        const binary = atob(base64Part);
        const bytes = new Uint8Array(binary.length);
        for (let i = 0; i < binary.length; i++) {
          bytes[i] = binary.charCodeAt(i);
        }
        const decompressed = pako.ungzip(bytes, { to: "string" });
        const payload = JSON.parse(decompressed) as {
          expenses?: Expense[];
          income?: Income[];
          debts?: Debt[];
          debtPayments?: DebtPayment[];
          rules?: Rule[];
          presetTransactions?: PresetTransaction[];
          expenseCategoriesWithColors?: CategoryWithColorPayload[];
          incomeCategoriesWithColors?: CategoryWithColorPayload[];
        };
        return {
          expenses: Array.isArray(payload.expenses) ? payload.expenses : [],
          income: Array.isArray(payload.income) ? payload.income : [],
          debts: Array.isArray(payload.debts) ? payload.debts : [],
          debtPayments: Array.isArray(payload.debtPayments)
            ? payload.debtPayments
            : [],
          rules: Array.isArray(payload.rules) ? payload.rules : [],
          presetTransactions: Array.isArray(payload.presetTransactions)
            ? payload.presetTransactions
            : [],
          expenseCategoriesWithColors: payload.expenseCategoriesWithColors,
          incomeCategoriesWithColors: payload.incomeCategoriesWithColors,
        };
      } catch {
        return emptyParsed();
      }
    }
    return emptyParsed();
  }
  const fallback = parseExportedPdfTableFallback(normalized);
  return {
    ...fallback,
    debts: [],
    debtPayments: [],
    rules: [],
    presetTransactions: [],
  };
}

/**
 * Fallback when BUDGET_TOOL_DATA_START/END block is missing (e.g. old PDFs or
 * extraction quirks). Parses the visible table: expense rows (id + date + amount)
 * and income rows (date + Paycheck/Rent + amount).
 */
function parseExportedPdfTableFallback(pdfText: string): ParsedExportedPdf {
  const expenses: Expense[] = [];
  const income: Income[] = [];
  const text = pdfText.replace(/\s+/g, " ");

  // Find all expense rows: "amex-xxx 2026-01-26 ... $110.60 ..." (id prefix + id suffix + date, then later $amount)
  const expenseIdRe =
    /(amex-|chase-|apple-|manual-|td-)([a-z0-9-]+)\s+(\d{4}-\d{2}-\d{2})\s/g;
  let match: RegExpExecArray | null;
  const expenseMatches: { id: string; date: string; index: number; end: number }[] = [];
  while ((match = expenseIdRe.exec(text)) !== null) {
    const prefix = match[1]!;
    const suffix = match[2]!;
    const date = match[3]!;
    const id = prefix + suffix;
    const end = expenseIdRe.lastIndex;
    expenseMatches.push({
      id,
      date,
      index: match.index,
      end,
    });
  }
  const seenExpenseIds = new Set<string>();
  for (let i = 0; i < expenseMatches.length; i++) {
    const { id, date, index, end } = expenseMatches[i]!;
    if (seenExpenseIds.has(id)) continue;
    seenExpenseIds.add(id);
    const rowEnd = expenseMatches[i + 1]?.index ?? text.length;
    const row = text.slice(index, rowEnd);
    const amountMatch = row.match(AMOUNT_RE);
    const amount = amountMatch
      ? parseFloat(amountMatch[1]!.replace(/,/g, "")) || 0
      : 0;
    const afterDate = row.slice(end - index).trim();
    const descMatch = afterDate.match(/^(.+?)\s+\$[\d,]+\.\d{2}/);
    const description = (descMatch ? descMatch[1]!.trim() : "Imported from PDF").slice(0, 200);
    const sourceMap: Record<string, ExpenseSource> = {
      "amex-": "amex",
      "chase-": "chase",
      "apple-": "apple",
      "manual-": "manual",
      "td-": "td",
    };
    const source = sourceMap[id.slice(0, id.indexOf("-") + 1) as keyof typeof sourceMap] ?? "manual";
    expenses.push({
      id,
      date,
      amount,
      description: description || "Imported from PDF",
      category: "",
      source,
      cardMember: undefined,
    });
  }

  // Income rows: "2026-01-31 Paycheck $4,178.40 Paycheck" or "2026-01-05 Rent $2,200.00 Rent"
  let incomeMatch: RegExpExecArray | null;
  const seenIncome = new Set<string>();
  while ((incomeMatch = INCOME_ROW_RE.exec(text)) !== null) {
    const date = incomeMatch[1]!;
    const desc = incomeMatch[2]!;
    const amountStr = incomeMatch[3]!;
    const category = incomeMatch[4]!;
    const amount = parseFloat(amountStr.replace(/,/g, "")) || 0;
    const key = `${date}-${desc}-${amount}`;
    if (seenIncome.has(key)) continue;
    seenIncome.add(key);
    const id = `income-${date}-${desc.toLowerCase()}-${amount}`;
    income.push({
      id,
      date,
      amount,
      description: desc,
      category,
    });
  }

  return { expenses, income, debts: [], debtPayments: [], rules: [], presetTransactions: [] };
}
