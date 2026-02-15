import type { Expense, Income } from "./core";

export interface MonthTotals {
  monthKey: string; // YYYY-MM
  monthLabel: string; // e.g. "January" or "January 2026"
  totalEarned: number;
  totalSpent: number;
  totalSpentWithoutMortgage: number;
  sharedSpent: number; // total of expenses shared among multiple owners
  sharedSplit: Record<string, number>; // per-owner share of shared expenses
  ownerSpending: Record<string, number>; // per-owner total non-mortgage spending
  ownerBalances: Record<string, number>; // per-owner balance (from ownerBalancesByMonth)
  totalSaved: number;
  personalSavingsRate: number; // 0-1
  hysa: number;
  investingSp500: number;
  investingTotal: number;
}

export interface TotalsInput {
  expenses: Expense[];
  income: Income[];
  ownerBalancesByMonth: Record<string, Record<string, number>>;
  owners: string[];
  hysaByMonth?: Record<string, number>;
  investingByMonth?: Record<string, number>;
}
