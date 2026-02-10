import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { ChevronDown, ChevronUp } from "lucide-react";
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
import { useBudget } from "@/context/BudgetContext";
import { usePresetTransactions } from "@/context/PresetTransactionsContext";
import { formatCurrency, formatDate } from "@/lib/format";
import { EXPENSE_SOURCE_LOCALE_KEYS } from "@/lib/sourceLabels";
import { Button } from "@/components/ui/button";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import {
  DsChartCard,
  DsDataRow,
  DsEmptyState,
  DsLegendList,
  DsMetricCard,
  DsSectionHeader,
  DsSplitToggle,
} from "@/components/ds";
import {
  buildCashFlowRows,
  buildCategoryBreakdown,
  buildDashboardKpis,
  buildDebtSnapshot,
  buildOwnerExpenseItems,
  buildOwnerSplit,
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

export function Dashboard() {
  const { t, i18n } = useTranslation();
  const { expenses, income, debts, debtPayments, owners, ownerTransfers } = useBudget();
  const { presetTransactions } = usePresetTransactions();
  const [range, setRange] = useState<DashboardRange>("current");
  const [expenseScope, setExpenseScope] = useState<DashboardExpenseScope>("all");
  const [dismissedInsightIds, setDismissedInsightIds] = useState<string[]>(() =>
    parseDismissedInsightIds(sessionStorage.getItem(getInsightStorageKey())),
  );

  const currentMonthKey = getCurrentMonthKey();
  const previousMonthKey = getPreviousMonthKey(currentMonthKey);
  const monthKeys = useMemo(
    () => getRangeMonthKeys(range, currentMonthKey),
    [range, currentMonthKey],
  );

  const kpis = useMemo(
    () =>
      buildDashboardKpis({
        currentMonthKey,
        expenses,
        income,
        debts,
        debtPayments,
        scope: expenseScope,
      }),
    [currentMonthKey, expenses, income, debts, debtPayments, expenseScope],
  );

  const cashFlowRows = useMemo(
    () =>
      buildCashFlowRows({
        monthKeys,
        expenses,
        income,
        debtPayments,
        scope: expenseScope,
        unassignedOwnerLabel: t("dashboard.unassigned"),
        locale: i18n.resolvedLanguage || i18n.language,
      }),
    [monthKeys, expenses, income, debtPayments, expenseScope, t, i18n.language, i18n.resolvedLanguage],
  );

  const categorySlices = useMemo(
    () =>
      buildCategoryBreakdown({
        expenses,
        currentMonthKey,
        scope: expenseScope,
        uncategorizedLabel: t("common.uncategorized"),
      }),
    [expenses, currentMonthKey, expenseScope, t],
  );

  const ownerSlices = useMemo(
    () =>
      buildOwnerSplit({
        expenses,
        currentMonthKey,
        monthKeys,
        scope: expenseScope,
        owners,
        sharedLabel: t("dashboard.shared"),
        unassignedLabel: t("dashboard.unassigned"),
      }),
    [expenses, currentMonthKey, monthKeys, expenseScope, owners, t],
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
          expenses,
          currentMonthKey,
          monthKeys,
          scope: expenseScope,
          owners,
          owner: row.owner,
        }),
      );
    }
    return map;
  }, [ownerExpenseRows, expenses, currentMonthKey, monthKeys, expenseScope, owners]);
  const totalSpentForSelectedRange = useMemo(
    () => cashFlowRows.reduce((sum, row) => sum + row.expensesTotal, 0),
    [cashFlowRows],
  );
  const ownerNetRows = useMemo(() => {
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
          net: gross - received + sent,
          sent,
          received,
        };
      })
      .sort((a, b) => b.gross - a.gross);
  }, [ownerExpenseRows, ownerTransfers, monthKeys]);

  const debtRows = useMemo(
    () => buildDebtSnapshot({ debts, debtPayments }),
    [debts, debtPayments],
  );

  const ownerTransfersMtd = useMemo(
    () =>
      buildOwnerTransfersMtd({
        ownerTransfers,
        currentMonthKey,
        limit: 5,
      }),
    [ownerTransfers, currentMonthKey],
  );
  const ownerTransfersMtdTotal = useMemo(
    () => ownerTransfersMtd.reduce((sum, row) => sum + row.amount, 0),
    [ownerTransfersMtd],
  );

  const recentActivity = useMemo(() => buildRecentActivity(expenses), [expenses]);
  const spendBySourceRows = useMemo(
    () =>
      buildSpendBySource({
        expenses,
        monthKeys,
        scope: expenseScope,
      }),
    [expenses, monthKeys, expenseScope],
  );

  const insights = useMemo(
    () =>
      buildDashboardInsights({
        currentMonthKey,
        previousMonthKey,
        scope: expenseScope,
        expenses,
        income,
        debts,
        debtPayments,
        presetTransactions,
      }).filter((insight) => !dismissedInsightIds.includes(insight.id)),
    [
      currentMonthKey,
      previousMonthKey,
      expenseScope,
      expenses,
      income,
      debts,
      debtPayments,
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

  const netCashFlowRows = useMemo(
    () =>
      cashFlowRows.map((row) => ({
        monthKey: row.monthKey,
        monthLabel: row.monthLabel,
        netCashFlow: row.incomeTotal - row.expensesTotal - row.debtPaymentsTotal,
      })),
    [cashFlowRows],
  );

  const dismissInsight = (id: string) => {
    const next = [...dismissedInsightIds, id];
    setDismissedInsightIds(next);
    sessionStorage.setItem(getInsightStorageKey(), serializeDismissedInsightIds(next));
  };

  return (
    <div className="flex flex-col min-h-0 min-w-0 flex-1 overflow-y-auto overflow-x-hidden pb-24 md:pb-0">
      <div className="min-w-0 px-2 md:px-0 pt-4 md:pt-0 space-y-4">
        <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
          <DsSectionHeader
            title={t("dashboard.title")}
            subtitle={t("dashboard.healthQuestion")}
          />
          <div className="flex w-full flex-col items-start gap-2 md:w-auto md:items-end">
            <div className="w-full md:w-auto">
              <DsSplitToggle
                className="md:min-w-[430px]"
                options={[
                  { value: "current", label: t("dashboard.rangeCurrent") },
                  { value: "6", label: t("dashboard.range6") },
                  { value: "12", label: t("dashboard.range12") },
                ]}
                value={range}
                onChange={(next) => setRange(next as DashboardRange)}
              />
            </div>
            <div className="w-full md:w-auto">
              <DsSplitToggle
                className="md:min-w-[320px]"
                options={[
                  { value: "all", label: t("dashboard.scopeAllExpenses") },
                  { value: "exclude-mortgage", label: t("dashboard.scopeExcludeMortgage") },
                ]}
                value={expenseScope}
                onChange={(next) => setExpenseScope(next as DashboardExpenseScope)}
              />
            </div>
            {expenseScope === "exclude-mortgage" ? (
              <p className="text-xs text-muted-foreground">
                {t("dashboard.scopeMortgageExcludedHint")}
              </p>
            ) : null}
          </div>
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
            subtitle={`${t("dashboard.vsLastMonth")}: ${formatSpentDeltaLabel(kpis.spentVsLastMonthPct)}`}
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
                debtPayments: { label: t("dashboard.chartDebtPayments"), color: "var(--viz-debt)" },
              }}
              heightMobile={220}
              heightDesktop={280}
            >
              <BarChart data={cashFlowRows}>
                <CartesianGrid vertical={false} />
                <XAxis dataKey="monthLabel" />
                <YAxis />
                <ChartTooltip
                  content={
                    <ChartTooltipContent
                      className="min-w-[16rem] px-4 py-3 text-sm"
                      labelClassName="text-sm font-semibold"
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
                />
                <Bar dataKey="debtPaymentsTotal" name={t("dashboard.chartDebtPayments")} fill="var(--viz-debt)" />
              </BarChart>
            </ChartContainer>
          </div>
          <div className="md:hidden">
            <ChartContainer
              config={{
                income: { label: t("dashboard.chartIncome"), color: INCOME_OWNER_COLORS[0] },
                expenses: { label: t("dashboard.chartExpenses"), color: "var(--viz-expense)" },
                debtPayments: { label: t("dashboard.chartDebtPayments"), color: "var(--viz-debt)" },
              }}
              heightMobile={220}
              heightDesktop={280}
            >
              <BarChart
                data={cashFlowRows}
                margin={{ top: 4, right: 24, left: -4, bottom: 2 }}
              >
                <CartesianGrid vertical={false} />
                <XAxis
                  dataKey="monthLabel"
                  tick={{ fontSize: 11 }}
                  tickMargin={8}
                  minTickGap={18}
                  interval="preserveStartEnd"
                  padding={{ left: 0, right: 8 }}
                  tickFormatter={(value) => {
                    const label = String(value ?? "");
                    const month = label.split(" ")[0] ?? label;
                    return month.slice(0, 3);
                  }}
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
                      className="min-w-[16rem] px-4 py-3 text-sm"
                      labelClassName="text-sm font-semibold"
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
                />
                <Bar
                  dataKey="debtPaymentsTotal"
                  name={t("dashboard.chartDebtPayments")}
                  fill="var(--viz-debt)"
                  radius={[4, 4, 0, 0]}
                />
              </BarChart>
            </ChartContainer>
          </div>
            {cashFlowRows.length === 0 ? (
              <DsEmptyState title={t("dashboard.chartNoDataRange")} className="py-4" />
            ) : null}
          </DsChartCard>

          <DsChartCard title={t("dashboard.chartNetCashFlowTrend")} className="min-w-0">
            {range === "current" ? (
              <div className="rounded-xl border border-border/60 bg-muted/20 px-3 py-3">
                <p className="text-xs text-muted-foreground">{t("dashboard.chartCurrentMonthNetCashFlow")}</p>
                <p
                  className={
                    (netCashFlowRows[0]?.netCashFlow ?? 0) >= 0
                      ? "mt-1 text-2xl font-semibold text-green-400"
                      : "mt-1 text-2xl font-semibold text-destructive"
                  }
                >
                  {formatCurrency(netCashFlowRows[0]?.netCashFlow ?? 0)}
                </p>
                <p className="mt-1 text-xs text-muted-foreground">
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
                      <XAxis dataKey="monthLabel" />
                      <YAxis />
                      <ReferenceLine y={0} stroke="rgba(255,255,255,0.25)" />
                      <ChartTooltip
                        content={
                          <ChartTooltipContent
                            className="min-w-[16rem] px-4 py-3 text-sm"
                            labelClassName="text-sm font-semibold"
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
                      dataKey="monthLabel"
                      tick={{ fontSize: 11 }}
                      tickMargin={8}
                      minTickGap={18}
                      interval="preserveStartEnd"
                      padding={{ left: 0, right: 10 }}
                      tickFormatter={(value) => {
                        const label = String(value ?? "");
                        const month = label.split(" ")[0] ?? label;
                        return month.slice(0, 3);
                      }}
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
                            className="min-w-[16rem] px-4 py-3 text-sm"
                            labelClassName="text-sm font-semibold"
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
                            className="min-w-[16rem] px-4 py-3 text-sm"
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
                            className="min-w-[16rem] px-4 py-3 text-sm"
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
                            className="min-w-[16rem] px-4 py-3 text-sm"
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
                            className="min-w-[16rem] px-4 py-3 text-sm"
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

        <section className="space-y-2">
          <h2 className="text-base font-semibold">{t("dashboard.sectionExpenseByOwner")}</h2>
          {ownerNetRows.length === 0 ? (
            <DsEmptyState title={t("dashboard.sectionNoOwnerExpenses")} className="py-4" />
          ) : (
            <div className="border-t border-[var(--border-subtle)]">
              <div className="grid grid-cols-2 gap-2 px-2 py-2 text-[11px] uppercase tracking-wide text-muted-foreground">
                <p>{t("dashboard.grossExpenseByOwner")}</p>
                <p className="text-right">{t("dashboard.netAfterTransfers")}</p>
              </div>
              <div>
              {ownerNetRows.map((row) => {
                const percentOfTotal =
                  totalSpentForSelectedRange > 0
                    ? row.gross / totalSpentForSelectedRange
                    : 0;
                const isExpanded = expandedOwnerKey === row.owner;
                const ownerItems = ownerExpenseItemsByOwner.get(row.owner) ?? [];
                const netToneClass =
                  row.net >= 0 ? "text-foreground" : "text-destructive";
                return (
                  <DsDataRow
                    key={row.owner}
                    title={row.owner}
                    subtitle={t("dashboard.ofTotalSpent", {
                      percent: percentFormatter.format(percentOfTotal),
                    })}
                    trailing={
                      <div className="flex items-center gap-4">
                        <div className="text-right">
                          <p className="text-sm font-semibold">{formatCurrency(row.gross)}</p>
                          <p className={`text-xs font-medium ${netToneClass}`}>
                            {formatCurrency(row.net)}
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
                            <p>{t("dashboard.grossExpenseByOwner")}: {formatCurrency(row.gross)}</p>
                            <p className="text-right">
                              {t("dashboard.netAfterTransfers")}:{" "}
                              <span className={netToneClass}>{formatCurrency(row.net)}</span>
                            </p>
                            <p>{t("dashboard.transfersSent")}: {formatCurrency(row.sent)}</p>
                            <p className="text-right">{t("dashboard.transfersReceived")}: {formatCurrency(row.received)}</p>
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
                    className={isExpanded ? "bg-muted/20" : undefined}
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
          className="space-y-0 pb-4 border-t border-[var(--border-subtle)]"
        >
          <AccordionItem
            value="debt"
            className="border-b border-[var(--border-subtle)] px-0"
          >
            <AccordionTrigger className="py-4 text-base font-semibold hover:no-underline">
              {t("dashboard.sectionDebtSnapshot")}
            </AccordionTrigger>
            <AccordionContent className="pb-3 pt-0">
              {debtRows.length === 0 ? (
                <div className="border-t border-[var(--border-subtle)] pt-3">
                  <DsEmptyState title={t("dashboard.sectionNoActiveDebts")} className="py-4" />
                </div>
              ) : (
                <div className="border-t border-[var(--border-subtle)]">
                  {debtRows.map((row, index) => (
                    <DsDataRow
                      key={row.id}
                      title={row.name}
                      subtitle={row.owner || t("common.noOwner")}
                      trailing={<p className="font-semibold">{formatCurrency(row.remaining)}</p>}
                      meta={
                        <>
                          <div className="mt-2 h-2 rounded bg-muted">
                            <div className="h-2 rounded bg-primary" style={{ width: `${Math.min(100, Math.max(0, row.progress * 100))}%` }} />
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
            className="border-b border-[var(--border-subtle)] px-0"
          >
            <AccordionTrigger className="py-4 text-base font-semibold hover:no-underline">
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
            className="border-b border-[var(--border-subtle)] px-0"
          >
            <AccordionTrigger className="py-4 text-base font-semibold hover:no-underline">
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
            className="border-b border-[var(--border-subtle)] px-0"
          >
            <AccordionTrigger className="py-4 text-base font-semibold hover:no-underline">
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
            className="border-b border-[var(--border-subtle)] px-0"
          >
            <AccordionTrigger className="py-4 text-base font-semibold hover:no-underline">
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
    </div>
  );
}
