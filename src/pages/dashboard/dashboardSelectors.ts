import { getDebtBalance } from "@/lib/debtUtils";
import { getMonthLabel, isValidDate } from "@/lib/totals";
import {
  isSharedExpenseByAllocation,
  normalizeExpenseAllocation,
} from "@/lib/ownerAccounting";
import {
  computeDebtBalance,
  computeDebtProgress,
  computeMonthOverMonthPct,
  computeNetCashFlow,
  computeOwnerNetFromTransfers,
  safeDivide,
  sumAmountsBy,
} from "@/lib/math";
import { isMortgageCategory } from "@/lib/mortgageCategory";
import type { Debt, DebtPayment, Expense, Income, OwnerTransfer } from "@/types/core";
import type {
  DashboardCashFlowRow,
  DashboardCategorySlice,
  DashboardCategoryTrend,
  DashboardCategoryTrendPoint,
  DashboardDebtRow,
  DashboardExpenseScope,
  DashboardKpis,
  DashboardOwnerNetRow,
  DashboardOwnerSlice,
  DashboardOwnerExpenseItem,
  DashboardQuickStats,
  DashboardRange,
  DashboardRecentItem,
  DashboardSavingsRate,
  DashboardSpendingPace,
} from "@/types/dashboard";

const SHARED_BUCKET_KEY = "_shared";
const UNASSIGNED_BUCKET_KEY = "_unassigned";

function monthFromDate(date: string): string {
  return date.slice(0, 7);
}

function isMortgage(expense: Expense): boolean {
  return isMortgageCategory(expense.category);
}

function shouldIncludeExpense(expense: Expense, scope: DashboardExpenseScope): boolean {
  if (scope === "all") return true;
  return !isMortgage(expense);
}

export function getCurrentMonthKey(): string {
  return new Date().toISOString().slice(0, 7);
}

export function getPreviousMonthKey(monthKey: string): string {
  const [y, m] = monthKey.split("-").map(Number);
  const d = new Date((y ?? 0), (m ?? 1) - 2, 1);
  return d.toISOString().slice(0, 7);
}

export function getRangeMonthKeys(range: DashboardRange, currentMonthKey: string): string[] {
  const count = range === "current" ? 1 : range === "6" ? 6 : 12;
  const [y, m] = currentMonthKey.split("-").map(Number);
  const base = new Date((y ?? 0), (m ?? 1) - 1, 1);
  const keys: string[] = [];
  for (let i = count - 1; i >= 0; i -= 1) {
    const d = new Date(base.getFullYear(), base.getMonth() - i, 1);
    keys.push(d.toISOString().slice(0, 7));
  }
  return keys;
}

function sumExpensesForMonth(
  expenses: Expense[],
  monthKey: string,
  scope: DashboardExpenseScope,
): number {
  return sumAmountsBy(expenses, (expense) => {
    if (!isValidDate(expense.date) || monthFromDate(expense.date) !== monthKey) return 0;
    if (!shouldIncludeExpense(expense, scope)) return 0;
    return expense.amount;
  });
}

function sumIncomeForMonth(income: Income[], monthKey: string): number {
  return sumAmountsBy(income, (row) => {
    if (!isValidDate(row.date) || monthFromDate(row.date) !== monthKey) return 0;
    return row.amount;
  });
}

function sumDebtPaymentsForMonth(debtPayments: DebtPayment[], monthKey: string): number {
  return sumAmountsBy(debtPayments, (row) => {
    if (!isValidDate(row.date) || monthFromDate(row.date) !== monthKey) return 0;
    return row.amount;
  });
}

