import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  Pie,
  PieChart,
  XAxis,
  YAxis,
} from "recharts";
import { useBudget } from "@/context/BudgetContext";
import { getDebtBalance } from "@/lib/debtUtils";
import { formatCurrency, formatPercent } from "@/lib/format";
import { computeMonthTotals, getMonthLabel, isValidDate } from "@/lib/totals";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

type RangeKey = "current" | "6" | "12";
type SplitMode = "all" | "owners";

const CATEGORY_PALETTE = [
  "oklch(0.65 0.2 25)",
  "oklch(0.7 0.18 55)",
  "oklch(0.65 0.2 280)",
  "oklch(0.6 0.2 160)",
  "oklch(0.6 0.18 200)",
  "oklch(0.7 0.12 95)",
  "oklch(0.62 0.16 320)",
  "oklch(0.65 0.14 145)",
];

function getCurrentMonthKey(): string {
  return new Date().toISOString().slice(0, 7);
}

function getRecentMonthKeys(count: number): string[] {
  const out: string[] = [];
  const now = new Date();
  for (let i = 0; i < count; i++) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    out.push(d.toISOString().slice(0, 7));
  }
  return out;
}

function normalizeCategory(category: string | undefined): string {
  const trimmed = (category || "").trim();
  return trimmed.length > 0 ? trimmed : "Uncategorized";
}

function matchOwnerFromCategory(category: string, owners: string[]): string | null {
  const normalized = category.trim().toLowerCase();
  for (const owner of owners) {
    const lower = owner.toLowerCase();
    if (normalized === `${lower}'s purchases` || normalized === `${lower} purchases`) {
      return owner;
    }
  }
  return null;
}

