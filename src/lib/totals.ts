import type { Expense, Income } from "@/lib/types";

export interface MonthTotals {
  monthKey: string; // YYYY-MM
  monthLabel: string; // e.g. "January" or "January 2026"
  totalEarned: number;
  totalSpent: number;
  totalSpentWithoutMortgage: number;
  total5050Spent: number;
  split5050: number;
  novasPurchase: number;
  novasTotalSpending: number;
  iOweNova: number;
  myTotalSpendingWithoutMortgage: number;
  totalSaved: number;
  personalSavingsRate: number; // 0-1
  hysa: number;
  investingSp500: number;
  investingTotal: number;
}

export interface TotalsInput {
  expenses: Expense[];
  income: Income[];
  iOweNovaByMonth: Record<string, number>;
  hysaByMonth?: Record<string, number>;
  investingByMonth?: Record<string, number>;
}

function getMonthKey(date: string): string {
  return date.slice(0, 7);
}

function getMonthLabel(monthKey: string): string {
  const [y, m] = monthKey.split("-");
  const months = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December",
  ];
  const monthName = months[parseInt(m!, 10) - 1] ?? monthKey;
  return `${monthName} ${y}`;
}

export function computeMonthTotals(
  monthKey: string,
  expenses: Expense[],
  income: Income[],
  iOweNova: number,
  hysa = 0,
  investing = 0
): MonthTotals {
  const monthExpenses = expenses.filter((e) => getMonthKey(e.date) === monthKey);
  const monthIncome = income.filter((i) => getMonthKey(i.date) === monthKey);

  const totalEarned = monthIncome.reduce((s, i) => s + i.amount, 0);
  const totalSpent = monthExpenses.reduce((s, e) => s + e.amount, 0);
  const totalSpentWithoutMortgage = monthExpenses
    .filter((e) => e.category !== "Mortgage")
    .reduce((s, e) => s + e.amount, 0);
  const total5050Spent = monthExpenses
    .filter((e) => e.category === "50/50")
    .reduce((s, e) => s + e.amount, 0);
  const split5050 = total5050Spent / 2;
  const novasPurchase = monthExpenses
    .filter((e) => e.category === "Nova's Purchases")
    .reduce((s, e) => s + e.amount, 0);
  const novasTotalSpending = novasPurchase + split5050;
  // My total spending = expenses that are mine (not Nova's, not 50/50, not Mortgage) + my half of 50/50
  const myCategoriesSpent = monthExpenses
    .filter(
      (e) =>
        e.category !== "Nova's Purchases" &&
        e.category !== "50/50" &&
        e.category !== "Mortgage"
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
    novasPurchase,
    novasTotalSpending,
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
  for (const e of expenses) monthKeys.add(getMonthKey(e.date));
  for (const i of income) monthKeys.add(getMonthKey(i.date));
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