export function buildDashboardKpis({
  currentMonthKey,
  expenses,
  income,
  debts,
  debtPayments,
  scope,
  includeDebtPayments = true,
}: {
  currentMonthKey: string;
  expenses: Expense[];
  income: Income[];
  debts: Debt[];
  debtPayments: DebtPayment[];
  scope: DashboardExpenseScope;
  includeDebtPayments?: boolean;
}): DashboardKpis {
  const previousMonthKey = getPreviousMonthKey(currentMonthKey);
  const currentIncome = sumIncomeForMonth(income, currentMonthKey);
  const currentExpenses = sumExpensesForMonth(expenses, currentMonthKey, scope);
  const currentDebtPayments = includeDebtPayments
    ? sumDebtPaymentsForMonth(debtPayments, currentMonthKey)
    : 0;
  const currentSpent = currentExpenses + currentDebtPayments;
  const previousExpenses = sumExpensesForMonth(expenses, previousMonthKey, scope);
  const previousDebtPayments = includeDebtPayments
    ? sumDebtPaymentsForMonth(debtPayments, previousMonthKey)
    : 0;
  const previousSpent = previousExpenses + previousDebtPayments;
  const spentVsLastMonthPct = computeMonthOverMonthPct(currentSpent, previousSpent);

  const debtOutstanding = debts.reduce(
    (sum, debt) => sum + getDebtBalance(debt, debtPayments),
    0,
  );

  return {
    netCashFlow: computeNetCashFlow(
      currentIncome,
      currentExpenses,
      currentDebtPayments,
    ),
    totalSpent: currentSpent,
    totalIncome: currentIncome,
    debtOutstanding,
    debtPaidThisMonth: currentDebtPayments,
    spentVsLastMonthPct,
  };
}

export function buildCashFlowRows({
  monthKeys,
  expenses,
  income,
  debtPayments,
  scope,
  includeDebtPayments = true,
  unassignedOwnerLabel = "Unassigned",
  locale = "en-US",
}: {
  monthKeys: string[];
  expenses: Expense[];
  income: Income[];
  debtPayments: DebtPayment[];
  scope: DashboardExpenseScope;
  includeDebtPayments?: boolean;
  unassignedOwnerLabel?: string;
  locale?: string;
}): DashboardCashFlowRow[] {
  return monthKeys.map((monthKey) => {
    const incomeByOwner: Record<string, number> = {};
    for (const row of income) {
      if (!isValidDate(row.date) || monthFromDate(row.date) !== monthKey) continue;
      const ownerKey = (row.owner || "").trim() || unassignedOwnerLabel;
      incomeByOwner[ownerKey] = (incomeByOwner[ownerKey] ?? 0) + row.amount;
    }

    return {
      monthKey,
      monthLabel: getMonthLabel(monthKey, locale),
      incomeTotal: sumIncomeForMonth(income, monthKey),
      expensesTotal: sumExpensesForMonth(expenses, monthKey, scope),
      debtPaymentsTotal: includeDebtPayments
        ? sumDebtPaymentsForMonth(debtPayments, monthKey)
        : 0,
      incomeByOwner,
    };
  });
}

export function buildCategoryBreakdown({
  expenses,
  currentMonthKey,
  scope,
  uncategorizedLabel = "Uncategorized",
}: {
  expenses: Expense[];
  currentMonthKey: string;
  scope: DashboardExpenseScope;
  uncategorizedLabel?: string;
}): DashboardCategorySlice[] {
  const byCategory = new Map<string, number>();
  for (const expense of expenses) {
    if (!isValidDate(expense.date) || monthFromDate(expense.date) !== currentMonthKey) continue;
    if (!shouldIncludeExpense(expense, scope)) continue;
    const category = (expense.category || "").trim() || uncategorizedLabel;
    byCategory.set(category, (byCategory.get(category) ?? 0) + expense.amount);
  }

  return Array.from(byCategory.entries())
    .map(([label, value]) => ({ label, value }))
    .sort((a, b) => b.value - a.value);
}

export function buildSpendBySource({
  expenses,
  monthKeys,
  scope,
}: {
  expenses: Expense[];
  monthKeys: string[];
  scope: DashboardExpenseScope;
}): { source: Expense["source"]; value: number }[] {
  const allowedMonthKeys = new Set(monthKeys);
  const bySource = new Map<Expense["source"], number>();

  for (const expense of expenses) {
    if (!isValidDate(expense.date)) continue;
    if (!allowedMonthKeys.has(monthFromDate(expense.date))) continue;
    if (!shouldIncludeExpense(expense, scope)) continue;
    bySource.set(expense.source, (bySource.get(expense.source) ?? 0) + expense.amount);
  }

  return Array.from(bySource.entries())
    .map(([source, value]) => ({ source, value }))
    .sort((a, b) => b.value - a.value);
}

