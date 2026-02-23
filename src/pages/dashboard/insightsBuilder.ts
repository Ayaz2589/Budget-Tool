import { formatCurrency, formatDate } from "@/lib/format";
import { isValidDate } from "@/lib/domain/totals";
import { computeMonthOverMonthPct, sumAmountsBy } from "@/lib/math";
import { isMortgageCategory } from "@/lib/domain/mortgageCategory";
import type { DashboardInsight, DashboardInsightInput } from "@/types/dashboard";

function monthFromDate(date: string): string {
  return date.slice(0, 7);
}

function expenseSumForMonth(
  monthKey: string,
  scope: DashboardInsightInput["scope"],
  expenses: DashboardInsightInput["expenses"],
): number {
  return sumAmountsBy(expenses, (expense) => {
    if (!isValidDate(expense.date) || monthFromDate(expense.date) !== monthKey) return 0;
    if (scope === "exclude-mortgage" && isMortgageCategory(expense.category || "")) {
      return 0;
    }
    return expense.amount;
  });
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
  const pct = computeMonthOverMonthPct(currentSpent, previousSpent);
  if (pct != null && pct >= 0.25) {
    insights.push({
      id: `spending_spike:${currentMonthKey}`,
      type: "spending_spike",
      messageKey: "dashboard.insightSpendingSpike",
      messageValues: {
        percent: `${(pct * 100).toFixed(0)}%`,
      },
    });
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
      messageKey: "dashboard.insightMortgagePaidOn",
      messageValues: {
        date: formatDate(latest.date),
      },
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
          messageKey: "dashboard.insightNoDebtPaymentThisMonth",
          messageValues: {
            name: debt.name,
          },
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
      messageKey: "dashboard.insightNoIncomeThisMonth",
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

export function formatDebtPaidSubtitle(
  value: number,
  translate: (key: string, values?: Record<string, string | number>) => string,
): string {
  return translate("dashboard.debtPaidThisMonth", { amount: formatCurrency(value) });
}
