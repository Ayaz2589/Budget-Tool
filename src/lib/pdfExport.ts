import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import type {
  Debt,
  DebtPayment,
  Expense,
  Income,
  ExpenseSource,
  PresetTransaction,
} from "@/types/core";
import type { Rule } from "@/types/rules";
import type { CategoryWithColorPayload } from "@/types/payload";
import type { ParsedExportedPdf } from "@/types/pdf";
import { getMonthLabel, computeMonthTotals } from "@/lib/totals";
import { formatCurrency, formatPercent } from "@/lib/format";
import { serializeToBlob, parseFromBlob } from "@/lib/minifiedPayload";
import { EXPENSE_SOURCE_DISPLAY_LABELS } from "@/lib/sourceLabels";

const AMOUNT_RE = /\$([\d,]+\.\d{2})/;
const INCOME_ROW_RE = /(\d{4}-\d{2}-\d{2})\s+(Paycheck|Rent)\s+\$([\d,]+\.\d{2})\s+(Paycheck|Rent)/g;

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
  incomeCategoriesWithColors: CategoryWithColorPayload[] = [],
  owners: string[] = [],
  cardSources?: string[],
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
        "Owner",
      ];
      const expenseBody = monthExpenses.map((e) => [
        e.id,
        e.date,
        e.description.slice(0, 40) + (e.description.length > 40 ? "…" : ""),
        formatCurrency(e.amount),
        e.category || "—",
        EXPENSE_SOURCE_DISPLAY_LABELS[e.source] ?? e.source,
        e.owner ?? "No Owner",
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
        "Owner",
        "Source",
      ];
      const mortgageBody = monthMortgage.map((e) => [
        e.id,
        e.date,
        e.description.slice(0, 40) + (e.description.length > 40 ? "…" : ""),
        formatCurrency(e.amount),
        e.owner ?? "No Owner",
        EXPENSE_SOURCE_DISPLAY_LABELS[e.source] ?? e.source,
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
      const incomeHead = [
        "Date",
        "Description",
        "Amount",
        "Category",
        "Owner",
      ];
      const incomeBody = monthIncome.map((i) => [
        i.date,
        (i.description || "Income").slice(0, 50) +
          ((i.description || "").length > 50 ? "…" : ""),
        formatCurrency(i.amount),
        i.category || "Uncategorized",
        i.owner ?? "No Owner",
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
    const debtHead = ["Id", "Name", "Initial Amount", "Start Date", "Owner"];
    const debtBody = debts.map((d) => [
      d.id,
      d.name.slice(0, 25) + (d.name.length > 25 ? "…" : ""),
      formatCurrency(d.initialAmount),
      d.startDate ?? "—",
      d.owner ?? "No Owner",
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

  // Machine-readable block for re-import (V2: minified JSON + gzip + Base64).
  const DATA_START = "BUDGET_TOOL_DATA_START";
  const DATA_END = "BUDGET_TOOL_DATA_END";
  const v2Block = serializeToBlob({
    expenses,
    income,
    debts,
    debtPayments,
    rules,
    presetTransactions,
    expenseCategoriesWithColors,
    incomeCategoriesWithColors,
    owners,
    cardSources,
  });
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

export type { ParsedExportedPdf };

function emptyParsed(): ParsedExportedPdf {
  return {
    expenses: [],
    income: [],
    debts: [],
    debtPayments: [],
    rules: [],
    presetTransactions: [],
    owners: [],
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
    let block = normalized
      .slice(startIdx + DATA_START_MARKER.length, endIdx)
      .replace(/\s+/g, " ")
      .trim();
    // If the block between first START and first END doesn't start with V2, extraction
    // order may have put table content between START and END. Find "V2" after START and
    // use the END that follows that V2 blob.
    if (!block.startsWith("V2")) {
      const afterStart = normalized.slice(startIdx + DATA_START_MARKER.length);
      const v2Idx = afterStart.indexOf("V2");
      if (v2Idx !== -1) {
        const blobStartInNorm = startIdx + DATA_START_MARKER.length + v2Idx;
        const endAfterV2 = normalized.indexOf(DATA_END_MARKER, blobStartInNorm);
        if (endAfterV2 !== -1 && endAfterV2 > blobStartInNorm) {
          block = normalized
            .slice(blobStartInNorm, endAfterV2)
            .replace(/\s+/g, " ")
            .trim();
        }
      }
    }
    if (block.startsWith("V2")) {
    try {
      const blob = block.replace(/\s/g, "").trim();
      const expanded = parseFromBlob(blob);
      return {
          expenses: Array.isArray(expanded.expenses) ? expanded.expenses : [],
          income: Array.isArray(expanded.income) ? expanded.income : [],
          debts: Array.isArray(expanded.debts) ? expanded.debts : [],
          debtPayments: Array.isArray(expanded.debtPayments)
            ? expanded.debtPayments
            : [],
          rules: Array.isArray(expanded.rules) ? expanded.rules : [],
          presetTransactions: Array.isArray(expanded.presetTransactions)
            ? expanded.presetTransactions
            : [],
          expenseCategoriesWithColors: expanded.expenseCategoriesWithColors,
          incomeCategoriesWithColors: expanded.incomeCategoriesWithColors,
          owners: expanded.owners,
          cardSources: expanded.cardSources,
        };
    } catch {
      return emptyParsed();
    }
    }
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
    /(amex-gold-|amex-|chase-|apple-|manual-|td-)([a-z0-9-]+)\s+(\d{4}-\d{2}-\d{2})\s/g;
  let match: RegExpExecArray | null;
  const expenseMatches: {
    id: string;
    prefix: string;
    date: string;
    index: number;
    end: number;
  }[] = [];
  while ((match = expenseIdRe.exec(text)) !== null) {
    const prefix = match[1]!;
    const suffix = match[2]!;
    const date = match[3]!;
    const id = prefix + suffix;
    const end = expenseIdRe.lastIndex;
    expenseMatches.push({
      id,
      prefix,
      date,
      index: match.index,
      end,
    });
  }
  const seenExpenseIds = new Set<string>();
  for (let i = 0; i < expenseMatches.length; i++) {
    const { id, prefix, date, index, end } = expenseMatches[i]!;
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
      "amex-gold-": "amex-gold",
      "chase-": "chase",
      "apple-": "apple",
      "manual-": "manual",
      "td-": "td",
    };
    const source = sourceMap[prefix as keyof typeof sourceMap] ?? "manual";
    expenses.push({
      id,
      date,
      amount,
      description: description || "Imported from PDF",
      category: "",
      source,
      owner: undefined,
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

  return {
    expenses,
    income,
    debts: [],
    debtPayments: [],
    rules: [],
    presetTransactions: [],
    owners: [],
  };
}
