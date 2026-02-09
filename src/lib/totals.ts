import type { Expense, Income } from "@/types/core";
import type { MonthTotals, TotalsInput } from "@/types/totals";
import { isMortgageCategory } from "@/lib/mortgageCategory";

export type { MonthTotals, TotalsInput };

import { isValidDate } from "@/lib/dateRepair";

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
  iOweNova: number,
  hysa = 0,
  investing = 0
): MonthTotals {
  const monthExpenses = expenses.filter(
    (e) => isValidDate(e.date) && getMonthKey(e.date) === monthKey
  );
  const monthIncome = income.filter(
    (i) => isValidDate(i.date) && getMonthKey(i.date) === monthKey
  );

  const totalEarned = monthIncome.reduce((s, i) => s + i.amount, 0);
  const totalSpent = monthExpenses.reduce((s, e) => s + e.amount, 0);
  const totalSpentWithoutMortgage = monthExpenses
    .filter((e) => !isMortgageCategory(e.category))
    .reduce((s, e) => s + e.amount, 0);
  const total5050Spent = monthExpenses
    .filter((e) => e.category === "50/50")
    .reduce((s, e) => s + e.amount, 0);
  const split5050 = total5050Spent / 2;
  const tasnuvasPurchase = monthExpenses
    .filter((e) => e.category === "Tasnuva's Purchases")
    .reduce((s, e) => s + e.amount, 0);
  const tasnuvasTotalSpending = tasnuvasPurchase + split5050;
  // My total spending = expenses that are mine (not Tasnuva's, not 50/50, not Mortgage) + my half of 50/50
  const myCategoriesSpent = monthExpenses
    .filter(
      (e) =>
        e.category !== "Tasnuva's Purchases" &&
        e.category !== "50/50" &&
        !isMortgageCategory(e.category)
    )
    .reduce((s, e) => s + e.amount, 0);
  const myTotalSpendingWithoutMortgage = myCategoriesSpent + split5050;

  const totalSaved = totalEarned - totalSpent;
  const personalSavingsRate =
    totalEarned > 0 ? totalSaved / totalEarned : 0;
  const investingTotal = hysa + investing;

  return {
    monthKey,
    monthLabel: getMonthLabel(monthKey),
    totalEarned,
    totalSpent,
    totalSpentWithoutMortgage,
    total5050Spent,
    split5050,
    novasPurchase: tasnuvasPurchase,
    novasTotalSpending: tasnuvasTotalSpending,
    iOweNova,
    myTotalSpendingWithoutMortgage,
    totalSaved,
    personalSavingsRate,
    hysa,
    investingSp500: investing,
    investingTotal,
  };
}

export function computeAllTotals(input: TotalsInput): MonthTotals[] {
  const { expenses, income, iOweNovaByMonth, hysaByMonth = {}, investingByMonth = {} } = input;
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
      iOweNovaByMonth[monthKey] ?? 0,
      hysaByMonth[monthKey] ?? 0,
      investingByMonth[monthKey] ?? 0
    )
  );
}

export function computeGrandTotals(months: MonthTotals[]): MonthTotals {
  return {
    monthKey: "TOTALS",
    monthLabel: "TOTALS",
    totalEarned: months.reduce((s, m) => s + m.totalEarned, 0),
    totalSpent: months.reduce((s, m) => s + m.totalSpent, 0),
    totalSpentWithoutMortgage: months.reduce(
      (s, m) => s + m.totalSpentWithoutMortgage,
      0
    ),
    total5050Spent: months.reduce((s, m) => s + m.total5050Spent, 0),
    split5050: months.reduce((s, m) => s + m.split5050, 0),
    novasPurchase: months.reduce((s, m) => s + m.novasPurchase, 0),
    novasTotalSpending: months.reduce((s, m) => s + m.novasTotalSpending, 0),
    iOweNova: months.reduce((s, m) => s + m.iOweNova, 0),
    myTotalSpendingWithoutMortgage: months.reduce(
      (s, m) => s + m.myTotalSpendingWithoutMortgage,
      0
    ),
    totalSaved: months.reduce((s, m) => s + m.totalSaved, 0),
    personalSavingsRate:
      months.reduce((s, m) => s + m.totalEarned, 0) > 0
        ? months.reduce((s, m) => s + m.totalSaved, 0) /
          months.reduce((s, m) => s + m.totalEarned, 0)
        : 0,
    hysa: months.reduce((s, m) => s + m.hysa, 0),
    investingSp500: months.reduce((s, m) => s + m.investingSp500, 0),
    investingTotal: months.reduce((s, m) => s + m.investingTotal, 0),
  };
}
