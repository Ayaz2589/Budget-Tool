import { useState, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { useBudget } from "@/context/BudgetContext";
import { getDebtBalance } from "@/lib/debtUtils";
import {
  computeAllTotals,
  computeGrandTotals,
  computeMonthTotals,
  getMonthLabel,
  type MonthTotals,
} from "@/lib/totals";
import { DEFAULT_INCOME_CATEGORIES } from "@/lib/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent,
  type ChartConfig,
} from "@/components/ui/chart";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { formatCurrency } from "@/lib/format";
import { SummaryCards } from "@/pages/dashboard/SummaryCards";
import { DebtSection } from "@/pages/dashboard/DebtSection";
import { ByMonthSection } from "@/pages/dashboard/ByMonthSection";

export function Dashboard() {
  const { t } = useTranslation();
  const { expenses, income, iOweNova, debts, debtPayments } = useBudget();
  const months = computeAllTotals({
    expenses,
    income,
    iOweNovaByMonth: iOweNova,
  });
  const grand = computeGrandTotals(months);
  const currentMonthKey = new Date().toISOString().slice(0, 7);

  const monthOptions = useMemo(() => {
    const keys = new Set<string>([
      currentMonthKey,
      ...months.map((m) => m.monthKey),
    ]);
    return Array.from(keys).sort().reverse();
  }, [currentMonthKey, months]);

  const [selectedMonthKey, setSelectedMonthKey] = useState(currentMonthKey);

  const selectedMonth = useMemo((): MonthTotals => {
    const found = months.find((m) => m.monthKey === selectedMonthKey);
    if (found) return found;
    return computeMonthTotals(
      selectedMonthKey,
      expenses,
      income,
      iOweNova[selectedMonthKey] ?? 0,
      0,
      0,
    );
  }, [months, selectedMonthKey, expenses, income, iOweNova]);

  const isCurrentMonth = selectedMonthKey === currentMonthKey;

  const chartData = useMemo(
    () =>
      [...months].reverse().map((m) => ({
        month: m.monthLabel,
        earned: m.totalEarned,
        spent: m.totalSpent,
      })),
    [months],
  );

  // Selected month summary bar chart data (Earned, Spent, Saved)
  const summaryBarConfig = {
    earned: {
      label: t("dashboard.earned"),
      theme: { light: "oklch(0.55 0.2 160)", dark: "oklch(0.7 0.18 165)" },
    },
    spent: {
      label: t("dashboard.spent"),
      theme: { light: "oklch(0.72 0.18 55)", dark: "oklch(0.78 0.15 55)" },
    },
    saved: {
      label: t("dashboard.saved"),
      theme: { light: "oklch(0.6 0.2 160)", dark: "oklch(0.65 0.18 165)" },
    },
  } satisfies ChartConfig;

  const summaryBarData = useMemo(
    () => [
      {
        metric: t("dashboard.earned"),
        value: selectedMonth.totalEarned,
        fill: "var(--color-earned)",
      },
      {
        metric: t("dashboard.spent"),
        value: selectedMonth.totalSpent,
        fill: "var(--color-spent)",
      },
      {
        metric: t("dashboard.saved"),
        value: selectedMonth.totalSaved,
        fill: "var(--color-saved)",
      },
    ],
    [selectedMonth, t],
  );

  // Income by person, stacked by type (Rent, Paycheck, Bonus, Other, etc.) for selected month
  const INCOME_CATEGORY_COLORS: Record<string, string> = {
    Rent: "oklch(0.6 0.18 145)",
    Paycheck: "oklch(0.65 0.2 160)",
    Bonus: "oklch(0.55 0.22 85)",
    Other: "oklch(0.6 0.15 280)",
  };
  const defaultCategoryOrder: string[] = [...DEFAULT_INCOME_CATEGORIES];

  const { incomeStackedBarData, incomeCategoryKeys, incomeStackedBarConfig } =
    useMemo(() => {
      const monthIncome = income.filter((i) =>
        i.date.startsWith(selectedMonthKey),
      );
      const byPersonByCat = new Map<string, Map<string, number>>();
      const categorySet = new Set<string>(defaultCategoryOrder);
      for (const i of monthIncome) {
        const person = i.owner === "Tasnuva" ? "Tasnuva" : "Ayaz";
        const cat = (i.category || "Other").trim() || "Other";
        categorySet.add(cat);
        if (!byPersonByCat.has(person)) {
          byPersonByCat.set(person, new Map());
        }
        const catMap = byPersonByCat.get(person)!;
        catMap.set(cat, (catMap.get(cat) ?? 0) + i.amount);
      }
      const categoryKeys = Array.from(categorySet);
      categoryKeys.sort((a: string, b: string) => {
        const ai = defaultCategoryOrder.indexOf(a);
        const bi = defaultCategoryOrder.indexOf(b);
        if (ai >= 0 && bi >= 0) return ai - bi;
        if (ai >= 0) return -1;
        if (bi >= 0) return 1;
        return a.localeCompare(b);
      });

      const rows: { name: string; [cat: string]: string | number }[] = [];
      for (const person of ["Ayaz", "Tasnuva"]) {
        const catMap = byPersonByCat.get(person) ?? new Map();
        const row: { name: string; [cat: string]: string | number } = {
          name: person,
        };
        let hasAny = false;
        for (const cat of categoryKeys) {
          const amt = catMap.get(cat) ?? 0;
          row[cat] = amt;
          if (amt > 0) hasAny = true;
        }
        if (hasAny) rows.push(row);
      }

      const config: ChartConfig = {};
      for (const cat of categoryKeys) {
        config[cat] = {
          label: cat,
          theme: {
            light: INCOME_CATEGORY_COLORS[cat] ?? "oklch(0.6 0.15 200)",
            dark: INCOME_CATEGORY_COLORS[cat] ?? "oklch(0.65 0.14 200)",
          },
        };
      }

      return {
        incomeStackedBarData: rows,
        incomeCategoryKeys: categoryKeys,
        incomeStackedBarConfig: config,
      };
    }, [income, selectedMonthKey]);

  // Spending breakdown pie (50/50, Tasnuva's, My) — excludes Mortgage
  const spendingPieData = useMemo(() => {
    const fiftyFifty = selectedMonth.total5050Spent;
    const tasnuvas = selectedMonth.novasPurchase;
    const mySpending =
      selectedMonth.myTotalSpendingWithoutMortgage - selectedMonth.split5050;
    return [
      ...(fiftyFifty > 0 ? [{ name: "50/50", value: fiftyFifty }] : []),
      ...(tasnuvas > 0 ? [{ name: "Tasnuva's", value: tasnuvas }] : []),
      ...(mySpending > 0 ? [{ name: "My", value: mySpending }] : []),
    ];
  }, [selectedMonth]);

  const PIE_COLORS = [
    "oklch(0.65 0.2 25)",
    "oklch(0.7 0.18 55)",
    "oklch(0.65 0.2 280)",
    "oklch(0.6 0.2 160)",
  ];

  // Normalize description for grouping (merge "UBER EATS" / "Uber Eats")
  const normalizeDescKey = (s: string) =>
    (s || "").trim().toLowerCase().replace(/\s+/g, " ") || "other";

  // Strip leading digits and period for display (e.g. "460010. Bahamä" -> "Bahamä")
  const cleanDisplayName = (s: string) =>
    (s || "")
      .trim()
      .replace(/^\d+\.\s*/, "")
      .replace(/\s+/g, " ") || "Other";

  // 50/50 spend by type (description) for selected month — normalized and cleaned
  const fiftyFiftyByType = useMemo(() => {
    const monthExpenses = expenses.filter(
      (e) => e.date.startsWith(selectedMonthKey) && e.category === "50/50",
    );
    const byKey = new Map<string, { amount: number; display: string }>();
    for (const e of monthExpenses) {
      const raw = (e.description || "").trim() || "Other";
      const key = normalizeDescKey(raw);
      const existing = byKey.get(key);
      const display = cleanDisplayName(raw);
      if (!existing) {
        byKey.set(key, { amount: e.amount, display });
      } else {
        existing.amount += e.amount;
        if (display.length > existing.display.length) {
          existing.display = display;
        }
      }
    }
    return Array.from(byKey.values())
      .map(({ display, amount }) => ({ name: display, amount }))
      .sort((a, b) => b.amount - a.amount)
      .slice(0, 15);
  }, [expenses, selectedMonthKey]);

  // Distinct colors per spend-by-type chart
  const fiftyFiftyChartConfig = {
    amount: {
      label: "Amount",
      theme: { light: "oklch(0.65 0.18 85)", dark: "oklch(0.72 0.16 85)" }, // amber
    },
  } satisfies ChartConfig;

  const mySpendingChartConfig = {
    amount: {
      label: "Amount",
      theme: { light: "oklch(0.55 0.2 220)", dark: "oklch(0.65 0.18 220)" }, // blue
    },
  } satisfies ChartConfig;

  const tasnuvasSpendingChartConfig = {
    amount: {
      label: "Amount",
      theme: { light: "oklch(0.65 0.2 350)", dark: "oklch(0.72 0.18 350)" }, // rose/pink
    },
  } satisfies ChartConfig;

  // Build "by type" bar data from filtered expenses (normalize + clean + top 15)
  const buildSpendingByType = (
    monthExpenses: { description?: string; amount: number }[],
  ) => {
    const byKey = new Map<string, { amount: number; display: string }>();
    for (const e of monthExpenses) {
      const raw = (e.description || "").trim() || "Other";
      const key = normalizeDescKey(raw);
      const existing = byKey.get(key);
      const display = cleanDisplayName(raw);
      if (!existing) {
        byKey.set(key, { amount: e.amount, display });
      } else {
        existing.amount += e.amount;
        if (display.length > existing.display.length) {
          existing.display = display;
        }
      }
    }
    return Array.from(byKey.values())
      .map(({ display, amount }) => ({ name: display, amount }))
      .sort((a, b) => b.amount - a.amount)
      .slice(0, 15);
  };

  // My (Ayaz) spending by type — selected month, exclude Tasnuva's Purchases, 50/50 & Mortgage
  const mySpendingByType = useMemo(() => {
    const monthExpenses = expenses.filter(
      (e) =>
        e.date.startsWith(selectedMonthKey) &&
        e.category !== "Tasnuva's Purchases" &&
        e.category !== "50/50" &&
        e.category !== "Mortgage",
    );
    return buildSpendingByType(monthExpenses);
  }, [expenses, selectedMonthKey]);

  // Tasnuva's spending by type — selected month, Tasnuva's Purchases only (no 50/50)
  const tasnuvasSpendingByType = useMemo(() => {
    const monthExpenses = expenses.filter(
      (e) =>
        e.date.startsWith(selectedMonthKey) &&
        e.category === "Tasnuva's Purchases",
    );
    return buildSpendingByType(monthExpenses);
  }, [expenses, selectedMonthKey]);

  // Debt summary: remaining vs paid off (chart only; no "total" displayed)
  const debtSummary = useMemo(() => {
    const withBalance = debts.map((debt) => ({
      debt,
      balance: getDebtBalance(debt, debtPayments),
    }));
    const totalRemaining = withBalance.reduce(
      (sum, { balance }) => sum + balance,
      0,
    );
    const totalPaidOff = debtPayments.reduce((sum, p) => sum + p.amount, 0);
    const chartData = [
      {
        metric: t("dashboardDebt.remaining"),
        value: totalRemaining,
        fill: "var(--color-remaining)",
      },
      {
        metric: t("dashboardDebt.paidOff"),
        value: totalPaidOff,
        fill: "var(--color-paidOff)",
      },
    ];
    const hasDebtData = totalRemaining > 0 || totalPaidOff > 0;
    return {
      totalRemaining,
      totalPaidOff,
      chartData,
      hasDebtData,
    };
  }, [debts, debtPayments, t]);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">{t("dashboard.title")}</h1>
      <div className="flex flex-wrap items-end gap-4">
        <div className="space-y-2">
          <Label>{t("dashboard.viewMonth")}</Label>
          <Select value={selectedMonthKey} onValueChange={setSelectedMonthKey}>
            <SelectTrigger className="w-[200px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {monthOptions.map((key) => (
                <SelectItem key={key} value={key}>
                  {getMonthLabel(key)}
                  {key === currentMonthKey ? ` (${t("common.current")})` : ""}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <p className="text-muted-foreground text-sm pb-2">
          {isCurrentMonth
            ? t("dashboard.currentMonthSummary")
            : t("dashboard.showingMonth", {
                month: getMonthLabel(selectedMonthKey),
              })}{" "}
          {t("dashboard.syncFromSettings")}
        </p>
      </div>

      <Accordion
        type="multiple"
        defaultValue={["summary", "overview", "debt", "spending", "bymonth"]}
        className="rounded-lg border pt-4"
      >
        <AccordionItem value="summary">
          <AccordionTrigger className="px-4 py-4 text-lg font-semibold hover:no-underline data-[state=open]:border-b">
            {t("dashboard.summary")}
          </AccordionTrigger>
          <AccordionContent className="px-4 pt-4 pb-4 space-y-6">
            <SummaryCards selectedMonth={selectedMonth} grand={grand} />
          </AccordionContent>
        </AccordionItem>
        <AccordionItem value="overview">
          <AccordionTrigger className="px-4 py-4 text-lg font-semibold hover:no-underline data-[state=open]:border-b">
            {t("dashboard.overview")}
          </AccordionTrigger>
          <AccordionContent className="px-4 pt-4 pb-4 space-y-6">
            <div className="grid gap-4 lg:grid-cols-2">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    {t("dashboard.earnedVsSpentVsSaved")}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {summaryBarData.some((d) => d.value > 0) ? (
                    <ChartContainer
                      config={summaryBarConfig}
                      className="h-[220px] w-full"
                    >
                      <BarChart
                        data={summaryBarData}
                        layout="vertical"
                        margin={{ top: 5, right: 10, left: 60, bottom: 5 }}
                        accessibilityLayer
                      >
                        <XAxis
                          type="number"
                          tickLine={false}
                          axisLine={false}
                          tickFormatter={(v) => formatCurrency(v)}
                        />
                        <YAxis
                          type="category"
                          dataKey="metric"
                          tickLine={false}
                          axisLine={false}
                          width={55}
                          tick={{ fontSize: 11 }}
                        />
                        <ChartTooltip
                          content={
                            <ChartTooltipContent
                              formatter={(value) =>
                                typeof value === "number"
                                  ? formatCurrency(value)
                                  : String(value ?? "")
                              }
                            />
                          }
                        />
                        <Bar
                          dataKey="value"
                          radius={[0, 4, 4, 0]}
                          maxBarSize={28}
                        >
                          {summaryBarData.map((_, i) => (
                            <Cell key={i} fill={summaryBarData[i]!.fill} />
                          ))}
                        </Bar>
                      </BarChart>
                    </ChartContainer>
                  ) : (
                    <p className="text-sm text-muted-foreground py-8 text-center">
                      {t("dashboard.noDataForMonth")}
                    </p>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    {t("dashboard.spendingBreakdown")}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {spendingPieData.length > 0 ? (
                    <ChartContainer
                      config={{
                        "50/50": {
                          label: "50/50",
                          theme: { light: PIE_COLORS[0], dark: PIE_COLORS[0] },
                        },
                        "Tasnuva's": {
                          label: "Tasnuva's",
                          theme: { light: PIE_COLORS[1], dark: PIE_COLORS[1] },
                        },
                        My: {
                          label: "My",
                          theme: { light: PIE_COLORS[2], dark: PIE_COLORS[2] },
                        },
                      }}
                      className="h-[220px] w-full"
                    >
                      <PieChart>
                        <ChartTooltip
                          content={
                            <ChartTooltipContent
                              formatter={(value) =>
                                typeof value === "number"
                                  ? formatCurrency(value)
                                  : String(value ?? "")
                              }
                            />
                          }
                        />
                        <Pie
                          data={spendingPieData}
                          dataKey="value"
                          nameKey="name"
                          cx="50%"
                          cy="50%"
                          innerRadius={50}
                          outerRadius={80}
                          paddingAngle={2}
                        >
                          {spendingPieData.map((_, i) => (
                            <Cell
                              key={i}
                              fill={PIE_COLORS[i % PIE_COLORS.length]}
                            />
                          ))}
                        </Pie>
                        <Legend />
                      </PieChart>
                    </ChartContainer>
                  ) : (
                    <p className="text-sm text-muted-foreground py-8 text-center">
                      {t("dashboard.noSpendingForMonth")}
                    </p>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    {t("dashboard.incomeBreakdown")}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {incomeStackedBarData.length > 0 ? (
                    <ChartContainer
                      config={incomeStackedBarConfig}
                      className="h-[220px] w-full"
                    >
                      <BarChart
                        data={incomeStackedBarData}
                        layout="vertical"
                        margin={{ top: 5, right: 10, left: 80, bottom: 5 }}
                        accessibilityLayer
                      >
                        <XAxis
                          type="number"
                          tickLine={false}
                          axisLine={false}
                          tickFormatter={(v) => formatCurrency(v)}
                        />
                        <YAxis
                          type="category"
                          dataKey="name"
                          tickLine={false}
                          axisLine={false}
                          width={76}
                          tick={{ fontSize: 11 }}
                        />
                        <ChartTooltip
                          content={
                            <ChartTooltipContent
                              labelFormatter={(_, payload) =>
                                payload?.[0]?.payload?.name ?? ""
                              }
                              formatter={(value, name) => (
                                <div className="flex w-full items-center justify-between gap-4">
                                  <span className="text-muted-foreground">
                                    {String(name)}
                                  </span>
                                  <span>
                                    {typeof value === "number"
                                      ? formatCurrency(value)
                                      : String(value ?? "")}
                                  </span>
                                </div>
                              )}
                            />
                          }
                        />
                        <ChartLegend content={<ChartLegendContent />} />
                        {incomeCategoryKeys.map((cat, idx) => (
                          <Bar
                            key={cat}
                            dataKey={cat}
                            stackId="income"
                            radius={
                              idx === incomeCategoryKeys.length - 1
                                ? [0, 4, 4, 0]
                                : 0
                            }
                            maxBarSize={36}
                            fill={
                              INCOME_CATEGORY_COLORS[cat] ??
                              "oklch(0.6 0.15 200)"
                            }
                          />
                        ))}
                      </BarChart>
                    </ChartContainer>
                  ) : (
                    <p className="text-sm text-muted-foreground py-8 text-center">
                      {t("dashboard.noIncomeForMonth")}
                    </p>
                  )}
                </CardContent>
              </Card>
            </div>
          </AccordionContent>
        </AccordionItem>
        <AccordionItem value="debt">
          <AccordionTrigger className="px-4 py-4 text-lg font-semibold hover:no-underline data-[state=open]:border-b">
            {t("dashboard.debt")}
          </AccordionTrigger>
          <AccordionContent className="px-4 pt-4 pb-4 space-y-6">
            <DebtSection debtSummary={debtSummary} />
          </AccordionContent>
        </AccordionItem>
        <AccordionItem value="spending">
          <AccordionTrigger className="px-4 py-4 text-lg font-semibold hover:no-underline data-[state=open]:border-b">
            {t("dashboard.spendingByType")}
          </AccordionTrigger>
          <AccordionContent className="px-4 pt-4 pb-4 space-y-6">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  {t("dashboard.fiftyFiftySpendByType")}
                </CardTitle>
                <p className="text-xs text-muted-foreground">
                  {t("dashboard.fiftyFiftyExpensesInCategory")}
                </p>
              </CardHeader>
              <CardContent>
                {fiftyFiftyByType.length > 0 ? (
                  <ChartContainer
                    config={fiftyFiftyChartConfig}
                    className="h-[480px] w-full"
                  >
                    <BarChart
                      data={fiftyFiftyByType}
                      layout="vertical"
                      margin={{ top: 5, right: 24, left: 0, bottom: 5 }}
                      barCategoryGap="20%"
                      accessibilityLayer
                    >
                      <CartesianGrid
                        strokeDasharray="3 3"
                        horizontal
                        vertical
                      />
                      <XAxis
                        type="number"
                        tickLine={false}
                        axisLine={false}
                        tickFormatter={(v) => formatCurrency(v)}
                      />
                      <YAxis
                        type="category"
                        dataKey="name"
                        tickLine={false}
                        axisLine={false}
                        width={240}
                        tick={{ fontSize: 11 }}
                        tickFormatter={(v) =>
                          v.length > 52 ? `${v.slice(0, 50)}…` : v
                        }
                      />
                      <ChartTooltip
                        content={
                          <ChartTooltipContent
                            labelFormatter={(_, payload) =>
                              payload?.[0]?.payload?.name ?? ""
                            }
                            formatter={(value) =>
                              typeof value === "number"
                                ? formatCurrency(value)
                                : String(value ?? "")
                            }
                          />
                        }
                      />
                      <Bar
                        dataKey="amount"
                        fill="var(--color-amount)"
                        radius={[0, 4, 4, 0]}
                        maxBarSize={16}
                      />
                    </BarChart>
                  </ChartContainer>
                ) : (
                  <p className="text-sm text-muted-foreground py-8 text-center">
                    {t("dashboard.no5050Expenses")}
                  </p>
                )}
              </CardContent>
            </Card>

            <div className="grid gap-4 lg:grid-cols-2">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    {t("dashboard.mySpendingByType")}
                  </CardTitle>
                  <p className="text-xs text-muted-foreground">
                    {t("dashboard.myExpensesExcluding")}
                  </p>
                </CardHeader>
                <CardContent>
                  {mySpendingByType.length > 0 ? (
                    <ChartContainer
                      config={mySpendingChartConfig}
                      className="h-[480px] w-full"
                    >
                      <BarChart
                        data={mySpendingByType}
                        layout="vertical"
                        margin={{ top: 5, right: 24, left: 0, bottom: 5 }}
                        barCategoryGap="20%"
                        accessibilityLayer
                      >
                        <CartesianGrid
                          strokeDasharray="3 3"
                          horizontal
                          vertical
                        />
                        <XAxis
                          type="number"
                          tickLine={false}
                          axisLine={false}
                          tickFormatter={(v) => formatCurrency(v)}
                        />
                        <YAxis
                          type="category"
                          dataKey="name"
                          tickLine={false}
                          axisLine={false}
                          width={240}
                          tick={{ fontSize: 11 }}
                          tickFormatter={(v) =>
                            v.length > 52 ? `${v.slice(0, 50)}…` : v
                          }
                        />
                        <ChartTooltip
                          content={
                            <ChartTooltipContent
                              labelFormatter={(_, payload) =>
                                payload?.[0]?.payload?.name ?? ""
                              }
                              formatter={(value) =>
                                typeof value === "number"
                                  ? formatCurrency(value)
                                  : String(value ?? "")
                              }
                            />
                          }
                        />
                        <Bar
                          dataKey="amount"
                          fill="var(--color-amount)"
                          radius={[0, 4, 4, 0]}
                          maxBarSize={16}
                        />
                      </BarChart>
                    </ChartContainer>
                  ) : (
                    <p className="text-sm text-muted-foreground py-8 text-center">
                      {t("dashboard.noExpensesForMonth")}
                    </p>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    {t("dashboard.tasnuvasSpendingByType")}
                  </CardTitle>
                  <p className="text-xs text-muted-foreground">
                    {t("dashboard.tasnuvasOnly")}
                  </p>
                </CardHeader>
                <CardContent>
                  {tasnuvasSpendingByType.length > 0 ? (
                    <ChartContainer
                      config={tasnuvasSpendingChartConfig}
                      className="h-[480px] w-full"
                    >
                      <BarChart
                        data={tasnuvasSpendingByType}
                        layout="vertical"
                        margin={{ top: 5, right: 24, left: 0, bottom: 5 }}
                        barCategoryGap="20%"
                        accessibilityLayer
                      >
                        <CartesianGrid
                          strokeDasharray="3 3"
                          horizontal
                          vertical
                        />
                        <XAxis
                          type="number"
                          tickLine={false}
                          axisLine={false}
                          tickFormatter={(v) => formatCurrency(v)}
                        />
                        <YAxis
                          type="category"
                          dataKey="name"
                          tickLine={false}
                          axisLine={false}
                          width={240}
                          tick={{ fontSize: 11 }}
                          tickFormatter={(v) =>
                            v.length > 52 ? `${v.slice(0, 50)}…` : v
                          }
                        />
                        <ChartTooltip
                          content={
                            <ChartTooltipContent
                              labelFormatter={(_, payload) =>
                                payload?.[0]?.payload?.name ?? ""
                              }
                              formatter={(value) =>
                                typeof value === "number"
                                  ? formatCurrency(value)
                                  : String(value ?? "")
                              }
                            />
                          }
                        />
                        <Bar
                          dataKey="amount"
                          fill="var(--color-amount)"
                          radius={[0, 4, 4, 0]}
                          maxBarSize={16}
                        />
                      </BarChart>
                    </ChartContainer>
                  ) : (
                    <p className="text-sm text-muted-foreground py-8 text-center">
                      {t("dashboard.noExpensesForMonth")}
                    </p>
                  )}
                </CardContent>
              </Card>
            </div>
          </AccordionContent>
        </AccordionItem>
        <AccordionItem value="bymonth">
          <AccordionTrigger className="px-4 py-4 text-lg font-semibold hover:no-underline data-[state=open]:border-b">
            {t("dashboard.byMonth")}
          </AccordionTrigger>
          <AccordionContent className="px-4 pt-4 pb-4 space-y-6">
            <ByMonthSection
              chartData={chartData}
              months={months}
              currentMonthKey={currentMonthKey}
            />
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </div>
  );
}
