import type { Expense, Income } from "@/types/core";
import type { MonthTotals, TotalsInput } from "@/types/totals";
import { isMortgageCategory } from "./mortgageCategory";
import { safeDivide, sumAmountsBy } from "@/lib/math";
import {
  normalizeExpenseAllocation,
  isSharedExpenseByAllocation,
} from "./ownerAccounting";

export type { MonthTotals, TotalsInput };

import { isValidDate } from "./dateRepair";

export { isValidDate };

function getMonthKey(date: string): string {
  if (!isValidDate(date)) return "";
  return date.slice(0, 7);
}

export function getMonthLabel(monthKey: string, locale = "en-US"): string {
  const [y, m] = monthKey.split("-").map(Number);
  if (!Number.isFinite(y) || !Number.isFinite(m)) return monthKey;
  const date = new Date(Date.UTC(y, m - 1, 1));
  try {
    return new Intl.DateTimeFormat(locale, {
      month: "long",
      year: "numeric",
      timeZone: "UTC",
    }).format(date);
  } catch {
    return monthKey;
  }
}

export function computeMonthTotals(
  monthKey: string,
  expenses: Expense[],
  income: Income[],
  ownerBalances: Record<string, number>,
  owners: string[],
  hysa = 0,
  investing = 0
): MonthTotals {
  const monthExpenses = expenses.filter(
    (e) => isValidDate(e.date) && getMonthKey(e.date) === monthKey
  );
  const monthIncome = income.filter(
    (i) => isValidDate(i.date) && getMonthKey(i.date) === monthKey
  );

  const totalEarned = sumAmountsBy(monthIncome, (row) => row.amount);
  const totalSpent = sumAmountsBy(monthExpenses, (row) => row.amount);
  const totalSpentWithoutMortgage = monthExpenses
    .filter((e) => !isMortgageCategory(e.category))
    .reduce((sum, row) => sum + row.amount, 0);

  // Compute allocation-based spending metrics
  let sharedSpent = 0;
  const sharedSplit: Record<string, number> = {};
  const ownerSpending: Record<string, number> = {};

  // Initialize owners
  for (const owner of owners) {
    sharedSplit[owner] = 0;
    ownerSpending[owner] = 0;
  }

  for (const expense of monthExpenses) {
    if (isMortgageCategory(expense.category)) continue;

    const allocation = normalizeExpenseAllocation(expense, owners);
    const isShared = isSharedExpenseByAllocation(allocation);

    if (isShared) {
      sharedSpent += expense.amount;
    }

    for (const entry of allocation) {
      if (entry.isUnassigned) continue;
      if (isShared) {
        sharedSplit[entry.owner] = (sharedSplit[entry.owner] ?? 0) + entry.amount;
      }
      ownerSpending[entry.owner] = (ownerSpending[entry.owner] ?? 0) + entry.amount;
    }
  }

  const totalSaved = totalEarned - totalSpent;
  const personalSavingsRate = safeDivide(totalSaved, totalEarned, 0);
  const investingTotal = hysa + investing;

  return {
    monthKey,
    monthLabel: getMonthLabel(monthKey),
    totalEarned,
    totalSpent,
    totalSpentWithoutMortgage,
    sharedSpent,
    sharedSplit,
    ownerSpending,
    ownerBalances,
    totalSaved,
    personalSavingsRate,
    hysa,
    investingSp500: investing,
    investingTotal,
  };
}

export function computeAllTotals(input: TotalsInput): MonthTotals[] {
  const {
    expenses,
    income,
    ownerBalancesByMonth,
    owners,
    hysaByMonth = {},
    investingByMonth = {},
  } = input;
  const monthKeys = new Set<string>();
  for (const e of expenses) {
    const key = getMonthKey(e.date);
    if (key) monthKeys.add(key);
  }
  for (const i of income) {
    const key = getMonthKey(i.date);
    if (key) monthKeys.add(key);
  }
  const sorted = Array.from(monthKeys).sort().reverse();

  return sorted.map((monthKey) =>
    computeMonthTotals(
      monthKey,
      expenses,
      income,
      ownerBalancesByMonth[monthKey] ?? {},
      owners,
      hysaByMonth[monthKey] ?? 0,
      investingByMonth[monthKey] ?? 0
    )
  );
}

function sumRecords(records: Record<string, number>[]): Record<string, number> {
  const result: Record<string, number> = {};
  for (const record of records) {
    if (!record) continue;
    for (const [key, value] of Object.entries(record)) {
      result[key] = (result[key] ?? 0) + value;
    }
  }
  return result;
}

export function computeGrandTotals(months: MonthTotals[]): MonthTotals {
  const totalEarned = sumAmountsBy(months, (month) => month.totalEarned);
  const totalSaved = sumAmountsBy(months, (month) => month.totalSaved);
  return {
    monthKey: "TOTALS",
    monthLabel: "TOTALS",
    totalEarned,
    totalSpent: sumAmountsBy(months, (month) => month.totalSpent),
    totalSpentWithoutMortgage: sumAmountsBy(months, (month) => month.totalSpentWithoutMortgage),
    sharedSpent: sumAmountsBy(months, (month) => month.sharedSpent),
    sharedSplit: sumRecords(months.map((m) => m.sharedSplit)),
    ownerSpending: sumRecords(months.map((m) => m.ownerSpending)),
    ownerBalances: sumRecords(months.map((m) => m.ownerBalances)),
    totalSaved,
    personalSavingsRate: safeDivide(totalSaved, totalEarned, 0),
    hysa: sumAmountsBy(months, (month) => month.hysa),
    investingSp500: sumAmountsBy(months, (month) => month.investingSp500),
    investingTotal: sumAmountsBy(months, (month) => month.investingTotal),
  };
}
