import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { ChevronDown, ChevronUp, SlidersHorizontal } from "lucide-react";
import {
  AreaChart,
  Area,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ReferenceLine,
  XAxis,
  YAxis,
} from "recharts";
import { useBudget } from "@/context";
import { usePresetTransactions } from "@/context";
import { formatCurrency, formatDate } from "@/lib/format";
import { clamp, computeNetCashFlow, percentOfTotal, sumAmountsBy } from "@/lib/math";
import { isValidDate } from "@/lib/totals";
import { EXPENSE_SOURCE_LOCALE_KEYS } from "@/lib/sourceLabels";
import {
  collectFinancialOwners,
  scopeFinancialData,
  type FinancialViewMode,
} from "@/lib/financialModel";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import {
  DsChartCard,
  DsActionBar,
  DsDataRow,
  DsEmptyState,
  DsLegendList,
  DsMetricCard,
  DsSectionHeader,
  DsSplitToggle,
} from "@/components/ds";
import { useMediaQuery } from "@/hooks/useMediaQuery";
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
  formatDebtPaidSubtitle,
  formatSpentDeltaLabel,
  getInsightStorageKey,
  parseDismissedInsightIds,
  serializeDismissedInsightIds,
} from "@/pages/dashboard/dashboardInsights";
import type { DashboardExpenseScope, DashboardRange } from "@/types/dashboard";

const INCOME_OWNER_COLORS = [
  "var(--viz-series-1)",
  "var(--viz-series-2)",
  "var(--viz-series-3)",
  "var(--viz-series-4)",
  "var(--viz-series-5)",
  "#EC4899",
];

const DONUT_COLORS = [
  "var(--viz-series-1)",
  "var(--viz-series-4)",
  "var(--viz-series-3)",
  "var(--viz-series-2)",
  "var(--viz-series-5)",
  "var(--viz-expense)",
  "var(--viz-debt)",
];

function asNumber(value: unknown): number {
  if (typeof value === "number") return value;
  if (typeof value === "string") {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : 0;
  }
  return 0;
}

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

function monthLabelFromTooltipPayload(payload: unknown): string {
  if (!Array.isArray(payload) || payload.length === 0) return "";
  const first = payload[0] as { payload?: { monthLabel?: string } };
  return first?.payload?.monthLabel ?? "";
}

