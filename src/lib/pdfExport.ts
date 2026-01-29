import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import type {
  Debt,
  DebtPayment,
  Expense,
  Income,
  ExpenseSource,
} from "@/lib/types";

const AMOUNT_RE = /\$([\d,]+\.\d{2})/;
const INCOME_ROW_RE = /(\d{4}-\d{2}-\d{2})\s+(Paycheck|Rent)\s+\$([\d,]+\.\d{2})\s+(Paycheck|Rent)/g;
import { getMonthLabel } from "@/lib/totals";

const SOURCE_LABELS: Record<ExpenseSource, string> = {
  amex: "American Express",
  chase: "Chase",
  apple: "Apple Card",
  manual: "Manual",
  td: "Debit (TD Bank)",
};

function formatCurrency(n: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(n);
}

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
  debtPayments: DebtPayment[] = []
): void {
  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
  const margin = 14;
  let y = 20;

  doc.setFontSize(18);
  doc.text("Transactions & Income", margin, y);
  y += 12;

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

  // Machine-readable block for re-import. Record separator " || " survives PDF text extraction (space-joined).
  const DATA_START = "BUDGET_TOOL_DATA_START";
  const DATA_END = "BUDGET_TOOL_DATA_END";
  const RECORD_SEP = " || ";
  const FIELD_SEP = " @@ ";
  const sanitize = (s: string) =>
    String(s ?? "")
      .replace(/\t/g, " ")
      .replace(/\s*@@\s*/g, " ")
      .trim();

  const lines: string[] = [];
  for (const e of expenses) {
    lines.push(
      [
        "EXPENSE",
        e.id,
        e.date,
        String(e.amount),
        sanitize(e.description),
        sanitize(e.category),
        e.source,
        sanitize(e.cardMember ?? ""),
      ].join(FIELD_SEP)
    );
  }
  for (const i of income) {
    lines.push(
      [
        "INCOME",
        i.id,
        i.date,
        String(i.amount),
        sanitize(i.description ?? "Income"),
        sanitize(i.category ?? "Other"),
        i.owner === "Tasnuva" ? "Tasnuva" : "Ayaz",
        i.recurringAmount != null ? String(i.recurringAmount) : "",
        i.recurringFrequency ?? "",
        i.recurringDayOfMonth != null ? String(i.recurringDayOfMonth) : "",
        i.recurringStartDate ?? "",
      ].join(FIELD_SEP)
    );
  }
  for (const d of debts) {
    lines.push(
      [
        "DEBT",
        d.id,
        sanitize(d.name),
        String(d.initialAmount),
        d.startDate ?? "",
        d.owner === "Tasnuva" ? "Tasnuva" : "Ayaz",
        d.recurringAmount != null ? String(d.recurringAmount) : "",
        d.recurringFrequency ?? "",
        d.recurringDayOfMonth != null ? String(d.recurringDayOfMonth) : "",
        d.recurringStartDate ?? "",
      ].join(FIELD_SEP)
    );
  }
  for (const p of debtPayments) {
    lines.push(
      [
        "DEBT_PAYMENT",
        p.id,
        p.debtId,
        p.date,
        String(p.amount),
        sanitize(p.note ?? ""),
      ].join(FIELD_SEP)
    );
  }
  const bodyBlock = lines.join(RECORD_SEP);
  if (y > 260) {
    doc.addPage();
    y = 20;
  }
  doc.setFontSize(7);
  const pageWidth = doc.internal.pageSize.getWidth();
  const maxWidth = pageWidth - margin * 2;
  // Write markers on their own lines so they are never split by wrapping
  doc.text(DATA_START, margin, y);
  y += 4;
  if (y > 280) {
    doc.addPage();
    y = 20;
  }
  const wrapped = doc.splitTextToSize(bodyBlock, maxWidth);
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
}

/**
 * Parse text extracted from an exported transactions PDF (with DATA block).
 * Returns { expenses, income }. If no data block found, returns empty arrays.
 */
function parseDebtOwner(value: string): "Ayaz" | "Tasnuva" {
  const s = value.trim();
  if (s === "Tasnuva") return "Tasnuva";
  return "Ayaz";
}

function parseRecurringFrequency(value: string): "monthly" | "biweekly" {
  const s = value.trim().toLowerCase();
  if (s === "biweekly" || s === "bi-weekly") return "biweekly";
  return "monthly";
}

