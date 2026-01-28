import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import type { Expense, Income, ExpenseSource } from "@/lib/types";
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
  income: Income[]
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
    const monthExpenses = (expenseByMonth.get(monthKey) ?? []).sort((a, b) =>
      b.date.localeCompare(a.date)
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

    // Expenses table
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

    // Income table
    if (monthIncome.length > 0) {
      if (y > 260) {
        doc.addPage();
        y = 20;
      }
      const incomeHead = ["Date", "Description", "Amount", "Category"];
      const incomeBody = monthIncome.map((i) => [
        i.date,
        (i.description || "Income").slice(0, 50) +
          ((i.description || "").length > 50 ? "…" : ""),
        formatCurrency(i.amount),
        i.category || "—",
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

  const filename = `transactions-income-${new Date().toISOString().slice(0, 10)}.pdf`;
  doc.save(filename);
}