export function Dashboard() {
  const { t } = useTranslation();
  const { expenses, income, debts, debtPayments, owners, iOweNova } = useBudget();
  const currentMonthKey = getCurrentMonthKey();
  const [range, setRange] = useState<RangeKey>("current");
  const [splitMode, setSplitMode] = useState<SplitMode>("all");

  const ownerOptions = owners ?? [];
  const showOwnerSplit = ownerOptions.length > 0 && splitMode === "owners";

  const monthKeys = useMemo(() => {
    if (range === "current") return [currentMonthKey];
    return getRecentMonthKeys(range === "6" ? 6 : 12);
  }, [range, currentMonthKey]);

  const monthKeySet = useMemo(() => new Set(monthKeys), [monthKeys]);

  const monthTotals = useMemo(
    () =>
      monthKeys.map((monthKey) =>
        computeMonthTotals(
          monthKey,
          expenses,
          income,
          iOweNova[monthKey] ?? 0,
          0,
          0
        )
      ),
    [monthKeys, expenses, income, iOweNova]
  );

  const totals = useMemo(() => {
    const totalIncome = monthTotals.reduce((s, m) => s + m.totalEarned, 0);
    const totalExpenses = monthTotals.reduce((s, m) => s + m.totalSpent, 0);
    const spentNoMortgage = monthTotals.reduce(
      (s, m) => s + m.totalSpentWithoutMortgage,
      0
    );
    const net = totalIncome - totalExpenses;
    const savingsRate = totalIncome > 0 ? net / totalIncome : 0;
    const debtRemaining = debts.reduce(
      (s, d) => s + getDebtBalance(d, debtPayments),
      0
    );
    return {
      totalIncome,
      totalExpenses,
      net,
      savingsRate,
      spentNoMortgage,
      debtRemaining,
    };
  }, [monthTotals, debts, debtPayments]);

  const trendData = useMemo(
    () =>
      [...monthTotals]
        .reverse()
        .map((m) => ({
          month: m.monthLabel,
          income: m.totalEarned,
          expense: m.totalSpent,
        })),
    [monthTotals]
  );

  const spendingByCategory = useMemo(() => {
    const byCategory = new Map<string, number>();
    for (const e of expenses) {
      if (!isValidDate(e.date)) continue;
      if (!monthKeySet.has(e.date.slice(0, 7))) continue;
      if ((e.category || "").toLowerCase() === "mortgage") continue;
      const cat = normalizeCategory(e.category);
      byCategory.set(cat, (byCategory.get(cat) ?? 0) + e.amount);
    }
    const sorted = Array.from(byCategory.entries())
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);
    const top = sorted.slice(0, 7);
    const rest = sorted.slice(7);
    const otherTotal = rest.reduce((s, x) => s + x.value, 0);
    if (otherTotal > 0) top.push({ name: "Other", value: otherTotal });
    return top.map((item, i) => ({
      ...item,
      fill: CATEGORY_PALETTE[i % CATEGORY_PALETTE.length] ?? CATEGORY_PALETTE[0],
    }));
  }, [expenses, monthKeySet]);

  const ownerSplitData = useMemo(() => {
    if (!showOwnerSplit) return [];
    const rows = new Map<string, { name: string; income: number; expense: number }>();
    const ensureRow = (name: string) => {
      if (!rows.has(name)) rows.set(name, { name, income: 0, expense: 0 });
      return rows.get(name)!;
    };
    let unassignedIncome = 0;
    let unassignedExpense = 0;

    for (const i of income) {
      if (!isValidDate(i.date)) continue;
      if (!monthKeySet.has(i.date.slice(0, 7))) continue;
      const explicit = (i.owner || "").trim();
      const inferred = !explicit ? matchOwnerFromCategory(i.category || "", ownerOptions) : null;
      const owner = explicit || inferred || "";
      if (owner) ensureRow(owner).income += i.amount;
      else unassignedIncome += i.amount;
    }

    for (const e of expenses) {
      if (!isValidDate(e.date)) continue;
      if (!monthKeySet.has(e.date.slice(0, 7))) continue;
      const category = (e.category || "").trim();
      if (category.toLowerCase() === "50/50" && ownerOptions.length >= 2) {
        const split = e.amount / 2;
        ensureRow(ownerOptions[0]!).expense += split;
        ensureRow(ownerOptions[1]!).expense += split;
        continue;
      }
      const explicit = (e.owner || "").trim();
      const inferred = !explicit ? matchOwnerFromCategory(category, ownerOptions) : null;
      const owner = explicit || inferred || "";
      if (owner) ensureRow(owner).expense += e.amount;
      else unassignedExpense += e.amount;
    }

    if (unassignedIncome > 0 || unassignedExpense > 0) {
      rows.set("Unassigned", {
        name: t("dashboard.unassigned"),
        income: unassignedIncome,
        expense: unassignedExpense,
      });
    }

    return Array.from(rows.values()).filter(
      (row) => row.income > 0 || row.expense > 0
    );
  }, [showOwnerSplit, income, expenses, monthKeySet, ownerOptions, t]);

  const ownerSplitConfig = {
    income: {
      label: t("dashboard.totalIncome"),
      theme: { light: "oklch(0.6 0.18 160)", dark: "oklch(0.7 0.16 160)" },
    },
    expense: {
      label: t("dashboard.totalExpenses"),
      theme: { light: "oklch(0.7 0.18 55)", dark: "oklch(0.78 0.16 55)" },
    },
  };

  const trendConfig = ownerSplitConfig;

  const debtSnapshot = useMemo(() => {
    const remaining = debts.reduce(
      (s, d) => s + getDebtBalance(d, debtPayments),
      0
    );
    const paid = debtPayments.reduce((s, p) => s + p.amount, 0);
    return [
      { name: t("dashboard.remaining"), value: remaining, fill: "oklch(0.65 0.16 35)" },
      { name: t("dashboard.paid"), value: paid, fill: "oklch(0.6 0.2 160)" },
    ];
  }, [debts, debtPayments, t]);

  return (
    <div className="space-y-6 min-w-0 overflow-x-hidden">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="space-y-1 min-w-0">
          <h1 className="text-2xl font-semibold">{t("dashboard.title")}</h1>
          <p className="text-sm text-muted-foreground">{t("dashboard.subtitle")}</p>
        </div>
      </div>

      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div className="space-y-1">
          <p className="text-xs font-medium text-muted-foreground">
            {t("dashboard.timeRange")}
          </p>
          <Tabs value={range} onValueChange={(v) => setRange(v as RangeKey)}>
            <TabsList className="grid grid-cols-3 w-full max-w-[320px]">
              <TabsTrigger value="current">{t("dashboard.rangeCurrent")}</TabsTrigger>
              <TabsTrigger value="6">{t("dashboard.range6")}</TabsTrigger>
              <TabsTrigger value="12">{t("dashboard.range12")}</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
        {ownerOptions.length > 0 && (
          <div className="space-y-1">
            <p className="text-xs font-medium text-muted-foreground">
              {t("dashboard.splitView")}
            </p>
            <Tabs value={splitMode} onValueChange={(v) => setSplitMode(v as SplitMode)}>
              <TabsList className="grid grid-cols-2 w-full max-w-[240px]">
                <TabsTrigger value="all">{t("dashboard.splitAll")}</TabsTrigger>
                <TabsTrigger value="owners">{t("dashboard.splitOwners")}</TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
        )}
      </div>

      <div className="grid grid-cols-2 gap-2 md:grid-cols-3 lg:grid-cols-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-medium text-muted-foreground">
              {t("dashboard.totalIncome")}
            </CardTitle>
          </CardHeader>
          <CardContent className="text-lg font-semibold">
            {formatCurrency(totals.totalIncome)}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-medium text-muted-foreground">
              {t("dashboard.totalExpenses")}
            </CardTitle>
          </CardHeader>
          <CardContent className="text-lg font-semibold">
            {formatCurrency(totals.totalExpenses)}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-medium text-muted-foreground">
              {t("dashboard.netCashflow")}
            </CardTitle>
          </CardHeader>
          <CardContent className="text-lg font-semibold">
            {formatCurrency(totals.net)}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-medium text-muted-foreground">
              {t("dashboard.savingsRate")}
            </CardTitle>
          </CardHeader>
          <CardContent className="text-lg font-semibold">
            {formatPercent(totals.savingsRate)}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-medium text-muted-foreground">
              {t("dashboard.spentNoMortgage")}
            </CardTitle>
          </CardHeader>
          <CardContent className="text-lg font-semibold">
            {formatCurrency(totals.spentNoMortgage)}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-medium text-muted-foreground">
              {t("dashboard.debtRemaining")}
            </CardTitle>
          </CardHeader>
          <CardContent className="text-lg font-semibold">
            {formatCurrency(totals.debtRemaining)}
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              {t("dashboard.incomeVsExpense")}
            </CardTitle>
          </CardHeader>
          <CardContent className="overflow-hidden min-w-0">
            {trendData.some((d) => d.income > 0 || d.expense > 0) ? (
              <ChartContainer
                config={trendConfig}
                className="h-[220px] w-full max-w-full aspect-auto"
              >
                {range === "current" ? (
                  <BarChart data={trendData} margin={{ left: 8, right: 8 }}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis
                      dataKey="month"
                      tickLine={false}
                      axisLine={false}
                      tickFormatter={(value) =>
                        String(value).split(" ")[0]?.slice(0, 3) ?? value
                      }
                    />
                    <YAxis
                      tickLine={false}
                      axisLine={false}
                      tickFormatter={(v) => formatCurrency(v)}
                    />
                    <ChartTooltip
                      content={
                        <ChartTooltipContent
                          formatter={(value, name) =>
                            `${name}: ${formatCurrency(Number(value))}`
                          }
                        />
                      }
                    />
                    <Bar
                      dataKey="income"
                      fill="var(--color-income)"
                      radius={[6, 6, 0, 0]}
                    />
                    <Bar
                      dataKey="expense"
                      fill="var(--color-expense)"
                      radius={[6, 6, 0, 0]}
                    />
                  </BarChart>
                ) : (
                  <LineChart data={trendData} margin={{ left: 8, right: 8 }}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis
                      dataKey="month"
                      tickLine={false}
                      axisLine={false}
                      tickFormatter={(value) =>
                        String(value).split(" ")[0]?.slice(0, 3) ?? value
                      }
                    />
                    <YAxis
                      tickLine={false}
                      axisLine={false}
                      tickFormatter={(v) => formatCurrency(v)}
                    />
                    <ChartTooltip
                      content={
                        <ChartTooltipContent
                          formatter={(value, name) =>
                            `${name}: ${formatCurrency(Number(value))}`
                          }
                        />
                      }
                    />
                    <Line
                      type="monotone"
                      dataKey="income"
                      stroke="var(--color-income)"
                      strokeWidth={2}
                      dot={false}
                    />
                    <Line
                      type="monotone"
                      dataKey="expense"
                      stroke="var(--color-expense)"
                      strokeWidth={2}
                      dot={false}
                    />
                  </LineChart>
                )}
              </ChartContainer>
            ) : (
              <div className="text-sm text-muted-foreground py-12 text-center">
                {t("dashboard.noData")}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              {t("dashboard.spendingByCategory")}
            </CardTitle>
          </CardHeader>
          <CardContent className="overflow-hidden min-w-0">
            {spendingByCategory.length > 0 ? (
              <ChartContainer
                config={{ value: { label: "Amount" } }}
                className="h-[220px] w-full max-w-full aspect-auto"
              >
                <PieChart>
                  <ChartTooltip
                    content={
                      <ChartTooltipContent
                        formatter={(value, name) =>
                          `${name}: ${formatCurrency(Number(value))}`
                        }
                        nameKey="name"
                      />
                    }
                  />
                  <Pie
                    data={spendingByCategory}
                    dataKey="value"
                    nameKey="name"
                    innerRadius={60}
                    outerRadius={90}
                    stroke="transparent"
                  >
                    {spendingByCategory.map((entry, index) => (
                      <Cell key={index} fill={entry.fill} />
                    ))}
                  </Pie>
                </PieChart>
              </ChartContainer>
            ) : (
              <div className="text-sm text-muted-foreground py-12 text-center">
                {t("dashboard.noData")}
              </div>
            )}
          </CardContent>
        </Card>

        {showOwnerSplit && (
          <Card className="lg:col-span-2">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {t("dashboard.ownerSplit")}
              </CardTitle>
            </CardHeader>
            <CardContent className="overflow-hidden min-w-0">
              {ownerSplitData.length > 0 ? (
                <ChartContainer
                  config={ownerSplitConfig}
                  className="h-[240px] w-full max-w-full aspect-auto"
                >
                  <BarChart data={ownerSplitData} margin={{ left: 8, right: 8 }}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis
                      dataKey="name"
                      tickLine={false}
                      axisLine={false}
                      height={30}
                      angle={-20}
                      textAnchor="end"
                      tickFormatter={(value) => {
                        const s = String(value);
                        return s.length > 10 ? `${s.slice(0, 10)}…` : s;
                      }}
                    />
                    <YAxis
                      tickLine={false}
                      axisLine={false}
                      tickFormatter={(v) => formatCurrency(v)}
                    />
                    <ChartTooltip
                      content={
                        <ChartTooltipContent
                          formatter={(value, name) =>
                            `${name}: ${formatCurrency(Number(value))}`
                          }
                        />
                      }
                    />
                    <Bar dataKey="income" fill="var(--color-income)" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="expense" fill="var(--color-expense)" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ChartContainer>
              ) : (
                <div className="text-sm text-muted-foreground py-12 text-center">
                  {t("dashboard.noData")}
                </div>
              )}
            </CardContent>
          </Card>
        )}

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              {t("dashboard.debtSnapshot")}
            </CardTitle>
          </CardHeader>
          <CardContent className="overflow-hidden min-w-0">
            {(debtSnapshot[0]?.value ?? 0) + (debtSnapshot[1]?.value ?? 0) > 0 ? (
              <div className="space-y-3">
                <div className="text-lg font-semibold">
                  {formatCurrency(totals.debtRemaining)}
                </div>
                <ChartContainer
                  config={{ value: { label: "Amount" } }}
                  className="h-[200px] w-full max-w-full aspect-auto"
                >
                  <PieChart>
                    <ChartTooltip
                      content={
                        <ChartTooltipContent
                          formatter={(value, name) =>
                            `${name}: ${formatCurrency(Number(value))}`
                          }
                          nameKey="name"
                        />
                      }
                    />
                    <Pie
                      data={debtSnapshot}
                      dataKey="value"
                      nameKey="name"
                      innerRadius={50}
                      outerRadius={80}
                      stroke="transparent"
                    >
                      {debtSnapshot.map((entry, index) => (
                        <Cell key={index} fill={entry.fill} />
                      ))}
                    </Pie>
                  </PieChart>
                </ChartContainer>
              </div>
            ) : (
              <div className="text-sm text-muted-foreground py-12 text-center">
                {t("dashboard.noData")}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
