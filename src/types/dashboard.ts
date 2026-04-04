import type { Expense, Debt, DebtPayment, Income, OwnerTransfer } from "@/types/core";

export type DashboardRange = "current" | "6" | "12";
export type DashboardExpenseScope = "all" | "exclude-mortgage";

export interface DashboardKpis {
  netCashFlow: number;
  totalSpent: number;
  totalIncome: number;
  debtOutstanding: number;
  debtPaidThisMonth: number;
  spentVsLastMonthPct: number | null;
}

export interface DashboardCategorySlice {
  label: string;
  value: number;
}

export interface DashboardOwnerSlice {
  key: string;
  label: string;
  value: number;
  owner?: string;
}

export interface DashboardOwnerExpenseItem {
  id: string;
  date: string;
  description: string;
  category: string;
  paidByOwner?: string;
  allocatedAmount: number;
  totalAmount: number;
}

export interface DashboardOwnerNetRow {
  owner: string;
  gross: number;
  net: number;
  sent: number;
  received: number;
}

export interface DashboardDebtRow {
  id: string;
  name: string;
  owner?: string;
  initialAmount: number;
  remaining: number;
  paid: number;
  progress: number;
}

export type DashboardRecentItem = Expense;
export type DashboardOwnerTransferItem = OwnerTransfer;

export interface DashboardCashFlowRow {
  monthKey: string;
  monthLabel: string;
  incomeTotal: number;
  expensesTotal: number;
  debtPaymentsTotal: number;
  incomeByOwner: Record<string, number>;
}

export interface DashboardParentCategorySlice {
  label: string;
  value: number;
}

export interface DashboardCategoryComparisonRow {
  label: string;
  currentValue: number;
  previousValue: number;
  changePct: number | null;
  direction: "up" | "down" | "flat";
}

export interface DashboardCategoryTrendSeries {
  category: string;
  values: number[];
}

export interface DashboardCategoryTrends {
  monthKeys: string[];
  categories: string[];
  series: DashboardCategoryTrendSeries[];
}

export interface DashboardDailyExpenseItem {
  id: string;
  description: string;
  category: string;
  amount: number;
}

export interface DashboardDailySpendingDay {
  date: string;
  amount: number;
  items: DashboardDailyExpenseItem[];
}

export interface DashboardDailySpending {
  monthKey: string;
  days: DashboardDailySpendingDay[];
  maxAmount: number;
}

export interface DashboardSelectorInput {
  currentMonthKey: string;
  range: DashboardRange;
  scope: DashboardExpenseScope;
  expenses: Expense[];
  income: Income[];
  debts: Debt[];
  debtPayments: DebtPayment[];
  owners: string[];
}

