import { useState, useMemo } from "react";
import { useBudget } from "@/context/BudgetContext";
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
  RadialBarChart,
  RadialBar,
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
  const { expenses, income, iOweNova } = useBudget();
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

  // Selected month summary bar chart data (Earned, Spent, Spent w/o Mortgage, Saved)
  const summaryBarConfig = {
    earned: {
      label: "Earned",
      theme: { light: "oklch(0.55 0.2 160)", dark: "oklch(0.7 0.18 165)" },
    },
    spent: {
      label: "Spent",
      theme: { light: "oklch(0.72 0.18 55)", dark: "oklch(0.78 0.15 55)" },
    },
    spentWoMtg: {
      label: "Spent w/o Mtg",
      theme: { light: "oklch(0.75 0.15 45)", dark: "oklch(0.8 0.12 45)" },
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
        metric: "Spent w/o Mtg",
        value: selectedMonth.totalSpentWithoutMortgage,
        fill: "var(--color-spentWoMtg)",
      },
      {
        metric: "Saved",
        value: selectedMonth.totalSaved,
        fill: "var(--color-saved)",
      },
    ],
    [selectedMonth],
  );

  // Spending breakdown pie (Mortgage, 50/50, Tasnuva's, My)
  const spendingPieData = useMemo(() => {
    const mortgage =
      selectedMonth.totalSpent - selectedMonth.totalSpentWithoutMortgage;
    const fiftyFifty = selectedMonth.total5050Spent;
    const tasnuvas = selectedMonth.novasPurchase;
    const mySpending =
      selectedMonth.myTotalSpendingWithoutMortgage - selectedMonth.split5050;
    return [
      ...(mortgage > 0 ? [{ name: "Mortgage", value: mortgage }] : []),
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

  const savingsRatePercent = selectedMonth.personalSavingsRate * 100;
  const savingsRadialData = useMemo(
    () => [
      {
        name: "Savings rate",
        value: savingsRatePercent,
        fill: "var(--color-savings)",
      },
    ],
    [savingsRatePercent],
  );
  const savingsConfig = {
    savings: {
      label: "Savings rate",
      theme: { light: "oklch(0.6 0.2 160)", dark: "oklch(0.7 0.18 165)" },
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

      {/* Chart visualizations for selected month */}
      <div className="grid gap-4 lg:grid-cols-3">
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
                  <XAxis type="number" hide />
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
                  <Bar dataKey="value" radius={[0, 4, 4, 0]} maxBarSize={28}>
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
                  mortgage: {
                    label: "Mortgage",
                    theme: { light: PIE_COLORS[0], dark: PIE_COLORS[0] },
                  },
                  "50/50": {
                    label: "50/50",
                    theme: { light: PIE_COLORS[1], dark: PIE_COLORS[1] },
                  },
                  "Tasnuva's": {
                    label: "Tasnuva's",
                    theme: { light: PIE_COLORS[2], dark: PIE_COLORS[2] },
                  },
                  My: {
                    label: "My",
                    theme: { light: PIE_COLORS[3], dark: PIE_COLORS[3] },
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
                      <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
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
              Personal savings rate
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ChartContainer config={savingsConfig} className="h-[220px] w-full">
              <RadialBarChart
                data={savingsRadialData}
                innerRadius="60%"
                outerRadius="90%"
                startAngle={90}
                endAngle={-270}
              >
                <RadialBar
                  dataKey="value"
                  fill="var(--color-savings)"
                  cornerRadius={4}
                />
                <ChartTooltip
                  content={
                    <ChartTooltipContent
                      formatter={(value) =>
                        typeof value === "number"
                          ? `${value.toFixed(1)}%`
                          : String(value ?? "")
                      }
                    />
                  }
                />
              </RadialBarChart>
            </ChartContainer>
            <p className="text-center text-2xl font-semibold mt-[-40px]">
              {formatPercent(selectedMonth.personalSavingsRate)}
            </p>
          </CardContent>
        </Card>
      </div>

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
              {formatCurrency(selectedMonth.myTotalSpendingWithoutMortgage)}
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
            Total Earned: {formatCurrency(grand.totalEarned)} · Total Spent:{" "}
            {formatCurrency(grand.totalSpent)} · Total Saved:{" "}
            {formatCurrency(grand.totalSaved)}
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Monthly breakdown</CardTitle>
          <p className="text-sm text-muted-foreground">
            Total earned vs total spent by month.
          </p>
        </CardHeader>
        <CardContent>
          {chartData.length > 0 ? (
            <ChartContainer config={chartConfig} className="h-[300px] w-full">
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
                  tickFormatter={(v) => (v >= 1000 ? `$${v / 1000}k` : `$${v}`)}
                />
                <ChartTooltip
                  content={
                    <ChartTooltipContent
                      formatter={(value, name, item: { fill?: string }) => (
                        <div className="flex w-full flex-wrap items-center gap-2">
                          <div
                            className="h-2.5 w-2.5 shrink-0 rounded-[2px]"
                            style={{ backgroundColor: item?.fill }}
                          />
                          <div className="flex flex-1 justify-between leading-none items-center gap-2">
                            <span className="text-muted-foreground">
                              {chartConfig[name as keyof typeof chartConfig]
                                ?.label ?? name}
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
                  <TableHead className="text-right">Total Earned</TableHead>
                  <TableHead className="text-right">Total Spent</TableHead>
                  <TableHead className="text-right">
                    Spent w/o Mortgage
                  </TableHead>
                  <TableHead className="text-right">Total Saved</TableHead>
                  <TableHead className="text-right">Savings Rate</TableHead>
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
    </div>
  );
}
