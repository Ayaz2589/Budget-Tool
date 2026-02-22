import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { useLocation } from "react-router-dom";
import { useBudget } from "@/context";
import { usePresetTransactions } from "@/context";
import { computeNetCashFlow, sumAmountsBy } from "@/lib/math";
import { isValidDate } from "@/lib/totals";
import {
  collectFinancialOwners,
  scopeFinancialData,
  type FinancialViewMode,
} from "@/lib/financialModel";
import {
  buildCashFlowRows,
  buildCategoryBreakdown,
  buildDashboardKpis,
  buildDebtSnapshot,
  buildOwnerExpenseItems,
  buildOwnerNetRows,
  buildOwnerSplit,
  sumCashFlowExpenseTotals,
  buildSpendBySource,
  buildOwnerTransfersMtd,
  buildRecentActivity,
  getCurrentMonthKey,
  getPreviousMonthKey,
  getRangeMonthKeys,
} from "@/pages/dashboard/dashboardSelectors";
import {
  buildDashboardInsights,
  getInsightStorageKey,
  parseDismissedInsightIds,
  serializeDismissedInsightIds,
} from "@/pages/dashboard/insightsBuilder";
import type { DashboardExpenseScope, DashboardRange } from "@/types/dashboard";

function formatMonthKeyNumeric(monthKey: string): string {
  const [year, month] = monthKey.split("-");
  if (!year || !month) return monthKey;
  return `${month}/${year}`;
}

function formatMonthKeyForAxis(monthKey: string, range: DashboardRange): string {
  const [, month] = monthKey.split("-");
  if (!month) return monthKey;
  return range === "12" ? month : formatMonthKeyNumeric(monthKey);
}