export function buildOwnerSplit({
  expenses,
  currentMonthKey,
  monthKeys,
  scope,
  owners,
  sharedLabel = "Shared",
  unassignedLabel = "Unassigned",
}: {
  expenses: Expense[];
  currentMonthKey: string;
  monthKeys?: string[];
  scope: DashboardExpenseScope;
  owners: string[];
  sharedLabel?: string;
  unassignedLabel?: string;
}): DashboardOwnerSlice[] {
  const allowedMonthKeys =
    monthKeys && monthKeys.length > 0 ? new Set(monthKeys) : null;
  const ownerValues = new Map<string, number>();
  let shared = 0;
  let unassigned = 0;

  for (const expense of expenses) {
    if (!isValidDate(expense.date)) continue;
    const monthKey = monthFromDate(expense.date);
    if (allowedMonthKeys) {
      if (!allowedMonthKeys.has(monthKey)) continue;
    } else if (monthKey !== currentMonthKey) {
      continue;
    }
    if (!shouldIncludeExpense(expense, scope)) continue;
    const allocation = normalizeExpenseAllocation(expense, owners);
    if (isSharedExpenseByAllocation(allocation)) {
      shared += expense.amount;
    }
    for (const item of allocation) {
      if (item.isUnassigned) {
        unassigned += item.amount;
        shared += item.amount;
        continue;
      }
      ownerValues.set(item.owner, (ownerValues.get(item.owner) ?? 0) + item.amount);
    }
  }

  const rows: DashboardOwnerSlice[] = [];
  if (shared > 0) {
    rows.push({ key: SHARED_BUCKET_KEY, label: sharedLabel, value: shared });
  }
  for (const [owner, value] of ownerValues) {
    rows.push({ key: owner, label: owner, owner, value });
  }
  if (unassigned > 0) {
    rows.push({
      key: UNASSIGNED_BUCKET_KEY,
      label: unassignedLabel,
      value: unassigned,
    });
  }

  return rows.sort((a, b) => b.value - a.value);
}

export function buildOwnerExpenseItems({
  expenses,
  currentMonthKey,
  monthKeys,
  scope,
  owners,
  owner,
}: {
  expenses: Expense[];
  currentMonthKey: string;
  monthKeys?: string[];
  scope: DashboardExpenseScope;
  owners: string[];
  owner: string;
}): DashboardOwnerExpenseItem[] {
  const allowedMonthKeys =
    monthKeys && monthKeys.length > 0 ? new Set(monthKeys) : null;
  const items: DashboardOwnerExpenseItem[] = [];
  for (const expense of expenses) {
    if (!isValidDate(expense.date)) continue;
    const monthKey = monthFromDate(expense.date);
    if (allowedMonthKeys) {
      if (!allowedMonthKeys.has(monthKey)) continue;
    } else if (monthKey !== currentMonthKey) {
      continue;
    }
    if (!shouldIncludeExpense(expense, scope)) continue;
    const allocation = normalizeExpenseAllocation(expense, owners);
    const allocatedAmount = allocation
      .filter((entry) => !entry.isUnassigned && entry.owner === owner)
      .reduce((sum, entry) => sum + entry.amount, 0);
    if (allocatedAmount <= 0) continue;
    items.push({
      id: expense.id,
      date: expense.date,
      description: expense.description,
      category: expense.category,
      paidByOwner: expense.paidByOwner ?? expense.owner,
      allocatedAmount,
      totalAmount: expense.amount,
    });
  }

  return items.sort((a, b) => {
    const byDate = b.date.localeCompare(a.date);
    if (byDate !== 0) return byDate;
    return b.allocatedAmount - a.allocatedAmount;
  });
}

export function buildDebtSnapshot({
  debts,
  debtPayments,
}: {
  debts: { id: string; name: string; owner?: string; initialAmount: number }[];
  debtPayments: DebtPayment[];
}): DashboardDebtRow[] {
  return debts
    .map((debt) => {
      const remaining = getDebtBalance(debt, debtPayments);
      const paid = computeDebtBalance(debt.initialAmount, remaining);
      return {
        id: debt.id,
        name: debt.name,
        owner: debt.owner,
        initialAmount: debt.initialAmount,
        remaining,
        paid,
        progress: computeDebtProgress(debt.initialAmount, remaining),
      };
    })
    .sort((a, b) => b.remaining - a.remaining);
}

