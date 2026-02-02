import type { ChartConfig } from "./ui";
import type { MonthTotals } from "./totals";

export type SummaryBarDatum = { metric: string; value: number; fill: string };
export type SpendingPieDatum = { name: string; value: number };
export type IncomeStackedRow = { name: string; [cat: string]: string | number };

export interface DebtSummaryData {
  totalRemaining: number;
  totalPaidOff: number;
  chartData: { metric: string; value: number; fill: string }[];
  hasDebtData: boolean;
}

export type SpendingByTypeDatum = { name: string; amount: number };

/** Dashboard component props */
export interface DebtSectionProps {
  debtSummary: DebtSummaryData;
}

export interface OverviewSectionProps {
  summaryBarData: SummaryBarDatum[];
  summaryBarConfig: ChartConfig;
  spendingPieData: SpendingPieDatum[];
  incomeStackedBarData: IncomeStackedRow[];
  incomeStackedBarConfig: ChartConfig;
  incomeCategoryKeys: string[];
  t: (key: string) => string;
}

export interface SpendingByTypeSectionProps {
  fiftyFiftyByType: SpendingByTypeDatum[];
  mySpendingByType: SpendingByTypeDatum[];
  tasnuvasSpendingByType: SpendingByTypeDatum[];
  fiftyFiftyChartConfig: ChartConfig;
  mySpendingChartConfig: ChartConfig;
  tasnuvasSpendingChartConfig: ChartConfig;
  t: (key: string) => string;
}

export interface ByMonthSectionProps {
  chartData: { month: string; earned: number; spent: number }[];
  months: MonthTotals[];
  currentMonthKey: string;
}

export interface ByMonthListProps {
  months: MonthTotals[];
  currentMonthKey: string;
  t: (key: string) => string;
}

export interface MonthSelectorProps {
  value: string;
  onChange: (value: string) => void;
  options: string[];
  currentMonthKey: string;
  isCurrentMonth: boolean;
  t: (key: string, opts?: { month?: string }) => string;
}

export interface SummaryCardsProps {
  selectedMonth: MonthTotals;
}