export function parseExportedPdfData(pdfText: string): ParsedExportedPdf {
  const expenses: Expense[] = [];
  const income: Income[] = [];
  const debts: Debt[] = [];
  const debtPayments: DebtPayment[] = [];
  // Normalize: PDF wrapping can split markers across lines (e.g. "BUDGET_TOOL_DATA_" + " START")
  const normalized = pdfText
    .replace(/\s+/g, " ")
    .replace(/BUDGET_\s*TOOL_\s*DATA_\s*START/g, "BUDGET_TOOL_DATA_START")
    .replace(/BUDGET_\s*TOOL_\s*DATA_\s*END/g, "BUDGET_TOOL_DATA_END");
  const startIdx = normalized.indexOf(DATA_START_MARKER);
  const endIdx = normalized.indexOf(DATA_END_MARKER);
  if (startIdx !== -1 && endIdx !== -1 && endIdx > startIdx) {
    // Normalize whitespace (PDF extraction can insert spaces/newlines when text wraps)
    const block = normalized
      .slice(startIdx + DATA_START_MARKER.length, endIdx)
      .replace(/\s+/g, " ")
      .trim();
    const lines = block
      .split(/\s*\|\|\s*/)
      .map((l) => l.trim())
      .filter(Boolean);
    for (const line of lines) {
      const parts = line.split(/\s*@@\s*/);
      if (parts[0] === "EXPENSE" && parts.length >= 8) {
        const source = VALID_EXPENSE_SOURCES.includes(parts[6] as ExpenseSource)
          ? (parts[6] as ExpenseSource)
          : "manual";
        expenses.push({
          id: parts[1]!.trim(),
          date: parts[2]!.trim(),
          amount: parseFloat(parts[3]!) || 0,
          description: parts[4]!.trim() || "Expense",
          category: parts[5]!.trim() || "",
          source,
          cardMember: parts[7]?.trim() || undefined,
        });
      } else if (parts[0] === "INCOME" && parts.length >= 6) {
        const owner =
          parts.length >= 7 && (parts[6] ?? "").trim() === "Tasnuva"
            ? "Tasnuva"
            : "Ayaz";
        const recurringAmount =
          parts.length >= 8 && (parts[7] ?? "").toString().trim()
            ? parseFloat(parts[7]!)
            : undefined;
        const recurringFreq =
          parts.length >= 9 && (parts[8] ?? "").toString().trim()
            ? (parts[8]!.trim().toLowerCase() === "biweekly"
                ? "biweekly"
                : "monthly")
            : undefined;
        const recurringDay =
          parts.length >= 10 && (parts[9] ?? "").toString().trim()
            ? parseInt(parts[9]!, 10)
            : undefined;
        const recurringStart =
          parts.length >= 11 && (parts[10] ?? "").toString().trim()
            ? parts[10]!.trim()
            : undefined;
        income.push({
          id: parts[1]!.trim(),
          date: parts[2]!.trim(),
          amount: parseFloat(parts[3]!) || 0,
          description: parts[4]!.trim() || "Income",
          category: parts[5]!.trim() || "Other",
          owner,
          recurringAmount:
            recurringAmount != null &&
            !Number.isNaN(recurringAmount) &&
            recurringAmount > 0
              ? recurringAmount
              : undefined,
          recurringFrequency: recurringFreq,
          recurringDayOfMonth:
            recurringDay != null &&
            recurringDay >= 1 &&
            recurringDay <= 31
              ? recurringDay
              : undefined,
          recurringStartDate: recurringStart,
        });
      } else if (parts[0] === "DEBT" && parts.length >= 10) {
        const initialAmount = parseFloat(parts[3]!) ?? 0;
        const recurringAmount = parts[6]?.trim()
          ? parseFloat(parts[6]) ?? undefined
          : undefined;
        const recurringFreq = parts[7]?.trim()
          ? parseRecurringFrequency(parts[7])
          : undefined;
        const recurringDay = parts[8]?.trim()
          ? parseInt(parts[8], 10)
          : undefined;
        debts.push({
          id: parts[1]!.trim(),
          name: parts[2]!.trim() || "Debt",
          initialAmount: Number.isNaN(initialAmount) ? 0 : initialAmount,
          startDate: parts[4]?.trim() || undefined,
          owner: parseDebtOwner(parts[5] ?? "Ayaz"),
          recurringAmount:
            recurringAmount != null && recurringAmount > 0
              ? recurringAmount
              : undefined,
          recurringFrequency: recurringFreq,
          recurringDayOfMonth:
            recurringDay != null && recurringDay >= 1 && recurringDay <= 31
              ? recurringDay
              : undefined,
          recurringStartDate: parts[9]?.trim() || undefined,
        });
      } else if (parts[0] === "DEBT_PAYMENT" && parts.length >= 6) {
        const amount = parseFloat(parts[4]!) ?? 0;
        debtPayments.push({
          id: parts[1]!.trim(),
          debtId: parts[2]!.trim(),
          date: parts[3]!.trim(),
          amount: Number.isNaN(amount) ? 0 : amount,
          note: parts[5]?.trim() || undefined,
        });
      }
    }
    return { expenses, income, debts, debtPayments };
  }
  // No data block: fallback to parsing the human-readable table (no debts/debtPayments)
  const fallback = parseExportedPdfTableFallback(normalized);
  return {
    ...fallback,
    debts: [],
    debtPayments: [],
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

  return { expenses, income, debts: [], debtPayments: [] };
}