export function useDashboardData() {
  const { t, i18n } = useTranslation();
  const location = useLocation();
  const { expenses, income, debts, debtPayments, owners, ownerTransfers } = useBudget();
  const { presetTransactions } = usePresetTransactions();

  const [range, setRange] = useState<DashboardRange>("current");
  const [selectedMonthKey, setSelectedMonthKey] = useState(getCurrentMonthKey());
  const [expenseScope, setExpenseScope] = useState<DashboardExpenseScope>("all");
  const [includeDebtPayments, setIncludeDebtPayments] = useState(true);
  const [viewMode, setViewMode] = useState<FinancialViewMode>("household");
  const [selectedOwner, setSelectedOwner] = useState("");
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [dismissedInsightIds, setDismissedInsightIds] = useState<string[]>(() =>
    parseDismissedInsightIds(sessionStorage.getItem(getInsightStorageKey())),
  );

  const ownerOptions = useMemo(
    () =>
      collectFinancialOwners({
        owners,
        expenses,
        income,
        debts,
        ownerTransfers,
      }),
    [owners, expenses, income, debts, ownerTransfers],
  );

  useEffect(() => {
    if (!ownerOptions.length) return;
    if (!selectedOwner || !ownerOptions.includes(selectedOwner)) {
      setSelectedOwner(ownerOptions[0]!);
    }
  }, [ownerOptions, selectedOwner]);

  const scopedFinancialData = useMemo(
    () =>
      scopeFinancialData({
        viewMode,
        selectedOwner,
        owners,
        expenses,
        income,
        debts,
        debtPayments,
        ownerTransfers,
      }),
    [viewMode, selectedOwner, owners, expenses, income, debts, debtPayments, ownerTransfers],
  );
  const scopedExpenses = scopedFinancialData.expenses;
  const scopedIncome = scopedFinancialData.income;
  const scopedDebts = scopedFinancialData.debts;
  const scopedDebtPayments = scopedFinancialData.debtPayments;
  const scopedOwnerTransfers = scopedFinancialData.ownerTransfers;

  const availableMonthKeys = useMemo(() => {
    const keys = new Set<string>();
    keys.add(getCurrentMonthKey());
    scopedExpenses.forEach((row) => {
      if (isValidDate(row.date)) keys.add(row.date.slice(0, 7));
    });
    scopedIncome.forEach((row) => {
      if (isValidDate(row.date)) keys.add(row.date.slice(0, 7));
    });
    scopedDebtPayments.forEach((row) => {
      if (isValidDate(row.date)) keys.add(row.date.slice(0, 7));
    });
    scopedOwnerTransfers.forEach((row) => {
      if (isValidDate(row.date)) keys.add(row.date.slice(0, 7));
    });
    return Array.from(keys).sort((a, b) => b.localeCompare(a));
  }, [scopedExpenses, scopedIncome, scopedDebtPayments, scopedOwnerTransfers]);

  useEffect(() => {
    if (availableMonthKeys.includes(selectedMonthKey)) return;
    setSelectedMonthKey(availableMonthKeys[0] ?? getCurrentMonthKey());
  }, [availableMonthKeys, selectedMonthKey]);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    setSettingsOpen(params.get("tourSheet") === "dashboard-settings");
  }, [location.search]);

  const currentMonthKey = selectedMonthKey;
  const previousMonthKey = getPreviousMonthKey(currentMonthKey);
  const monthKeys = useMemo(
    () => getRangeMonthKeys(range, currentMonthKey),
    [range, currentMonthKey],
  );

  const kpis = useMemo(
    () =>
      buildDashboardKpis({
        currentMonthKey,
        expenses: scopedExpenses,
        income: scopedIncome,
        debts: scopedDebts,
        debtPayments: scopedDebtPayments,
        scope: expenseScope,
        includeDebtPayments,
      }),
    [currentMonthKey, scopedExpenses, scopedIncome, scopedDebts, scopedDebtPayments, expenseScope, includeDebtPayments],
  );

  const cashFlowRows = useMemo(
    () =>
      buildCashFlowRows({
        monthKeys,
        expenses: scopedExpenses,
        income: scopedIncome,
        debtPayments: scopedDebtPayments,
        scope: expenseScope,
        includeDebtPayments,
        unassignedOwnerLabel: t("dashboard.unassigned"),
        locale: i18n.resolvedLanguage || i18n.language,
      }),
    [monthKeys, scopedExpenses, scopedIncome, scopedDebtPayments, expenseScope, includeDebtPayments, t, i18n.language, i18n.resolvedLanguage],
  );

  const categorySlices = useMemo(
    () =>
      buildCategoryBreakdown({
        expenses: scopedExpenses,
        currentMonthKey,
        scope: expenseScope,
        uncategorizedLabel: t("common.uncategorized"),
      }),
    [scopedExpenses, currentMonthKey, expenseScope, t],
  );

  const ownerSlices = useMemo(
    () =>
      buildOwnerSplit({
        expenses: scopedExpenses,
        currentMonthKey,
        monthKeys,
        scope: expenseScope,
        owners,
        sharedLabel: t("dashboard.shared"),
        unassignedLabel: t("dashboard.unassigned"),
      }),
    [scopedExpenses, currentMonthKey, monthKeys, expenseScope, owners, t],
  );
  const ownerExpenseRows = useMemo(
    () => ownerSlices.filter((slice) => Boolean(slice.owner)),
    [ownerSlices],
  );
  const percentFormatter = useMemo(
    () =>
      new Intl.NumberFormat(i18n.resolvedLanguage || i18n.language || "en-US", {
        style: "percent",
        maximumFractionDigits: 1,
      }),
    [i18n.language, i18n.resolvedLanguage],
  );
  const ownerExpenseItemsByOwner = useMemo(() => {
    const map = new Map<string, ReturnType<typeof buildOwnerExpenseItems>>();
    for (const row of ownerExpenseRows) {
      if (!row.owner) continue;
      map.set(
        row.owner,
        buildOwnerExpenseItems({
          expenses: scopedExpenses,
          currentMonthKey,
          monthKeys,
          scope: expenseScope,
          owners,
          owner: row.owner,
        }),
      );
    }
    return map;
  }, [ownerExpenseRows, scopedExpenses, currentMonthKey, monthKeys, expenseScope, owners]);
  const totalSpentForSelectedRange = useMemo(
    () => sumCashFlowExpenseTotals(cashFlowRows),
    [cashFlowRows],
  );
  const ownerNetRows = useMemo(() => {
    return buildOwnerNetRows({
      ownerExpenseRows,
      ownerTransfers: scopedOwnerTransfers,
      monthKeys,
    });
  }, [ownerExpenseRows, scopedOwnerTransfers, monthKeys]);
  const visibleOwnerNetRows = useMemo(() => {
    if (viewMode === "household") return ownerNetRows;
    return ownerNetRows.filter((row) => row.owner === selectedOwner);
  }, [viewMode, ownerNetRows, selectedOwner]);

  const debtRows = useMemo(
    () => buildDebtSnapshot({ debts: scopedDebts, debtPayments: scopedDebtPayments }),
    [scopedDebts, scopedDebtPayments],
  );

  const ownerTransfersMtd = useMemo(
    () =>
      buildOwnerTransfersMtd({
        ownerTransfers: scopedOwnerTransfers,
        currentMonthKey,
        limit: 5,
      }),
    [scopedOwnerTransfers, currentMonthKey],
  );
  const ownerTransfersMtdTotal = useMemo(
    () => sumAmountsBy(ownerTransfersMtd, (row) => row.amount),
    [ownerTransfersMtd],
  );

  const recentActivity = useMemo(() => buildRecentActivity(scopedExpenses), [scopedExpenses]);
  const spendBySourceRows = useMemo(
    () =>
      buildSpendBySource({
        expenses: scopedExpenses,
        monthKeys,
        scope: expenseScope,
      }),
    [scopedExpenses, monthKeys, expenseScope],
  );

  const insights = useMemo(
    () =>
      buildDashboardInsights({
        currentMonthKey,
        previousMonthKey,
        scope: expenseScope,
        expenses: scopedExpenses,
        income: scopedIncome,
        debts: scopedDebts,
        debtPayments: scopedDebtPayments,
        presetTransactions,
      }).filter((insight) => !dismissedInsightIds.includes(insight.id)),
    [currentMonthKey, previousMonthKey, expenseScope, scopedExpenses, scopedIncome, scopedDebts, scopedDebtPayments, presetTransactions, dismissedInsightIds],
  );

  const incomeOwnerKeys = useMemo(() => {
    const keys = new Set<string>();
    for (const row of cashFlowRows) {
      Object.keys(row.incomeByOwner).forEach((key) => keys.add(key));
    }
    return Array.from(keys).sort((a, b) => a.localeCompare(b));
  }, [cashFlowRows]);

  const cashFlowDisplayRows = useMemo(
    () =>
      cashFlowRows.map((row) => ({
        ...row,
        monthLabel: formatMonthKeyNumeric(row.monthKey),
        monthAxisLabel: formatMonthKeyForAxis(row.monthKey, range),
      })),
    [cashFlowRows, range],
  );

  const netCashFlowRows = useMemo(
    () =>
      cashFlowDisplayRows.map((row) => ({
        monthKey: row.monthKey,
        monthLabel: row.monthLabel,
        monthAxisLabel: row.monthAxisLabel,
        netCashFlow: computeNetCashFlow(
          row.incomeTotal,
          row.expensesTotal,
          row.debtPaymentsTotal,
        ),
      })),
    [cashFlowDisplayRows],
  );

  // Always 6-month series for KPI sparklines, independent of dashboard range
  const sparklineMonthKeys = useMemo(
    () => getRangeMonthKeys("6", currentMonthKey),
    [currentMonthKey],
  );
  const kpiSparklineRows = useMemo(
    () =>
      buildCashFlowRows({
        monthKeys: sparklineMonthKeys,
        expenses: scopedExpenses,
        income: scopedIncome,
        debtPayments: scopedDebtPayments,
        scope: expenseScope,
        includeDebtPayments,
        unassignedOwnerLabel: t("dashboard.unassigned"),
        locale: i18n.resolvedLanguage || i18n.language,
      }).map((row) => ({
        monthKey: row.monthKey,
        incomeTotal: row.incomeTotal,
        expensesTotal: row.expensesTotal,
        debtPaymentsTotal: row.debtPaymentsTotal,
        netCashFlow: computeNetCashFlow(row.incomeTotal, row.expensesTotal, row.debtPaymentsTotal),
      })),
    [sparklineMonthKeys, scopedExpenses, scopedIncome, scopedDebtPayments, expenseScope, includeDebtPayments, t, i18n.language, i18n.resolvedLanguage],
  );

  const dismissInsight = (id: string) => {
    const next = [...dismissedInsightIds, id];
    setDismissedInsightIds(next);
    sessionStorage.setItem(getInsightStorageKey(), serializeDismissedInsightIds(next));
  };

  return {
    t,
    range,
    setRange,
    selectedMonthKey,
    setSelectedMonthKey,
    expenseScope,
    setExpenseScope,
    includeDebtPayments,
    setIncludeDebtPayments,
    viewMode,
    setViewMode,
    selectedOwner,
    setSelectedOwner,
    settingsOpen,
    setSettingsOpen,
    ownerOptions,
    availableMonthKeys,
    kpis,
    kpiSparklineRows,
    cashFlowDisplayRows,
    incomeOwnerKeys,
    netCashFlowRows,
    categorySlices,
    ownerSlices,
    visibleOwnerNetRows,
    ownerExpenseItemsByOwner,
    totalSpentForSelectedRange,
    percentFormatter,
    debtRows,
    spendBySourceRows,
    ownerTransfersMtd,
    ownerTransfersMtdTotal,
    recentActivity,
    insights,
    dismissInsight,
  };
}
