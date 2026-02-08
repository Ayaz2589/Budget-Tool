import { formatCurrency, formatDate } from "@/lib/format";
import { isValidDate } from "@/lib/totals";
import type { DashboardInsight, DashboardInsightInput } from "@/types/dashboard";

function monthFromDate(date: string): string {
  return date.slice(0, 7);
}

function isMortgageCategory(category: string): boolean {
  return category.trim().toLowerCase() === "mortgage";
}

function expenseSumForMonth(
  monthKey: string,
  scope: DashboardInsightInput["scope"],
  expenses: DashboardInsightInput["expenses"],
): number {
  return expenses.reduce((sum, expense) => {
    if (!isValidDate(expense.date) || monthFromDate(expense.date) !== monthKey) return sum;
    if (scope === "exclude-mortgage" && isMortgageCategory(expense.category || "")) {
      return sum;
    }
    return sum + expense.amount;
  }, 0);
}

export function buildDashboardInsights(input: DashboardInsightInput): DashboardInsight[] {
  const {
    currentMonthKey,
    previousMonthKey,
    scope,
    expenses,
    income,
    debts,
    debtPayments,
  } = input;

  const insights: DashboardInsight[] = [];
  const currentSpent = expenseSumForMonth(currentMonthKey, scope, expenses);
  const previousSpent = expenseSumForMonth(previousMonthKey, scope, expenses);
  if (previousSpent > 0) {
    const pct = (currentSpent - previousSpent) / previousSpent;
    if (pct >= 0.25) {
      insights.push({
        id: `spending_spike:${currentMonthKey}`,
        type: "spending_spike",
        message: `Spending is up ${(pct * 100).toFixed(0)}% vs last month.`,
      });
    }
  }

  const currentMonthMortgage = expenses
    .filter(
      (expense) =>
        isValidDate(expense.date) &&
        monthFromDate(expense.date) === currentMonthKey &&
        isMortgageCategory(expense.category || ""),
    )
    .sort((a, b) => b.date.localeCompare(a.date));
  if (currentMonthMortgage.length > 0) {
    const latest = currentMonthMortgage[0]!;
    insights.push({
      id: `mortgage_confirmation:${latest.id}`,
      type: "mortgage_confirmation",
      message: `Mortgage paid on ${formatDate(latest.date)}.`,
    });
  }

  const dayOfMonth = new Date().getDate();
  if (dayOfMonth >= 20) {
    const paidDebtIds = new Set(
      debtPayments
        .filter((payment) => isValidDate(payment.date) && monthFromDate(payment.date) === currentMonthKey)
        .map((payment) => payment.debtId),
    );
    for (const debt of debts) {
      if (!paidDebtIds.has(debt.id)) {
        insights.push({
          id: `upcoming_debt_payment:${currentMonthKey}:${debt.id}`,
          type: "upcoming_debt_payment",
          message: `No payment logged for ${debt.name} this month.`,
        });
      }
    }
  }

  const incomeEntries = income.filter(
    (entry) => isValidDate(entry.date) && monthFromDate(entry.date) === currentMonthKey,
  );
  if (incomeEntries.length === 0) {
    insights.push({
      id: `missing_income:${currentMonthKey}`,
      type: "missing_income",
      message: "No income entry recorded this month.",
    });
  }

  return insights;
}

export function getInsightStorageKey(): string {
  return "dashboard-dismissed-insights";
}

export function serializeDismissedInsightIds(ids: string[]): string {
  return JSON.stringify(ids);
}

export function parseDismissedInsightIds(raw: string | null): string[] {
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((entry): entry is string => typeof entry === "string");
  } catch {
    return [];
  }
}

export function formatSpentDeltaLabel(pct: number | null): string {
  if (pct === null) return "—";
  const direction = pct >= 0 ? "+" : "";
  return `${direction}${(pct * 100).toFixed(1)}%`;
}

export function formatDebtPaidSubtitle(value: number): string {
  return `↓ ${formatCurrency(value)} paid this month`;
}
