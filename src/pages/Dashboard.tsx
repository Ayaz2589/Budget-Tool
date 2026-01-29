import { useState, useMemo } from "react";
import { Link } from "react-router-dom";
import { useBudget } from "@/context/BudgetContext";
import { getDebtBalance } from "@/lib/debtUtils";
import {
  computeAllTotals,
  computeGrandTotals,
  computeMonthTotals,
  getMonthLabel,
  type MonthTotals,
} from "@/lib/totals";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
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

function formatCurrency(n: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(n);
}

function formatPercent(n: number): string {
  return `${(n * 100).toFixed(1)}%`;
}

export function Dashboard() {
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

  const chartConfig = {
    earned: {
      label: "Total Earned",
      theme: {
        light: "oklch(0.55 0.2 160)",
        dark: "oklch(0.7 0.18 165)",
      },
    },
    spent: {
      label: "Total Spent",
      theme: {
        light: "oklch(0.72 0.18 55)",
        dark: "oklch(0.78 0.15 55)",
      },
    },
  } satisfies ChartConfig;

  // Selected month summary bar chart data (Earned, Spent, Saved)
  const summaryBarConfig = {
    earned: {
      label: "Earned",
      theme: { light: "oklch(0.55 0.2 160)", dark: "oklch(0.7 0.18 165)" },
    },
    spent: {
      label: "Spent",
      theme: { light: "oklch(0.72 0.18 55)", dark: "oklch(0.78 0.15 55)" },
    },
    saved: {
      label: "Saved",
      theme: { light: "oklch(0.6 0.2 160)", dark: "oklch(0.65 0.18 165)" },
    },
  } satisfies ChartConfig;

  const summaryBarData = useMemo(
    () => [
      {
        metric: "Earned",
        value: selectedMonth.totalEarned,
        fill: "var(--color-earned)",
      },
      {
        metric: "Spent",
        value: selectedMonth.totalSpent,
        fill: "var(--color-spent)",
      },
      {
        metric: "Saved",
        value: selectedMonth.totalSaved,
        fill: "var(--color-saved)",
      },
    ],
    [selectedMonth],
  );

  // Income category colors (Rent, Paycheck, Bonus, Other + fallback)
  const INCOME_CATEGORY_COLORS: Record<string, string> = {
    Rent: "oklch(0.6 0.18 145)",
    Paycheck: "oklch(0.65 0.2 160)",
    Bonus: "oklch(0.55 0.22 85)",
    Other: "oklch(0.6 0.15 280)",
  };
  const incomeBarConfig = {
    amount: {
      label: "Amount",
      theme: { light: "oklch(0.55 0.2 145)", dark: "oklch(0.65 0.18 145)" },
    },
  } satisfies ChartConfig;

  // Income by category for selected month (Rent, Paycheck, Bonus, Other)
  const incomeByCategory = useMemo(() => {
    const monthIncome = income.filter((i) =>
      i.date.startsWith(selectedMonthKey),
    );
    const byCategory = new Map<string, number>();
    for (const i of monthIncome) {
      const cat = (i.category || "Other").trim() || "Other";
      byCategory.set(cat, (byCategory.get(cat) ?? 0) + i.amount);
    }
    return Array.from(byCategory.entries())
      .map(([name, amount]) => ({
        name,
        amount,
        fill: INCOME_CATEGORY_COLORS[name] ?? "oklch(0.6 0.15 200)",
      }))
      .filter((d) => d.amount > 0)
      .sort((a, b) => b.amount - a.amount);
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

  // Debt summary: total remaining, total paid off, and chart (remaining vs paid off)
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
        metric: "Remaining balance",
        value: totalRemaining,
        fill: "var(--color-remaining)",
      },
      {
        metric: "Paid off",
        value: totalPaidOff,
        fill: "var(--color-paidOff)",
      },
    ];
    const hasDebtData = totalRemaining > 0 || totalPaidOff > 0;
    return {
      totalRemaining,
      totalPaidOff,
      totalDebt: totalRemaining + totalPaidOff,
      chartData,
      hasDebtData,
    };
  }, [debts, debtPayments]);

  const debtChartConfig = {
    remaining: {
      label: "Remaining balance",
      theme: {
        light: "oklch(0.55 0.18 35)",
        dark: "oklch(0.65 0.16 35)",
      },
    },
    paidOff: {
      label: "Paid off",
      theme: {
        light: "oklch(0.55 0.2 145)",
        dark: "oklch(0.65 0.18 145)",
      },
    },
  } satisfies ChartConfig;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Dashboard</h1>
      <div className="flex flex-wrap items-end gap-4">
        <div className="space-y-2">
          <Label>View month</Label>
          <Select value={selectedMonthKey} onValueChange={setSelectedMonthKey}>
            <SelectTrigger className="w-[200px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {monthOptions.map((key) => (
                <SelectItem key={key} value={key}>
                  {getMonthLabel(key)}
                  {key === currentMonthKey ? " (current)" : ""}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <p className="text-muted-foreground text-sm pb-2">
          {isCurrentMonth
            ? "Current month summary."
            : `Showing ${getMonthLabel(selectedMonthKey)}.`}{" "}
          Sync to Google Sheets from Settings.
        </p>
      </div>

      <Accordion
        type="multiple"
        defaultValue={["summary", "overview", "debt", "spending", "bymonth"]}
        className="rounded-lg border pt-4"
      >
        <AccordionItem value="summary">
          <AccordionTrigger className="px-4 py-4 text-lg font-semibold hover:no-underline data-[state=open]:border-b">
            Summary
          </AccordionTrigger>
          <AccordionContent className="px-4 pt-4 pb-4 space-y-6">
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    Total Earned
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <span className="text-2xl font-semibold">
                    {formatCurrency(selectedMonth.totalEarned)}
                  </span>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    Total Spent
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <span className="text-2xl font-semibold">
                    {formatCurrency(selectedMonth.totalSpent)}
                  </span>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    Total Spent w/o Mortgage
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <span className="text-2xl font-semibold">
                    {formatCurrency(selectedMonth.totalSpentWithoutMortgage)}
                  </span>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    50/50 Split
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <span className="text-2xl font-semibold">
                    {formatCurrency(selectedMonth.split5050)}
                  </span>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    Tasnuva&apos;s Total Spending
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <span className="text-2xl font-semibold">
                    {formatCurrency(selectedMonth.novasTotalSpending)}
                  </span>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    My Total Spending w/o Mortgage
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <span className="text-2xl font-semibold">
                    {formatCurrency(
                      selectedMonth.myTotalSpendingWithoutMortgage,
                    )}
                  </span>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    Total Saved
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <span className="text-2xl font-semibold">
                    {formatCurrency(selectedMonth.totalSaved)}
                  </span>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    Personal Savings Rate
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <span className="text-2xl font-semibold">
                    {formatPercent(selectedMonth.personalSavingsRate)}
                  </span>
                </CardContent>
              </Card>
            </div>
            <Card>
              <CardHeader>
                <CardTitle>All-time totals</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground text-sm">
                  Total Earned: {formatCurrency(grand.totalEarned)} · Total
                  Spent: {formatCurrency(grand.totalSpent)} · Total Saved:{" "}
                  {formatCurrency(grand.totalSaved)}
                </p>
              </CardContent>
            </Card>
          </AccordionContent>
        </AccordionItem>
        <AccordionItem value="overview">
          <AccordionTrigger className="px-4 py-4 text-lg font-semibold hover:no-underline data-[state=open]:border-b">
            Overview
          </AccordionTrigger>
          <AccordionContent className="px-4 pt-4 pb-4 space-y-6">
            <div className="grid gap-4 lg:grid-cols-2">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    Earned vs Spent vs Saved
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
                      No data for this month.
                    </p>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    Spending breakdown
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
                      No spending for this month.
                    </p>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    Income breakdown
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {incomeByCategory.length > 0 ? (
                    <ChartContainer
                      config={incomeBarConfig}
                      className="h-[220px] w-full"
                    >
                      <BarChart
                        data={incomeByCategory}
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
                          radius={[0, 4, 4, 0]}
                          maxBarSize={28}
                        >
                          {incomeByCategory.map((_, i) => (
                            <Cell key={i} fill={incomeByCategory[i]!.fill} />
                          ))}
                        </Bar>
                      </BarChart>
                    </ChartContainer>
                  ) : (
                    <p className="text-sm text-muted-foreground py-8 text-center">
                      No income for this month.
                    </p>
                  )}
                </CardContent>
              </Card>
            </div>
          </AccordionContent>
        </AccordionItem>
        <AccordionItem value="debt">
          <AccordionTrigger className="px-4 py-4 text-lg font-semibold hover:no-underline data-[state=open]:border-b">
            Debt
          </AccordionTrigger>
          <AccordionContent className="px-4 pt-4 pb-4 space-y-6">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Total debt: remaining vs paid off
                </CardTitle>
                <p className="text-xs text-muted-foreground">
                  Remaining balance (what you still owe) and total paid off
                  across all debts.{" "}
                  <Link
                    to="/debt"
                    className="font-medium text-primary hover:underline"
                  >
                    View & manage debt →
                  </Link>
                </p>
              </CardHeader>
              <CardContent>
                {debtSummary.hasDebtData ? (
                  <>
                    <div className="flex flex-wrap items-baseline gap-4 mb-4">
                      <span className="text-muted-foreground text-sm">
                        Total: {formatCurrency(debtSummary.totalDebt)}
                      </span>
                      <span className="text-sm">
                        Remaining:{" "}
                        <span className="font-semibold">
                          {formatCurrency(debtSummary.totalRemaining)}
                        </span>
                      </span>
                      <span className="text-sm">
                        Paid off:{" "}
                        <span className="font-semibold text-green-600 dark:text-green-500">
                          {formatCurrency(debtSummary.totalPaidOff)}
                        </span>
                      </span>
                    </div>
                    <ChartContainer
                      config={debtChartConfig}
                      className="h-[180px] w-full"
                    >
                      <BarChart
                        data={debtSummary.chartData}
                        layout="vertical"
                        margin={{ top: 5, right: 10, left: 100, bottom: 5 }}
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
                          width={95}
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
                          maxBarSize={32}
                        >
                          {debtSummary.chartData.map((_, i) => (
                            <Cell
                              key={i}
                              fill={debtSummary.chartData[i]!.fill}
                            />
                          ))}
                        </Bar>
                      </BarChart>
                    </ChartContainer>
                  </>
                ) : (
                  <p className="text-sm text-muted-foreground py-6 text-center">
                    No debt yet.{" "}
                    <Link
                      to="/debt"
                      className="font-medium text-primary hover:underline"
                    >
                      Add a debt
                    </Link>
                  </p>
                )}
              </CardContent>
            </Card>
          </AccordionContent>
        </AccordionItem>
        <AccordionItem value="spending">
          <AccordionTrigger className="px-4 py-4 text-lg font-semibold hover:no-underline data-[state=open]:border-b">
            Spending by type
          </AccordionTrigger>
          <AccordionContent className="px-4 pt-4 pb-4 space-y-6">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  50/50 spend by type
                </CardTitle>
                <p className="text-xs text-muted-foreground">
                  Expenses in 50/50 category for the selected month, grouped by
                  description. Top 15 shown.
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
                    No 50/50 expenses for this month.
                  </p>
                )}
              </CardContent>
            </Card>

            <div className="grid gap-4 lg:grid-cols-2">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    My spending by type
                  </CardTitle>
                  <p className="text-xs text-muted-foreground">
                    Your expenses (excluding Tasnuva&apos;s Purchases, 50/50 &
                    Mortgage) for the selected month. Top 15 shown.
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
                      No expenses for this month.
                    </p>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    Tasnuva&apos;s spending by type
                  </CardTitle>
                  <p className="text-xs text-muted-foreground">
                    Tasnuva&apos;s Purchases only for the selected month. Top 15
                    shown.
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
                      No expenses for this month.
                    </p>
                  )}
                </CardContent>
              </Card>
            </div>
          </AccordionContent>
        </AccordionItem>
        <AccordionItem value="bymonth">
          <AccordionTrigger className="px-4 py-4 text-lg font-semibold hover:no-underline data-[state=open]:border-b">
            By month
          </AccordionTrigger>
          <AccordionContent className="px-4 pt-4 pb-4 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Monthly breakdown</CardTitle>
                <p className="text-sm text-muted-foreground">
                  Total earned vs total spent by month.
                </p>
              </CardHeader>
              <CardContent>
                {chartData.length > 0 ? (
                  <ChartContainer
                    config={chartConfig}
                    className="h-[300px] w-full"
                  >
                    <BarChart
                      data={chartData}
                      margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
                      accessibilityLayer
                    >
                      <CartesianGrid strokeDasharray="3 3" vertical={false} />
                      <XAxis
                        dataKey="month"
                        tickLine={false}
                        tickMargin={10}
                        axisLine={false}
                      />
                      <YAxis
                        tickLine={false}
                        axisLine={false}
                        tickFormatter={(v) =>
                          v >= 1000 ? `$${v / 1000}k` : `$${v}`
                        }
                      />
                      <ChartTooltip
                        content={
                          <ChartTooltipContent
                            formatter={(
                              value,
                              name,
                              item: { fill?: string },
                            ) => (
                              <div className="flex w-full flex-wrap items-center gap-2">
                                <div
                                  className="h-2.5 w-2.5 shrink-0 rounded-[2px]"
                                  style={{ backgroundColor: item?.fill }}
                                />
                                <div className="flex flex-1 justify-between leading-none items-center gap-2">
                                  <span className="text-muted-foreground">
                                    {chartConfig[
                                      name as keyof typeof chartConfig
                                    ]?.label ?? name}
                                  </span>
                                  <span className="text-foreground font-mono font-medium tabular-nums">
                                    {typeof value === "number"
                                      ? formatCurrency(value)
                                      : String(value ?? "")}
                                  </span>
                                </div>
                              </div>
                            )}
                          />
                        }
                      />
                      <ChartLegend content={<ChartLegendContent />} />
                      <Bar
                        dataKey="earned"
                        fill="var(--color-earned)"
                        radius={[4, 4, 0, 0]}
                      />
                      <Bar
                        dataKey="spent"
                        fill="var(--color-spent)"
                        radius={[4, 4, 0, 0]}
                      />
                    </BarChart>
                  </ChartContainer>
                ) : (
                  <p className="text-sm text-muted-foreground py-8 text-center">
                    No data yet. Add income or expenses to see the chart.
                  </p>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Spending by month</CardTitle>
                <p className="text-sm text-muted-foreground">
                  Totals for each month. Current month is highlighted.
                </p>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Month</TableHead>
                        <TableHead className="text-right">
                          Total Earned
                        </TableHead>
                        <TableHead className="text-right">
                          Total Spent
                        </TableHead>
                        <TableHead className="text-right">
                          Spent w/o Mortgage
                        </TableHead>
                        <TableHead className="text-right">
                          Total Saved
                        </TableHead>
                        <TableHead className="text-right">
                          Savings Rate
                        </TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {months.map((m: MonthTotals) => (
                        <TableRow
                          key={m.monthKey}
                          className={
                            m.monthKey === currentMonthKey
                              ? "bg-primary/10 font-medium"
                              : undefined
                          }
                        >
                          <TableCell className="font-medium">
                            {m.monthLabel}
                          </TableCell>
                          <TableCell className="text-right">
                            {formatCurrency(m.totalEarned)}
                          </TableCell>
                          <TableCell className="text-right">
                            {formatCurrency(m.totalSpent)}
                          </TableCell>
                          <TableCell className="text-right">
                            {formatCurrency(m.totalSpentWithoutMortgage)}
                          </TableCell>
                          <TableCell className="text-right">
                            {formatCurrency(m.totalSaved)}
                          </TableCell>
                          <TableCell className="text-right">
                            {formatPercent(m.personalSavingsRate)}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </div>
  );
}