export function buildFixedObligations({
  expenses,
  debtPayments,
  currentMonthKey,
}: {
  expenses: Expense[];
  debtPayments: DebtPayment[];
  currentMonthKey: string;
}): number {
  const expensePart = expenses.reduce((sum, expense) => {
    if (!isValidDate(expense.date) || monthFromDate(expense.date) !== currentMonthKey) return sum;
    const category = (expense.category || "").trim().toLowerCase();
    if (category === "mortgage" || category === "utilities") {
      return sum + expense.amount;
    }
    return sum;
  }, 0);
  const debtPart = sumDebtPaymentsForMonth(debtPayments, currentMonthKey);
  return expensePart + debtPart;
}

export function buildRecentActivity(expenses: Expense[]): DashboardRecentItem[] {
  return [...expenses]
    .filter((expense) => isValidDate(expense.date))
    .sort((a, b) => b.date.localeCompare(a.date))
    .slice(0, 5);
}

export function buildOwnerTransfersMtd({
  ownerTransfers,
  currentMonthKey,
  limit = 5,
}: {
  ownerTransfers: { id: string; date: string; fromOwner: string; toOwner: string; amount: number; note?: string }[];
  currentMonthKey: string;
  limit?: number;
}) {
  return [...ownerTransfers]
    .filter((row) => isValidDate(row.date) && monthFromDate(row.date) === currentMonthKey)
    .sort((a, b) => b.date.localeCompare(a.date))
    .slice(0, limit);
}

export function sumCashFlowExpenseTotals(rows: DashboardCashFlowRow[]): number {
  return sumAmountsBy(rows, (row) => row.expensesTotal);
}

export function buildOwnerNetRows({
  ownerExpenseRows,
  ownerTransfers,
  monthKeys,
}: {
  ownerExpenseRows: DashboardOwnerSlice[];
  ownerTransfers: OwnerTransfer[];
  monthKeys: string[];
}): DashboardOwnerNetRow[] {
  const monthKeySet = new Set(monthKeys);
  const grossByOwner = new Map<string, number>();
  ownerExpenseRows.forEach((row) => {
    if (!row.owner) return;
    grossByOwner.set(row.owner, row.value);
  });

  const sentByOwner = new Map<string, number>();
  const receivedByOwner = new Map<string, number>();
  ownerTransfers.forEach((row) => {
    if (!monthKeySet.has(row.date.slice(0, 7))) return;
    sentByOwner.set(row.fromOwner, (sentByOwner.get(row.fromOwner) ?? 0) + row.amount);
    receivedByOwner.set(row.toOwner, (receivedByOwner.get(row.toOwner) ?? 0) + row.amount);
  });

  const ownersWithValues = new Set<string>([
    ...grossByOwner.keys(),
    ...sentByOwner.keys(),
    ...receivedByOwner.keys(),
  ]);

  return Array.from(ownersWithValues)
    .map((owner) => {
      const gross = grossByOwner.get(owner) ?? 0;
      const sent = sentByOwner.get(owner) ?? 0;
      const received = receivedByOwner.get(owner) ?? 0;
      return {
        owner,
        gross,
        net: computeOwnerNetFromTransfers(gross, received, sent),
        sent,
        received,
      };
    })
    .sort((a, b) => b.gross - a.gross);
}

export function getOwnerDrilldownParam(slice: DashboardOwnerSlice): string {
  if (slice.owner) return slice.owner;
  return slice.key === SHARED_BUCKET_KEY ? "_shared" : "_none";
}

