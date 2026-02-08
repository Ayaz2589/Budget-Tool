import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  Line,
  LineChart,
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
import { formatCurrency } from "@/lib/format";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import {
  buildCashFlowRows,
  buildCategoryBreakdown,
  buildDashboardKpis,
  buildDebtSnapshot,
  buildFixedObligations,
  buildOwnerSplit,
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
  "#3B82F6",
  "#8B5CF6",
  "#22C55E",
  "#F59E0B",
  "#06B6D4",
  "#EC4899",
];

const DONUT_COLORS = [
  "#3B82F6",
  "#F59E0B",
  "#22C55E",
  "#A855F7",
  "#06B6D4",
  "#EF4444",
  "#EAB308",
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
  const { expenses, income, debts, debtPayments, owners } = useBudget();
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
        scope: expenseScope,
        owners,
        sharedLabel: t("dashboard.shared"),
        unassignedLabel: t("dashboard.unassigned"),
      }),
    [expenses, currentMonthKey, expenseScope, owners, t],
  );

  const debtRows = useMemo(
    () => buildDebtSnapshot({ debts, debtPayments }),
    [debts, debtPayments],
  );

  const fixedObligations = useMemo(
    () => buildFixedObligations({ expenses, debtPayments, currentMonthKey }),
    [expenses, debtPayments, currentMonthKey],
  );

  const recentActivity = useMemo(() => buildRecentActivity(expenses), [expenses]);

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
          <div>
            <h1 className="text-2xl font-semibold">{t("dashboard.title")}</h1>
            <p className="text-sm text-muted-foreground">
              {t("dashboard.healthQuestion")}
            </p>
          </div>
          <div className="flex w-full flex-col items-start gap-2 md:w-auto md:items-end">
            <div className="w-full md:w-auto">
              <div className="grid w-full grid-cols-3 rounded-2xl bg-zinc-900/80 p-1 ring-1 ring-white/10 md:min-w-[430px]">
                {[
                  { value: "current", label: t("dashboard.rangeCurrent") },
                  { value: "6", label: t("dashboard.range6") },
                  { value: "12", label: t("dashboard.range12") },
                ].map((option) => {
                  const isActive = range === option.value;
                  return (
                    <button
                      key={option.value}
                      type="button"
                      className={`h-10 rounded-xl px-2 text-sm font-medium transition-colors ${isActive ? "bg-white text-black" : "text-zinc-400 hover:text-zinc-100"}`}
                      onClick={() => setRange(option.value as DashboardRange)}
                    >
                      {option.label}
                    </button>
                  );
                })}
              </div>
            </div>
            <div className="w-full md:w-auto">
              <div className="grid w-full grid-cols-2 rounded-2xl bg-zinc-900/80 p-1 ring-1 ring-white/10 md:min-w-[320px]">
                {[
                  { value: "all", label: t("dashboard.scopeAllExpenses") },
                  { value: "exclude-mortgage", label: t("dashboard.scopeExcludeMortgage") },
                ].map((option) => {
                  const isActive = expenseScope === option.value;
                  return (
                    <button
                      key={option.value}
                      type="button"
                      className={`h-10 rounded-xl px-2 text-sm font-medium transition-colors ${isActive ? "bg-white text-black" : "text-zinc-400 hover:text-zinc-100"}`}
                      onClick={() => setExpenseScope(option.value as DashboardExpenseScope)}
                    >
                      {option.label}
                    </button>
                  );
                })}
              </div>
            </div>
            {expenseScope === "exclude-mortgage" ? (
              <p className="text-xs text-muted-foreground">
                {t("dashboard.scopeMortgageExcludedHint")}
              </p>
            ) : null}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-1.5 md:grid-cols-2 md:gap-3 xl:grid-cols-4">
          <Card>
            <CardHeader className="px-2 pt-2 pb-0.5 md:px-6 md:pt-6 md:pb-1">
              <CardTitle className="text-[11px] md:text-sm text-muted-foreground">{t("dashboard.kpiNetCashFlowMtd")}</CardTitle>
            </CardHeader>
            <CardContent className="px-2 pb-2 md:px-6 md:pb-6">
              <p className={kpis.netCashFlow >= 0 ? "text-base md:text-2xl font-semibold text-green-400" : "text-base md:text-2xl font-semibold text-destructive"}>
                {formatCurrency(kpis.netCashFlow)}
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="px-2 pt-2 pb-0.5 md:px-6 md:pt-6 md:pb-1">
              <CardTitle className="text-[11px] md:text-sm text-muted-foreground">{t("dashboard.kpiTotalSpentMtd")}</CardTitle>
            </CardHeader>
            <CardContent className="px-2 pb-2 md:px-6 md:pb-6 space-y-0.5 md:space-y-1">
              <p className="text-base md:text-2xl font-semibold">{formatCurrency(kpis.totalSpent)}</p>
              <p className="text-xs text-muted-foreground">
                {t("dashboard.vsLastMonth")}: {formatSpentDeltaLabel(kpis.spentVsLastMonthPct)}
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="px-2 pt-2 pb-0.5 md:px-6 md:pt-6 md:pb-1">
              <CardTitle className="text-[11px] md:text-sm text-muted-foreground">{t("dashboard.kpiTotalIncomeMtd")}</CardTitle>
            </CardHeader>
            <CardContent className="px-2 pb-2 md:px-6 md:pb-6">
              <p className="text-base md:text-2xl font-semibold">{formatCurrency(kpis.totalIncome)}</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="px-2 pt-2 pb-0.5 md:px-6 md:pt-6 md:pb-1">
              <CardTitle className="text-[11px] md:text-sm text-muted-foreground">{t("dashboard.kpiTotalDebtOutstanding")}</CardTitle>
            </CardHeader>
            <CardContent className="px-2 pb-2 md:px-6 md:pb-6 space-y-0.5 md:space-y-1">
              <p className="text-base md:text-2xl font-semibold">{formatCurrency(kpis.debtOutstanding)}</p>
              <p className="text-xs text-muted-foreground">
                {formatDebtPaidSubtitle(kpis.debtPaidThisMonth, t)}
              </p>
            </CardContent>
          </Card>
        </div>

        <div className="min-w-0 grid grid-cols-1 gap-4 lg:grid-cols-2">
          <section className="min-w-0 space-y-2">
            <h2 className="text-base font-semibold">{t("dashboard.chartIncomeVsExpenses")}</h2>
          <div className="hidden md:block">
            <ChartContainer
              config={{
                expenses: { label: t("dashboard.chartExpenses"), color: "#EF4444" },
                debtPayments: { label: t("dashboard.chartDebtPayments"), color: "#EAB308" },
              }}
              className="h-[280px]"
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
                  fill="var(--color-expenses)"
                />
                <Bar dataKey="debtPaymentsTotal" name={t("dashboard.chartDebtPayments")} fill="var(--color-debtPayments)" />
              </BarChart>
            </ChartContainer>
          </div>
          <div className="md:hidden">
            <ChartContainer
              config={{
                income: { label: t("dashboard.chartIncome"), color: INCOME_OWNER_COLORS[0] },
                expenses: { label: t("dashboard.chartExpenses"), color: "#EF4444" },
                debtPayments: { label: t("dashboard.chartDebtPayments"), color: "#EAB308" },
              }}
              className="h-[220px]"
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
                <Bar dataKey="incomeTotal" name={t("dashboard.chartIncome")} fill="var(--color-income)" radius={[4, 4, 0, 0]} />
                <Bar
                  dataKey="expensesTotal"
                  name={t("dashboard.chartExpenses")}
                  fill="var(--color-expenses)"
                  radius={[4, 4, 0, 0]}
                />
                <Bar
                  dataKey="debtPaymentsTotal"
                  name={t("dashboard.chartDebtPayments")}
                  fill="var(--color-debtPayments)"
                  radius={[4, 4, 0, 0]}
                />
              </BarChart>
            </ChartContainer>
          </div>
            {cashFlowRows.length === 0 ? (
              <p className="text-sm text-muted-foreground">{t("dashboard.chartNoDataRange")}</p>
            ) : null}
          </section>

          <section className="min-w-0 space-y-2">
            <h2 className="text-base font-semibold">{t("dashboard.chartNetCashFlowTrend")}</h2>
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
                    netCashFlow: { label: t("dashboard.chartNetCashFlow"), color: "#22D3EE" },
                  }}
                  className="h-[280px]"
                >
                    <LineChart data={netCashFlowRows}>
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
                      <Line
                        type="monotone"
                        dataKey="netCashFlow"
                        name={t("dashboard.chartNetCashFlow")}
                        stroke="var(--color-netCashFlow)"
                        strokeWidth={2.5}
                        dot={{ r: 3 }}
                        activeDot={{ r: 5 }}
                      />
                    </LineChart>
                  </ChartContainer>
                </div>
                <div className="md:hidden">
                <ChartContainer
                  config={{
                    netCashFlow: { label: t("dashboard.chartNetCashFlow"), color: "#22D3EE" },
                  }}
                  className="h-[220px]"
                >
                  <LineChart
                    data={netCashFlowRows}
                    margin={{ top: 4, right: 24, left: -6, bottom: 2 }}
                  >
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
                      <Line
                        type="monotone"
                        dataKey="netCashFlow"
                        name={t("dashboard.chartNetCashFlow")}
                        stroke="var(--color-netCashFlow)"
                        strokeWidth={2.25}
                        dot={{ r: 2.5 }}
                        activeDot={{ r: 4 }}
                      />
                    </LineChart>
                  </ChartContainer>
                </div>
              </>
            )}
            {netCashFlowRows.length === 0 ? (
              <p className="text-sm text-muted-foreground">{t("dashboard.chartNoNetCashFlowData")}</p>
            ) : null}
          </section>
        </div>

        <section className="min-w-0 grid grid-cols-1 gap-4 lg:grid-cols-2">
          <div className="min-w-0 space-y-2">
            <h2 className="text-base font-semibold">{t("dashboard.chartSpendingBreakdown")}</h2>
            {categorySlices.length === 0 ? (
              <p className="text-sm text-muted-foreground">{t("dashboard.chartNoSpendingCategories")}</p>
            ) : (
              <>
                <div className="hidden md:block">
                  <ChartContainer config={{ value: { label: t("dashboard.chartAmount"), color: DONUT_COLORS[0]! } }} className="h-[260px]">
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
                  <ChartContainer config={{ value: { label: t("dashboard.chartAmount"), color: DONUT_COLORS[0]! } }} className="h-[210px]">
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
                  <div className="space-y-1">
                    {categorySlices.slice(0, 4).map((slice, index) => (
                      <div
                        key={slice.label}
                        className="w-full flex items-center justify-between text-left text-xs text-muted-foreground"
                      >
                        <span className="inline-flex items-center gap-2 truncate">
                          <span
                            className="h-2.5 w-2.5 rounded-sm shrink-0"
                            style={{ backgroundColor: DONUT_COLORS[index % DONUT_COLORS.length] }}
                          />
                          {slice.label}
                        </span>
                        <span className="font-medium text-foreground">{formatCurrency(slice.value)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </>
            )}
          </div>

          <div className="min-w-0 space-y-2">
            <h2 className="text-base font-semibold">{t("dashboard.chartSharedVsIndividualSpending")}</h2>
            {ownerSlices.length === 0 ? (
              <p className="text-sm text-muted-foreground">{t("dashboard.chartNoOwnerSplitData")}</p>
            ) : (
              <>
                <div className="hidden md:block">
                  <ChartContainer config={{ value: { label: t("dashboard.chartAmount"), color: DONUT_COLORS[0]! } }} className="h-[260px]">
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
                  <ChartContainer config={{ value: { label: t("dashboard.chartAmount"), color: DONUT_COLORS[0]! } }} className="h-[210px]">
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
                  <div className="space-y-1">
                    {ownerSlices.map((slice, index) => (
                      <div
                        key={slice.key}
                        className="w-full flex items-center justify-between text-left text-xs text-muted-foreground"
                      >
                        <span className="inline-flex items-center gap-2 truncate">
                          <span
                            className="h-2.5 w-2.5 rounded-sm shrink-0"
                            style={{ backgroundColor: DONUT_COLORS[index % DONUT_COLORS.length] }}
                          />
                          {slice.label}
                        </span>
                        <span className="font-medium text-foreground">{formatCurrency(slice.value)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </>
            )}
          </div>
        </section>

        <section className="space-y-2">
          <h2 className="text-base font-semibold">{t("dashboard.sectionDebtSnapshot")}</h2>
          {debtRows.length === 0 ? (
            <p className="text-sm text-muted-foreground">{t("dashboard.sectionNoActiveDebts")}</p>
          ) : (
            <div className="divide-y border-t border-border">
              {debtRows.map((row, index) => (
                <div
                  key={row.id}
                  className={`w-full text-left px-2 py-4 ${index % 2 === 1 ? "bg-muted/30" : ""}`}
                >
                  <div className="flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <p className="font-medium truncate">{row.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {row.owner || t("common.noOwner")}
                      </p>
                    </div>
                    <p className="font-semibold">{formatCurrency(row.remaining)}</p>
                  </div>
                  <div className="mt-2 h-2 rounded bg-muted">
                    <div className="h-2 rounded bg-primary" style={{ width: `${Math.min(100, Math.max(0, row.progress * 100))}%` }} />
                  </div>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {formatCurrency(row.paid)} / {formatCurrency(row.initialAmount)}
                  </p>
                </div>
              ))}
            </div>
          )}
        </section>

        <section className="space-y-1">
          <h2 className="text-base font-semibold">{t("dashboard.sectionFixedObligationsMtd")}</h2>
          <p className="text-2xl font-semibold">{formatCurrency(fixedObligations)}</p>
          <p className="text-xs text-muted-foreground">{t("dashboard.sectionFixedObligationsHint")}</p>
        </section>

        <section className="space-y-2">
          <h2 className="text-base font-semibold">{t("dashboard.sectionRecentActivity")}</h2>
          {recentActivity.length === 0 ? (
            <p className="text-sm text-muted-foreground">{t("dashboard.sectionNoRecentTransactions")}</p>
          ) : (
            <div className="divide-y border-t border-border">
              {recentActivity.map((item, index) => (
                <div
                  key={item.id}
                  className={`w-full text-left px-2 py-4 ${index % 2 === 1 ? "bg-muted/30" : ""}`}
                >
                  <div className="flex items-center justify-between gap-3">
                    <p className="truncate font-medium">{item.description || "—"}</p>
                    <p className="font-semibold">{formatCurrency(item.amount)}</p>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {(item.category || t("common.uncategorized")) + " · " + (item.owner || t("common.noOwner"))}
                  </p>
                </div>
              ))}
            </div>
          )}
        </section>

        <section className="space-y-2 pb-4">
          <h2 className="text-base font-semibold">{t("dashboard.sectionSmartInsightsAlerts")}</h2>
          {insights.length === 0 ? (
            <p className="text-sm text-muted-foreground">{t("dashboard.sectionNoAlerts")}</p>
          ) : (
            <div className="space-y-2">
              {insights.map((insight) => (
                <div
                  key={insight.id}
                  className="flex items-start justify-between gap-3 border border-border/60 rounded-md px-3 py-2"
                >
                  <p className="text-sm">{t(insight.messageKey, insight.messageValues)}</p>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 px-2 text-xs"
                    onClick={() => dismissInsight(insight.id)}
                  >
                    {t("dashboard.dismiss")}
                  </Button>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
