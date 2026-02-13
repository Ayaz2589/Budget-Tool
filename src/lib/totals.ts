import type { Expense, Income } from "@/types/core";
import type { MonthTotals, TotalsInput } from "@/types/totals";
import { isMortgageCategory } from "@/lib/mortgageCategory";
import { safeDivide, sumAmountsBy } from "@/lib/math";

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

  const totalEarned = sumAmountsBy(monthIncome, (row) => row.amount);
  const totalSpent = sumAmountsBy(monthExpenses, (row) => row.amount);
  const totalSpentWithoutMortgage = monthExpenses
    .filter((e) => !isMortgageCategory(e.category))
    .reduce((sum, row) => sum + row.amount, 0);
  const total5050Spent = monthExpenses
    .filter((e) => e.category === "50/50")
    .reduce((sum, row) => sum + row.amount, 0);
  const split5050 = total5050Spent / 2;
  const tasnuvasPurchase = monthExpenses
    .filter((e) => e.category === "Tasnuva's Purchases")
    .reduce((sum, row) => sum + row.amount, 0);
  const tasnuvasTotalSpending = tasnuvasPurchase + split5050;
  // My total spending = expenses that are mine (not Tasnuva's, not 50/50, not Mortgage) + my half of 50/50
  const myCategoriesSpent = monthExpenses
    .filter(
      (e) =>
        e.category !== "Tasnuva's Purchases" &&
        e.category !== "50/50" &&
        !isMortgageCategory(e.category)
    )
    .reduce((sum, row) => sum + row.amount, 0);
  const myTotalSpendingWithoutMortgage = myCategoriesSpent + split5050;

  const totalSaved = totalEarned - totalSpent;
  const personalSavingsRate = safeDivide(totalSaved, totalEarned, 0);
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
  const totalEarned = sumAmountsBy(months, (month) => month.totalEarned);
  const totalSaved = sumAmountsBy(months, (month) => month.totalSaved);
  return {
    monthKey: "TOTALS",
    monthLabel: "TOTALS",
    totalEarned,
    totalSpent: sumAmountsBy(months, (month) => month.totalSpent),
    totalSpentWithoutMortgage: sumAmountsBy(months, (month) => month.totalSpentWithoutMortgage),
    total5050Spent: sumAmountsBy(months, (month) => month.total5050Spent),
    split5050: sumAmountsBy(months, (month) => month.split5050),
    novasPurchase: sumAmountsBy(months, (month) => month.novasPurchase),
    novasTotalSpending: sumAmountsBy(months, (month) => month.novasTotalSpending),
    iOweNova: sumAmountsBy(months, (month) => month.iOweNova),
    myTotalSpendingWithoutMortgage: sumAmountsBy(
      months,
      (month) => month.myTotalSpendingWithoutMortgage,
    ),
    totalSaved,
    personalSavingsRate: safeDivide(totalSaved, totalEarned, 0),
    hysa: sumAmountsBy(months, (month) => month.hysa),
    investingSp500: sumAmountsBy(months, (month) => month.investingSp500),
    investingTotal: sumAmountsBy(months, (month) => month.investingTotal),
  };
}