export function Dashboard() {
  const { t, i18n } = useTranslation();
  const isMobile = useMediaQuery("(max-width: 767px)");
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
    [
      viewMode,
      selectedOwner,
      owners,
      expenses,
      income,
      debts,
      debtPayments,
      ownerTransfers,
    ],
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
    [
      currentMonthKey,
      scopedExpenses,
      scopedIncome,
      scopedDebts,
      scopedDebtPayments,
      expenseScope,
      includeDebtPayments,
    ],
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
    [
      monthKeys,
      scopedExpenses,
      scopedIncome,
      scopedDebtPayments,
      expenseScope,
      includeDebtPayments,
      t,
      i18n.language,
      i18n.resolvedLanguage,
    ],
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
  const [expandedOwnerKey, setExpandedOwnerKey] = useState<string | null>(null);
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
    [
      currentMonthKey,
      previousMonthKey,
      expenseScope,
      scopedExpenses,
      scopedIncome,
      scopedDebts,
      scopedDebtPayments,
      presetTransactions,
      dismissedInsightIds,
    ],
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

  const dismissInsight = (id: string) => {
    const next = [...dismissedInsightIds, id];
    setDismissedInsightIds(next);
    sessionStorage.setItem(getInsightStorageKey(), serializeDismissedInsightIds(next));
  };

  return (
    <div className="flex flex-col min-h-0 min-w-0 flex-1 overflow-y-auto overflow-x-hidden pb-24 md:pb-0">
      <div className="min-w-0 px-2 md:px-0 pt-4 md:pt-0 space-y-4">
        <div className="space-y-3">
          <DsSectionHeader
            title={t("dashboard.title")}
            subtitle={t("dashboard.healthQuestion")}
            showCurrencyChip
            actions={
              !isMobile ? (
                <Button
                  variant="outline"
                  className="h-11 gap-2"
                  onClick={() => setSettingsOpen(true)}
                >
                  <SlidersHorizontal className="size-4" />
                  <span>{t("settings.title")}</span>
                </Button>
              ) : undefined
            }
          />
        </div>

        <div className="grid grid-cols-2 gap-1.5 md:grid-cols-2 md:gap-3 xl:grid-cols-4">
          <DsMetricCard
            title={t("dashboard.kpiNetCashFlowMtd")}
            value={formatCurrency(kpis.netCashFlow)}
            tone={kpis.netCashFlow >= 0 ? "positive" : "negative"}
          />
          <DsMetricCard
            title={t("dashboard.kpiTotalSpentMtd")}
            value={formatCurrency(kpis.totalSpent)}
            subtitle={
              <span className="space-y-0.5">
                <span className="block">
                  {t("dashboard.vsLastMonth")}: {formatSpentDeltaLabel(kpis.spentVsLastMonthPct)}
                </span>
                <span className="block text-xs">
                  {expenseScope === "all" && includeDebtPayments
                    ? t("dashboard.kpiTotalSpentDefAll")
                    : expenseScope === "all" && !includeDebtPayments
                      ? t("dashboard.kpiTotalSpentDefAllExcludeDebt")
                      : expenseScope === "exclude-mortgage" && includeDebtPayments
                        ? t("dashboard.kpiTotalSpentDefExcludeMortgage")
                        : t("dashboard.kpiTotalSpentDefExcludeMortgageAndDebt")}
                </span>
              </span>
            }
          />
          <DsMetricCard
            title={t("dashboard.kpiTotalIncomeMtd")}
            value={formatCurrency(kpis.totalIncome)}
          />
          <DsMetricCard
            title={t("dashboard.kpiTotalDebtOutstanding")}
            value={formatCurrency(kpis.debtOutstanding)}
            subtitle={formatDebtPaidSubtitle(kpis.debtPaidThisMonth, t)}
          />
        </div>

        <div className="min-w-0 grid grid-cols-1 gap-4 lg:grid-cols-2">
          <DsChartCard title={t("dashboard.chartIncomeVsExpenses")} className="min-w-0">
          <div className="hidden md:block">
            <ChartContainer
              config={{
                expenses: { label: t("dashboard.chartExpenses"), color: "var(--viz-expense)" },
                ...(includeDebtPayments
                  ? {
                      debtPayments: {
                        label: t("dashboard.chartDebtPayments"),
                        color: "var(--viz-debt)",
                      },
                    }
                  : {}),
              }}
              heightMobile={220}
              heightDesktop={280}
            >
              <BarChart data={cashFlowDisplayRows}>
                <CartesianGrid vertical={false} />
                <XAxis
                  dataKey="monthAxisLabel"
                  interval={0}
                  tickMargin={8}
                  minTickGap={0}
                />
                <YAxis />
                <ChartTooltip
                  content={
                    <ChartTooltipContent
                      className="min-w-[16rem] bg-card border-border px-4 py-3 text-sm shadow-md"
                      labelClassName="text-sm font-semibold"
                      labelFormatter={(_, payload) => monthLabelFromTooltipPayload(payload)}
                      valueFormatter={(value) => formatCurrency(asNumber(value))}
                    />
                  }
                />
                {incomeOwnerKeys.map((owner, index) => (
                  <Bar
                    key={owner}
                    dataKey={(row) => row.incomeByOwner[owner] ?? 0}
                    name={t("dashboard.chartIncomeOwner", { owner })}
                    fill={INCOME_OWNER_COLORS[index % INCOME_OWNER_COLORS.length]}
                    stackId="income"
                    radius={index === incomeOwnerKeys.length - 1 ? [4, 4, 0, 0] : 0}
                  />
                ))}
                <Bar
                  dataKey="expensesTotal"
                  name={t("dashboard.chartExpenses")}
                  fill="var(--viz-expense)"
                  stackId="outflow"
                />
                {includeDebtPayments ? (
                  <Bar
                    dataKey="debtPaymentsTotal"
                    name={t("dashboard.chartDebtPayments")}
                    fill="var(--viz-debt)"
                    stackId="outflow"
                  />
                ) : null}
              </BarChart>
            </ChartContainer>
          </div>
          <div className="md:hidden">
            <ChartContainer
              config={{
                income: { label: t("dashboard.chartIncome"), color: INCOME_OWNER_COLORS[0] },
                expenses: { label: t("dashboard.chartExpenses"), color: "var(--viz-expense)" },
                ...(includeDebtPayments
                  ? {
                      debtPayments: {
                        label: t("dashboard.chartDebtPayments"),
                        color: "var(--viz-debt)",
                      },
                    }
                  : {}),
              }}
              heightMobile={220}
              heightDesktop={280}
            >
              <BarChart
                data={cashFlowDisplayRows}
                margin={{ top: 4, right: 24, left: -4, bottom: 2 }}
              >
                <CartesianGrid vertical={false} />
                <XAxis
                  dataKey="monthAxisLabel"
                  tick={{ fontSize: 11 }}
                  tickMargin={8}
                  minTickGap={18}
                  interval="preserveStartEnd"
                  padding={{ left: 0, right: 8 }}
                />
                <YAxis
                  tick={{ fontSize: 11 }}
                  width={34}
                  tickFormatter={(value) => {
                    const abs = Math.abs(Number(value));
                    if (abs >= 1000) return `${Math.round(Number(value) / 1000)}k`;
                    return String(Math.round(Number(value)));
                  }}
                />
                <ChartTooltip
                  content={
                    <ChartTooltipContent
                      className="min-w-[16rem] bg-card border-border px-4 py-3 text-sm shadow-md"
                      labelClassName="text-sm font-semibold"
                      labelFormatter={(_, payload) => monthLabelFromTooltipPayload(payload)}
                      valueFormatter={(value) => formatCurrency(asNumber(value))}
                    />
                  }
                />
                <Bar dataKey="incomeTotal" name={t("dashboard.chartIncome")} fill="var(--viz-income)" radius={[4, 4, 0, 0]} />
                <Bar
                  dataKey="expensesTotal"
                  name={t("dashboard.chartExpenses")}
                  fill="var(--viz-expense)"
                  radius={[4, 4, 0, 0]}
                  stackId="outflow"
                />
                {includeDebtPayments ? (
                  <Bar
                    dataKey="debtPaymentsTotal"
                    name={t("dashboard.chartDebtPayments")}
                    fill="var(--viz-debt)"
                    radius={[4, 4, 0, 0]}
                    stackId="outflow"
                  />
                ) : null}
              </BarChart>
            </ChartContainer>
          </div>
            {cashFlowDisplayRows.length === 0 ? (
              <DsEmptyState title={t("dashboard.chartNoDataRange")} className="py-4" />
            ) : null}
          </DsChartCard>

          <DsChartCard title={t("dashboard.chartNetCashFlowTrend")} className="min-w-0">
            {range === "current" ? (
              <div className="rounded-2xl border border-border bg-card px-4 py-4 md:px-5 md:py-5">
                <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground/90">
                  {t("dashboard.chartCurrentMonthNetCashFlow")}
                </p>
                <p
                  className={
                    (netCashFlowRows[0]?.netCashFlow ?? 0) >= 0
                      ? "mt-2 text-3xl font-semibold leading-tight text-emerald-500"
                      : "mt-2 text-3xl font-semibold leading-tight text-destructive"
                  }
                >
                  {formatCurrency(netCashFlowRows[0]?.netCashFlow ?? 0)}
                </p>
                <p className="mt-2 text-sm text-muted-foreground">
                  {t("dashboard.chartTrendSwitchHint")}
                </p>
              </div>
            ) : (
              <>
                <div className="hidden md:block">
                <ChartContainer
                  config={{
                    netCashFlow: { label: t("dashboard.chartNetCashFlow"), color: "var(--viz-series-3)" },
                  }}
                  heightMobile={220}
                  heightDesktop={280}
                >
                    <AreaChart data={netCashFlowRows}>
                      <defs>
                        <linearGradient id="netCashFlowAreaDesktop" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="var(--viz-series-3)" stopOpacity={0.35} />
                          <stop offset="75%" stopColor="var(--viz-series-3)" stopOpacity={0.14} />
                          <stop offset="100%" stopColor="var(--viz-series-3)" stopOpacity={0.03} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid vertical={false} />
                      <XAxis
                        dataKey="monthAxisLabel"
                        interval={0}
                        tickMargin={8}
                        minTickGap={0}
                      />
                      <YAxis />
                      <ReferenceLine y={0} stroke="rgba(255,255,255,0.25)" />
                      <ChartTooltip
                        content={
                          <ChartTooltipContent
                            className="min-w-[16rem] bg-card border-border px-4 py-3 text-sm shadow-md"
                            labelClassName="text-sm font-semibold"
                            labelFormatter={(_, payload) => monthLabelFromTooltipPayload(payload)}
                            valueFormatter={(value) => formatCurrency(asNumber(value))}
                          />
                        }
                      />
                      <Area
                        type="monotone"
                        dataKey="netCashFlow"
                        name={t("dashboard.chartNetCashFlow")}
                        stroke="var(--viz-series-3)"
                        fill="url(#netCashFlowAreaDesktop)"
                        strokeWidth={2.2}
                        dot={false}
                        activeDot={{ r: 5 }}
                        isAnimationActive={false}
                      />
                    </AreaChart>
                  </ChartContainer>
                </div>
                <div className="md:hidden">
                <ChartContainer
                  config={{
                    netCashFlow: { label: t("dashboard.chartNetCashFlow"), color: "var(--viz-series-3)" },
                  }}
                  heightMobile={220}
                  heightDesktop={280}
                >
                  <AreaChart
                    data={netCashFlowRows}
                    margin={{ top: 4, right: 24, left: -6, bottom: 2 }}
                  >
                      <defs>
                        <linearGradient id="netCashFlowAreaMobile" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="var(--viz-series-3)" stopOpacity={0.3} />
                          <stop offset="75%" stopColor="var(--viz-series-3)" stopOpacity={0.12} />
                          <stop offset="100%" stopColor="var(--viz-series-3)" stopOpacity={0.02} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid vertical={false} />
                    <XAxis
                      dataKey="monthAxisLabel"
                      tick={{ fontSize: 11 }}
                      tickMargin={8}
                      minTickGap={18}
                      interval="preserveStartEnd"
                      padding={{ left: 0, right: 10 }}
                    />
                    <YAxis
                      tick={{ fontSize: 11 }}
                      width={34}
                      tickFormatter={(value) => {
                        const abs = Math.abs(Number(value));
                        if (abs >= 1000) return `${Math.round(Number(value) / 1000)}k`;
                        return String(Math.round(Number(value)));
                      }}
                    />
                      <ReferenceLine y={0} stroke="rgba(255,255,255,0.25)" />
                      <ChartTooltip
                        content={
                          <ChartTooltipContent
                            className="min-w-[16rem] bg-card border-border px-4 py-3 text-sm shadow-md"
                            labelClassName="text-sm font-semibold"
                            labelFormatter={(_, payload) => monthLabelFromTooltipPayload(payload)}
                            valueFormatter={(value) => formatCurrency(asNumber(value))}
                          />
                        }
                      />
                      <Area
                        type="monotone"
                        dataKey="netCashFlow"
                        name={t("dashboard.chartNetCashFlow")}
                        stroke="var(--viz-series-3)"
                        fill="url(#netCashFlowAreaMobile)"
                        strokeWidth={2}
                        dot={false}
                        activeDot={{ r: 4 }}
                        isAnimationActive={false}
                      />
                    </AreaChart>
                  </ChartContainer>
                </div>
              </>
            )}
            {netCashFlowRows.length === 0 ? (
              <DsEmptyState title={t("dashboard.chartNoNetCashFlowData")} className="py-4" />
            ) : null}
          </DsChartCard>
        </div>

        <section className="min-w-0 grid grid-cols-1 gap-4 lg:grid-cols-2">
          <DsChartCard title={t("dashboard.chartSpendingBreakdown")} className="min-w-0">
            {categorySlices.length === 0 ? (
              <DsEmptyState title={t("dashboard.chartNoSpendingCategories")} className="py-4" />
            ) : (
              <>
                <div className="hidden md:block">
                  <ChartContainer config={{ value: { label: t("dashboard.chartAmount"), color: DONUT_COLORS[0]! } }} heightMobile={210} heightDesktop={260}>
                    <PieChart>
                      <Pie
                        data={categorySlices}
                        dataKey="value"
                        nameKey="label"
                        outerRadius={90}
                      >
                        {categorySlices.map((slice, index) => (
                          <Cell key={slice.label} fill={DONUT_COLORS[index % DONUT_COLORS.length]} />
                        ))}
                      </Pie>
                      <ChartTooltip
                        content={
                          <ChartTooltipContent
                            className="min-w-[16rem] bg-card border-border px-4 py-3 text-sm shadow-md"
                            labelClassName="text-sm font-semibold"
                            valueFormatter={(value) => formatCurrency(asNumber(value))}
                          />
                        }
                      />
                    </PieChart>
                  </ChartContainer>
                </div>
                <div className="md:hidden space-y-2">
                  <ChartContainer config={{ value: { label: t("dashboard.chartAmount"), color: DONUT_COLORS[0]! } }} heightMobile={210} heightDesktop={260}>
                    <PieChart>
                      <Pie
                        data={categorySlices}
                        dataKey="value"
                        nameKey="label"
                        innerRadius={42}
                        outerRadius={70}
                      >
                        {categorySlices.map((slice, index) => (
                          <Cell key={slice.label} fill={DONUT_COLORS[index % DONUT_COLORS.length]} />
                        ))}
                      </Pie>
                      <ChartTooltip
                        content={
                          <ChartTooltipContent
                            className="min-w-[16rem] bg-card border-border px-4 py-3 text-sm shadow-md"
                            labelClassName="text-sm font-semibold"
                            valueFormatter={(value) => formatCurrency(asNumber(value))}
                          />
                        }
                      />
                    </PieChart>
                  </ChartContainer>
                  <DsLegendList
                    items={categorySlices.slice(0, 4).map((slice, index) => ({
                      key: slice.label,
                      label: slice.label,
                      value: formatCurrency(slice.value),
                      color: DONUT_COLORS[index % DONUT_COLORS.length]!,
                    }))}
                  />
                </div>
              </>
            )}
          </DsChartCard>

          <DsChartCard title={t("dashboard.chartSharedVsIndividualSpending")} className="min-w-0">
            {ownerSlices.length === 0 ? (
              <DsEmptyState title={t("dashboard.chartNoOwnerSplitData")} className="py-4" />
            ) : (
              <>
                <div className="hidden md:block">
                  <ChartContainer config={{ value: { label: t("dashboard.chartAmount"), color: DONUT_COLORS[0]! } }} heightMobile={210} heightDesktop={260}>
                    <PieChart>
                      <Pie
                        data={ownerSlices}
                        dataKey="value"
                        nameKey="label"
                        outerRadius={90}
                      >
                        {ownerSlices.map((slice, index) => (
                          <Cell key={slice.key} fill={DONUT_COLORS[index % DONUT_COLORS.length]} />
                        ))}
                      </Pie>
                      <ChartTooltip
                        content={
                          <ChartTooltipContent
                            className="min-w-[16rem] bg-card border-border px-4 py-3 text-sm shadow-md"
                            labelClassName="text-sm font-semibold"
                            valueFormatter={(value) => formatCurrency(asNumber(value))}
                          />
                        }
                      />
                    </PieChart>
                  </ChartContainer>
                </div>
                <div className="md:hidden space-y-2">
                  <ChartContainer config={{ value: { label: t("dashboard.chartAmount"), color: DONUT_COLORS[0]! } }} heightMobile={210} heightDesktop={260}>
                    <PieChart>
                      <Pie
                        data={ownerSlices}
                        dataKey="value"
                        nameKey="label"
                        innerRadius={42}
                        outerRadius={70}
                      >
                        {ownerSlices.map((slice, index) => (
                          <Cell key={slice.key} fill={DONUT_COLORS[index % DONUT_COLORS.length]} />
                        ))}
                      </Pie>
                      <ChartTooltip
                        content={
                          <ChartTooltipContent
                            className="min-w-[16rem] bg-card border-border px-4 py-3 text-sm shadow-md"
                            labelClassName="text-sm font-semibold"
                            valueFormatter={(value) => formatCurrency(asNumber(value))}
                          />
                        }
                      />
                    </PieChart>
                  </ChartContainer>
                  <DsLegendList
                    items={ownerSlices.map((slice, index) => ({
                      key: slice.key,
                      label: slice.label,
                      value: formatCurrency(slice.value),
                      color: DONUT_COLORS[index % DONUT_COLORS.length]!,
                    }))}
                  />
                </div>
              </>
            )}
          </DsChartCard>
        </section>

        <section className="space-y-2 pt-2">
          <h2 className="text-base font-semibold">{t("dashboard.sectionExpenseByOwner")}</h2>
          {visibleOwnerNetRows.length === 0 ? (
            <DsEmptyState title={t("dashboard.sectionNoOwnerExpenses")} className="py-4" />
          ) : (
            <div className="rounded-2xl border border-border/60 bg-card">
              <div className="grid grid-cols-2 gap-2 border-b border-[var(--border-subtle)] px-3 py-2 text-[11px] uppercase tracking-wide text-muted-foreground">
                <p>{t("dashboard.grossExpenseByOwner")}</p>
                <p className="text-right">{t("dashboard.netAfterTransfers")}</p>
              </div>
              <div>
              {visibleOwnerNetRows.map((row) => {
                const ownerShareOfTotal = percentOfTotal(
                  row.gross,
                  totalSpentForSelectedRange,
                );
                const isExpanded = expandedOwnerKey === row.owner;
                const ownerItems = ownerExpenseItemsByOwner.get(row.owner) ?? [];
                const transferImpact = row.received - row.sent;
                const netToneClass =
                  row.net >= 0 ? "text-foreground" : "text-destructive";
                const transferToneClass =
                  transferImpact >= 0 ? "text-emerald-500" : "text-amber-500";
                const transferImpactDisplay =
                  transferImpact > 0
                    ? `+${formatCurrency(transferImpact)}`
                    : formatCurrency(transferImpact);
                return (
                  <DsDataRow
                    key={row.owner}
                    title={row.owner}
                    subtitle={t("dashboard.ofTotalSpent", {
                      percent: percentFormatter.format(ownerShareOfTotal),
                    })}
                    trailing={
                      <div className="flex items-center gap-4">
                        <div className="text-right">
                          <p className="text-[10px] uppercase tracking-wide text-muted-foreground">
                            {t("dashboard.netAfterTransfers")}
                          </p>
                          <p className={`text-2xl font-bold leading-none ${netToneClass}`}>
                            {formatCurrency(row.net)}
                          </p>
                          <p className="mt-1 text-xs text-muted-foreground">
                            {t("dashboard.grossShort")}:{" "}
                            <span className="font-semibold text-foreground">
                              {formatCurrency(row.gross)}
                            </span>
                          </p>
                          <p className={`text-xs font-semibold ${transferToneClass}`}>
                            {t("dashboard.transferImpact")}: {transferImpactDisplay}
                          </p>
                        </div>
                        {isExpanded ? (
                          <ChevronUp className="size-4 text-muted-foreground" />
                        ) : (
                          <ChevronDown className="size-4 text-muted-foreground" />
                        )}
                      </div>
                    }
                    onClick={() =>
                      setExpandedOwnerKey((prev) => (prev === row.owner ? null : row.owner))
                    }
                    ariaLabel={row.owner}
                    meta={
                      isExpanded ? (
                        <div className="space-y-2">
                          <div className="grid grid-cols-2 gap-2 text-xs text-muted-foreground">
                            <p>
                              {t("dashboard.grossExpenseByOwner")}: {formatCurrency(row.gross)}
                            </p>
                            <p className="text-right text-sm font-semibold">
                              {t("dashboard.netAfterTransfers")}:{" "}
                              <span className={netToneClass}>{formatCurrency(row.net)}</span>
                            </p>
                            <p>{t("dashboard.transfersSent")}: {formatCurrency(row.sent)}</p>
                            <p className="text-right">
                              {t("dashboard.transfersReceived")}: {formatCurrency(row.received)}
                            </p>
                            <p className="col-span-2 text-right">
                              {t("dashboard.transferImpact")}:{" "}
                              <span className={transferToneClass}>
                                {transferImpactDisplay}
                              </span>
                            </p>
                          </div>
                          {ownerItems.length === 0 ? (
                            <p className="text-xs text-muted-foreground">
                              {t("dashboard.sectionNoOwnerExpenseItems")}
                            </p>
                          ) : (
                            <div className="space-y-1">
                              {ownerItems.map((item) => (
                                <div
                                  key={`${row.owner}-${item.id}`}
                                  className="flex items-start justify-between gap-2 rounded-md bg-muted/30 px-2 py-1.5 text-xs"
                                >
                                  <div className="min-w-0">
                                    <p className="truncate font-medium text-foreground">
                                      {item.description || "—"}
                                    </p>
                                    <p className="truncate text-muted-foreground">
                                      {formatDate(item.date)} ·{" "}
                                      {item.category || t("common.uncategorized")} ·{" "}
                                      {t("addTransaction.paidBy")}:{" "}
                                      {item.paidByOwner || t("common.noOwner")}
                                    </p>
                                  </div>
                                  <div className="shrink-0 text-right">
                                    <p className="font-medium text-foreground">
                                      {formatCurrency(item.allocatedAmount)}
                                    </p>
                                    <p className="text-[11px] text-muted-foreground">
                                      {formatCurrency(item.totalAmount)}
                                    </p>
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      ) : undefined
                    }
                    className={isExpanded ? "bg-muted/20 cursor-pointer" : "cursor-pointer"}
                    dense
                  />
                );
              })}
              </div>
            </div>
          )}
        </section>

        <Accordion
          type="multiple"
          defaultValue={["debt", "spend-source"]}
          className="space-y-3 pb-4 pt-2"
        >
          <AccordionItem
            value="debt"
            className="rounded-2xl border border-border/60 bg-card px-4"
          >
            <AccordionTrigger className="cursor-pointer py-4 text-base font-semibold hover:no-underline">
              {t("dashboard.sectionDebtSnapshot")}
            </AccordionTrigger>
            <AccordionContent className="pb-3 pt-0">
              {debtRows.length === 0 ? (
                <div className="border-t border-[var(--border-subtle)] pt-3">
                  <DsEmptyState title={t("dashboard.sectionNoActiveDebts")} className="py-4" />
                </div>
              ) : (
                <div className="border-t border-[var(--border-subtle)]">
                  {debtRows.map((row) => (
                    <DsDataRow
                      key={row.id}
                      title={row.name}
                      subtitle={row.owner || t("common.noOwner")}
                      trailing={<p className="font-semibold">{formatCurrency(row.remaining)}</p>}
                      meta={
                        <>
                          <div className="mt-2 h-2 rounded bg-muted">
                            <div
                              className="h-2 rounded bg-primary"
                              style={{ width: `${clamp(row.progress * 100, 0, 100)}%` }}
                            />
                          </div>
                          <p className="mt-1 text-xs text-muted-foreground">
                            {formatCurrency(row.paid)} / {formatCurrency(row.initialAmount)}
                          </p>
                        </>
                      }
                    />
                  ))}
                </div>
              )}
            </AccordionContent>
          </AccordionItem>

          <AccordionItem
            value="spend-source"
            className="rounded-2xl border border-border/60 bg-card px-4"
          >
            <AccordionTrigger className="cursor-pointer py-4 text-base font-semibold hover:no-underline">
              {t("dashboard.sectionSpendByCardSource")}
            </AccordionTrigger>
            <AccordionContent className="pb-3 pt-0">
              {spendBySourceRows.length === 0 ? (
                <div className="border-t border-[var(--border-subtle)] pt-3">
                  <DsEmptyState title={t("dashboard.sectionNoSpendByCardSource")} className="py-4" />
                </div>
              ) : (
                <div className="border-t border-[var(--border-subtle)]">
                  {spendBySourceRows.map((row) => (
                    <DsDataRow
                      key={row.source}
                      title={t(`addTransaction.${EXPENSE_SOURCE_LOCALE_KEYS[row.source]}`)}
                      trailing={<p className="font-semibold">{formatCurrency(row.value)}</p>}
                      dense
                    />
                  ))}
                </div>
              )}
            </AccordionContent>
          </AccordionItem>

          <AccordionItem
            value="transfers"
            className="rounded-2xl border border-border/60 bg-card px-4"
          >
            <AccordionTrigger className="cursor-pointer py-4 text-base font-semibold hover:no-underline">
              {t("dashboard.ownerTransfersMtd")}
            </AccordionTrigger>
            <AccordionContent className="pb-3 pt-0">
              {ownerTransfersMtd.length === 0 ? (
                <div className="border-t border-[var(--border-subtle)] pt-3">
                  <DsEmptyState title={t("dashboard.noOwnerTransfersMtd")} className="py-4" />
                </div>
              ) : (
                <div className="border-t border-[var(--border-subtle)]">
                  <div className="px-0 py-2">
                    <p className="text-xl font-semibold">{formatCurrency(ownerTransfersMtdTotal)}</p>
                  </div>
                  {ownerTransfersMtd.map((row) => (
                    <DsDataRow
                      key={row.id}
                      title={`${row.fromOwner} → ${row.toOwner}`}
                      subtitle={`${formatDate(row.date)}${row.note ? ` · ${row.note}` : ""}`}
                      trailing={<p className="font-semibold">{formatCurrency(row.amount)}</p>}
                      dense
                    />
                  ))}
                </div>
              )}
            </AccordionContent>
          </AccordionItem>

          <AccordionItem
            value="recent"
            className="rounded-2xl border border-border/60 bg-card px-4"
          >
            <AccordionTrigger className="cursor-pointer py-4 text-base font-semibold hover:no-underline">
              {t("dashboard.sectionRecentActivity")}
            </AccordionTrigger>
            <AccordionContent className="pb-3 pt-0">
              {recentActivity.length === 0 ? (
                <div className="border-t border-[var(--border-subtle)] pt-3">
                  <DsEmptyState title={t("dashboard.sectionNoRecentTransactions")} className="py-4" />
                </div>
              ) : (
                <div className="border-t border-[var(--border-subtle)]">
                  {recentActivity.slice(0, 3).map((item) => (
                    <DsDataRow
                      key={item.id}
                      title={item.description || "—"}
                      subtitle={(item.category || t("common.uncategorized")) + " · " + (item.owner || t("common.noOwner"))}
                      trailing={<p className="font-semibold">{formatCurrency(item.amount)}</p>}
                      dense
                    />
                  ))}
                </div>
              )}
            </AccordionContent>
          </AccordionItem>

          <AccordionItem
            value="insights"
            className="rounded-2xl border border-border/60 bg-card px-4"
          >
            <AccordionTrigger className="cursor-pointer py-4 text-base font-semibold hover:no-underline">
              {t("dashboard.sectionSmartInsightsAlerts")}
            </AccordionTrigger>
            <AccordionContent className="pb-3 pt-0">
              {insights.length === 0 ? (
                <div className="border-t border-[var(--border-subtle)] pt-3">
                  <DsEmptyState title={t("dashboard.sectionNoAlerts")} className="py-4" />
                </div>
              ) : (
                <div className="space-y-2 border-t border-[var(--border-subtle)] pt-3">
                  {insights.map((insight) => (
                    <div
                      key={insight.id}
                      className="flex items-start justify-between gap-3 border border-border/60 rounded-md px-3 py-2"
                    >
                      <p className="text-sm">{t(insight.messageKey, insight.messageValues)}</p>
                      <Button
                        variant="ghost"
                        size="sm"
                        density="compact"
                        className="h-8 px-2 text-xs"
                        onClick={() => dismissInsight(insight.id)}
                      >
                        {t("dashboard.dismiss")}
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </div>

      {isMobile ? (
        <DsActionBar>
          <Button
            variant="secondary"
            density="compact"
            onClick={() => setSettingsOpen(true)}
            className="h-11 w-11 rounded-full p-0"
            aria-label={t("settings.title")}
          >
            <SlidersHorizontal className="size-4" />
          </Button>
        </DsActionBar>
      ) : null}

      <Sheet open={settingsOpen} onOpenChange={setSettingsOpen}>
        <SheetContent
          side="right"
          className="h-full w-[85vw] max-w-sm border-l p-0 gap-0 rounded-l-2xl flex flex-col"
        >
          <SheetHeader className="px-4 pt-5 pb-4 border-b border-[var(--border-subtle)]">
            <SheetTitle className="font-semibold text-left pr-10 break-words text-xl leading-snug ds-heading-3">
              {t("settings.title")}
            </SheetTitle>
            <SheetDescription className="text-muted-foreground text-sm text-left ds-body-sm">
              {t("dashboard.healthQuestion")}
            </SheetDescription>
          </SheetHeader>
          <div className="grid content-start gap-4 px-4 pt-4 pb-8 overflow-y-auto overscroll-contain flex-1 min-h-0">
            <div className="space-y-2">
              <Label className="text-muted-foreground">{t("dashboard.viewMode")}</Label>
              <DsSplitToggle
                className="w-full"
                options={[
                  { value: "household", label: t("dashboard.viewHousehold") },
                  { value: "individual", label: t("dashboard.viewIndividual") },
                ]}
                value={viewMode}
                onChange={(next) => setViewMode(next as FinancialViewMode)}
              />
            </div>
            {viewMode === "individual" ? (
              <div className="space-y-2">
                <Label className="text-muted-foreground">{t("common.owner")}</Label>
                <Select value={selectedOwner} onValueChange={setSelectedOwner}>
                  <SelectTrigger className="h-11 w-full data-[size=default]:h-11">
                    <SelectValue placeholder={t("common.noOwner")} />
                  </SelectTrigger>
                  <SelectContent>
                    {ownerOptions.map((owner) => (
                      <SelectItem key={owner} value={owner}>
                        {owner}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            ) : null}
            <div className="space-y-2">
              <Label className="text-muted-foreground">{t("common.month")}</Label>
              <Select
                value={selectedMonthKey}
                onValueChange={setSelectedMonthKey}
              >
                <SelectTrigger className="h-11 w-full data-[size=default]:h-11">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {availableMonthKeys.map((monthKey) => (
                    <SelectItem key={monthKey} value={monthKey}>
                      {formatMonthKeyNumeric(monthKey)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label className="text-muted-foreground">{t("dashboard.timeRange")}</Label>
              <DsSplitToggle
                className="w-full"
                options={[
                  { value: "current", label: t("dashboard.rangeCurrent") },
                  { value: "6", label: t("dashboard.range6") },
                  { value: "12", label: t("dashboard.range12") },
                ]}
                value={range}
                onChange={(next) => setRange(next as DashboardRange)}
              />
            </div>
            <div className="space-y-2">
              <Label className="text-muted-foreground">{t("common.totalSpent")}</Label>
              <DsSplitToggle
                className="w-full"
                options={[
                  { value: "all", label: t("dashboard.scopeAllExpenses") },
                  { value: "exclude-mortgage", label: t("dashboard.scopeExcludeMortgage") },
                ]}
                value={expenseScope}
                onChange={(next) => setExpenseScope(next as DashboardExpenseScope)}
              />
              {expenseScope === "exclude-mortgage" ? (
                <p className="text-xs text-muted-foreground">
                  {t("dashboard.scopeMortgageExcludedHint")}
                </p>
              ) : null}
            </div>
            <div className="space-y-2">
              <Label className="text-muted-foreground">{t("dashboard.chartDebtPayments")}</Label>
              <DsSplitToggle
                className="w-full"
                options={[
                  { value: "include", label: t("dashboard.includeDebtPayments") },
                  { value: "exclude", label: t("dashboard.excludeDebtPayments") },
                ]}
                value={includeDebtPayments ? "include" : "exclude"}
                onChange={(next) => setIncludeDebtPayments(next === "include")}
              />
              {!includeDebtPayments ? (
                <p className="text-xs text-muted-foreground">
                  {t("dashboard.debtPaymentsExcludedHint")}
                </p>
              ) : null}
            </div>
            <Button
              type="button"
              variant="outline"
              className="h-11 w-full"
              onClick={() => setSettingsOpen(false)}
            >
              {t("common.done")}
            </Button>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}