export function buildSpendingPace({
  currentMonthKey,
  expenses,
  debtPayments,
  scope,
  includeDebtPayments = true,
}: {
  currentMonthKey: string;
  expenses: Expense[];
  debtPayments: DebtPayment[];
  scope: DashboardExpenseScope;
  includeDebtPayments?: boolean;
}): DashboardSpendingPace {
  const [y, m] = currentMonthKey.split("-").map(Number);
  const daysInMonth = new Date(y ?? 0, m ?? 0, 0).getDate();

  const now = new Date();
  const isCurrentMonth =
    now.getFullYear() === (y ?? 0) && now.getMonth() + 1 === (m ?? 0);
  const dayOfMonth = isCurrentMonth ? now.getDate() : daysInMonth;

  const currentExpenses = sumExpensesForMonth(expenses, currentMonthKey, scope);
  const currentDebt = includeDebtPayments
    ? sumDebtPaymentsForMonth(debtPayments, currentMonthKey)
    : 0;
  const totalSpent = currentExpenses + currentDebt;

  const dailyAverage = safeDivide(totalSpent, dayOfMonth, 0);
  const projectedTotal = dailyAverage * daysInMonth;

  const previousMonthKey = getPreviousMonthKey(currentMonthKey);
  const prevExpenses = sumExpensesForMonth(expenses, previousMonthKey, scope);
  const prevDebt = includeDebtPayments
    ? sumDebtPaymentsForMonth(debtPayments, previousMonthKey)
    : 0;
  const lastMonthTotal = prevExpenses + prevDebt;

  const paceVsLastMonth =
    lastMonthTotal > 0 ? projectedTotal - lastMonthTotal : null;

  return {
    dayOfMonth,
    daysInMonth,
    dailyAverage,
    projectedTotal,
    lastMonthTotal,
    paceVsLastMonth,
  };
}

export function buildSavingsRate({
  totalIncome,
  totalSpent,
}: {
  totalIncome: number;
  totalSpent: number;
}): DashboardSavingsRate {
  const amountSaved = totalIncome - totalSpent;
  const savingsRate = safeDivide(amountSaved, totalIncome, 0);
  return { savingsRate, amountSaved, totalIncome, totalSpent };
}

export function buildCategoryTrends({
  expenses,
  currentMonthKey,
  scope,
  uncategorizedLabel = "Uncategorized",
  locale = "en-US",
}: {
  expenses: Expense[];
  currentMonthKey: string;
  scope: DashboardExpenseScope;
  uncategorizedLabel?: string;
  locale?: string;
}): DashboardCategoryTrend[] {
  const topSlices = buildCategoryBreakdown({
    expenses,
    currentMonthKey,
    scope,
    uncategorizedLabel,
  }).slice(0, 4);

  if (topSlices.length === 0) return [];

  const trendMonthKeys = getRangeMonthKeys("6", currentMonthKey);
  const topCategoryNames = new Set(topSlices.map((s) => s.label));

  const byCategoryMonth = new Map<string, Map<string, number>>();
  for (const name of topCategoryNames) {
    byCategoryMonth.set(name, new Map());
  }

  for (const expense of expenses) {
    if (!isValidDate(expense.date)) continue;
    const mk = monthFromDate(expense.date);
    if (!trendMonthKeys.includes(mk)) continue;
    if (!shouldIncludeExpense(expense, scope)) continue;
    const category =
      (expense.category || "").trim() || uncategorizedLabel;
    const monthMap = byCategoryMonth.get(category);
    if (!monthMap) continue;
    monthMap.set(mk, (monthMap.get(mk) ?? 0) + expense.amount);
  }

  return topSlices.map((slice) => {
    const monthMap = byCategoryMonth.get(slice.label)!;
    const points: DashboardCategoryTrendPoint[] = trendMonthKeys.map(
      (mk) => ({
        monthKey: mk,
        monthLabel: getMonthLabel(mk, locale),
        amount: monthMap.get(mk) ?? 0,
      }),
    );
    return {
      category: slice.label,
      currentAmount: slice.value,
      points,
    };
  });
}

export function buildQuickStats({
  expenses,
  debtPayments,
  currentMonthKey,
  scope,
}: {
  expenses: Expense[];
  debtPayments: DebtPayment[];
  currentMonthKey: string;
  scope: DashboardExpenseScope;
}): DashboardQuickStats {
  const fixedObligations = buildFixedObligations({
    expenses,
    debtPayments,
    currentMonthKey,
  });

  let largestExpense: DashboardQuickStats["largestExpense"] = null;
  let transactionCount = 0;
  for (const expense of expenses) {
    if (!isValidDate(expense.date) || monthFromDate(expense.date) !== currentMonthKey) continue;
    if (!shouldIncludeExpense(expense, scope)) continue;
    transactionCount += 1;
    if (!largestExpense || expense.amount > largestExpense.amount) {
      largestExpense = {
        description: expense.description || "\u2014",
        amount: expense.amount,
        category: expense.category || "",
      };
    }
  }

  return { fixedObligations, largestExpense, transactionCount };
}
