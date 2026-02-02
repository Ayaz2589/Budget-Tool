import type { Expense, Income } from "./core";

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
