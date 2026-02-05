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

const SERIES_PALETTE = [
  "oklch(0.7 0.2 25)",
  "oklch(0.68 0.2 55)",
  "oklch(0.7 0.18 200)",
  "oklch(0.62 0.2 160)",
  "oklch(0.68 0.18 280)",
  "oklch(0.7 0.12 95)",
  "oklch(0.65 0.14 145)",
  "oklch(0.62 0.16 320)",
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

function daysInMonth(monthKey: string): number {
  const [year, month] = monthKey.split("-").map((n) => Number(n));
  return new Date(year ?? 0, month ?? 0, 0).getDate();
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
  const orderedMonthKeys = useMemo(() => [...monthKeys].reverse(), [monthKeys]);

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

  const expensesInRange = useMemo(
    () =>
      expenses.filter(
        (e) => isValidDate(e.date) && monthKeySet.has(e.date.slice(0, 7))
      ),
    [expenses, monthKeySet]
  );

  const incomeInRange = useMemo(
    () =>
      income.filter(
        (i) => isValidDate(i.date) && monthKeySet.has(i.date.slice(0, 7))
      ),
    [income, monthKeySet]
  );

  const debtPaymentsInRange = useMemo(
    () =>
      debtPayments.filter(
        (p) => isValidDate(p.date) && monthKeySet.has(p.date.slice(0, 7))
      ),
    [debtPayments, monthKeySet]
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

  const daysInRange = useMemo(() => {
    if (range === "current") {
      return new Date().getDate();
    }
    return orderedMonthKeys.reduce((sum, key) => sum + daysInMonth(key), 0);
  }, [orderedMonthKeys, range]);

  const avgDailySpend = useMemo(
    () => (daysInRange > 0 ? totals.totalExpenses / daysInRange : 0),
    [daysInRange, totals.totalExpenses]
  );

  const largestExpense = useMemo(
    () =>
      expensesInRange.reduce((max, e) => (e.amount > max ? e.amount : max), 0),
    [expensesInRange]
  );

  const essentialsTotal = useMemo(() => {
    const expenseEssentials = expensesInRange.reduce((sum, e) => {
      const category = (e.category || "").trim().toLowerCase();
      if (category === "mortgage" || category === "utilities") {
        return sum + e.amount;
      }
      return sum;
    }, 0);
    const debtEssential = debtPaymentsInRange.reduce(
      (sum, p) => sum + p.amount,
      0
    );
    return expenseEssentials + debtEssential;
  }, [expensesInRange, debtPaymentsInRange]);

  const incomeCoverage = useMemo(
    () => totals.totalIncome - essentialsTotal,
    [totals.totalIncome, essentialsTotal]
  );

  const kpiCardClass = "gap-2 py-3 md:gap-6 md:py-6";
  const kpiHeaderClass = "px-4 md:px-6 pb-1 pt-0";
  const kpiContentBase = "px-4 md:px-6 pb-2 md:pb-3";

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

  const categoryTrend = useMemo(() => {
    const totalsByCategory = new Map<string, number>();
    for (const e of expensesInRange) {
      const category = normalizeCategory(e.category);
      if (category.toLowerCase() === "mortgage") continue;
      totalsByCategory.set(category, (totalsByCategory.get(category) ?? 0) + e.amount);
    }

    const sorted = Array.from(totalsByCategory.entries())
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);
    const top = sorted.slice(0, 5);
    const rest = sorted.slice(5);
    const otherTotal = rest.reduce((sum, entry) => sum + entry.value, 0);
    const series = top.map((entry, index) => ({
      key: `cat${index}`,
      name: entry.name,
      color: SERIES_PALETTE[index % SERIES_PALETTE.length] ?? SERIES_PALETTE[0],
    }));
    if (otherTotal > 0) {
      series.push({
        key: "other",
        name: "Other",
        color: "oklch(0.6 0.12 200)",
      });
    }

    const data = orderedMonthKeys.map((monthKey) => {
      const row: Record<string, number | string> = {
        month: getMonthLabel(monthKey),
      };
      for (const s of series) {
        row[s.key] = 0;
      }
      for (const e of expensesInRange) {
        if (e.date.slice(0, 7) !== monthKey) continue;
        const category = normalizeCategory(e.category);
        if (category.toLowerCase() === "mortgage") continue;
        const topIndex = top.findIndex((entry) => entry.name === category);
        if (topIndex >= 0) {
          const key = series[topIndex]?.key;
          if (key) row[key] = Number(row[key] ?? 0) + e.amount;
        } else if (otherTotal > 0) {
          row.other = Number(row.other ?? 0) + e.amount;
        }
      }
      return row;
    });

    const config = series.reduce<Record<string, { label: string; color: string }>>(
      (acc, s) => {
        acc[s.key] = { label: s.name, color: s.color };
        return acc;
      },
      {}
    );

    return { data, series, config };
  }, [expensesInRange, orderedMonthKeys]);

  const ownerTrend = useMemo(() => {
    const ownerSeries = ownerOptions.map((name, index) => ({
      key: `owner${index}`,
      name,
      color: SERIES_PALETTE[index % SERIES_PALETTE.length] ?? SERIES_PALETTE[0],
    }));
    const unassignedKey = "unassigned";
    let hasUnassigned = false;
    const data = orderedMonthKeys.map((monthKey) => {
      const row: Record<string, number | string> = {
        month: getMonthLabel(monthKey),
      };
      for (const s of ownerSeries) {
        row[s.key] = 0;
      }
      row[unassignedKey] = 0;
      return row;
    });

    const rowByMonth = new Map(
      orderedMonthKeys.map((key, index) => [key, data[index]!])
    );

    for (const e of expensesInRange) {
      const monthKey = e.date.slice(0, 7);
      const row = rowByMonth.get(monthKey);
      if (!row) continue;

      const category = (e.category || "").trim();
      if (category.toLowerCase() === "50/50" && ownerOptions.length >= 2) {
        const split = e.amount / 2;
        const firstKey = ownerSeries[0]?.key;
        const secondKey = ownerSeries[1]?.key;
        if (firstKey) row[firstKey] = Number(row[firstKey] ?? 0) + split;
        if (secondKey) row[secondKey] = Number(row[secondKey] ?? 0) + split;
        continue;
      }

      const explicit = (e.owner || "").trim();
      const inferred = !explicit ? matchOwnerFromCategory(category, ownerOptions) : null;
      const owner = explicit || inferred || "";
      const index = ownerOptions.findIndex((o) => o === owner);
      if (index >= 0) {
        const key = ownerSeries[index]?.key;
        if (key) row[key] = Number(row[key] ?? 0) + e.amount;
      } else {
        row[unassignedKey] = Number(row[unassignedKey] ?? 0) + e.amount;
        hasUnassigned = true;
      }
    }

    const series = hasUnassigned
      ? [
          ...ownerSeries,
          {
            key: unassignedKey,
            name: t("dashboard.unassigned"),
            color: "oklch(0.62 0.1 210)",
          },
        ]
      : ownerSeries;

    const config = series.reduce<Record<string, { label: string; color: string }>>(
      (acc, s) => {
        acc[s.key] = { label: s.name, color: s.color };
        return acc;
      },
      {}
    );

    return { data, series, config };
  }, [expensesInRange, orderedMonthKeys, ownerOptions, t]);

  const spendingByCategory = useMemo(() => {
    const byCategory = new Map<string, number>();
    for (const e of expensesInRange) {
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
  }, [expensesInRange]);

  const ownerSplitData = useMemo(() => {
    if (!showOwnerSplit) return [];
    const rows = new Map<string, { name: string; income: number; expense: number }>();
    const ensureRow = (name: string) => {
      if (!rows.has(name)) rows.set(name, { name, income: 0, expense: 0 });
      return rows.get(name)!;
    };
    let unassignedIncome = 0;
    let unassignedExpense = 0;

    for (const i of incomeInRange) {
      const explicit = (i.owner || "").trim();
      const inferred = !explicit ? matchOwnerFromCategory(i.category || "", ownerOptions) : null;
      const owner = explicit || inferred || "";
      if (owner) ensureRow(owner).income += i.amount;
      else unassignedIncome += i.amount;
    }

    for (const e of expensesInRange) {
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
  }, [showOwnerSplit, incomeInRange, expensesInRange, ownerOptions, t]);

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

  const insights = useMemo(() => {
    const highlights: string[] = [];
    const alerts: string[] = [];

    const categoryTotals = new Map<string, number>();
    for (const e of expensesInRange) {
      const category = normalizeCategory(e.category);
      if (category.toLowerCase() === "mortgage") continue;
      categoryTotals.set(category, (categoryTotals.get(category) ?? 0) + e.amount);
    }
    const biggestCategory = Array.from(categoryTotals.entries()).sort(
      (a, b) => b[1] - a[1]
    )[0];
    if (biggestCategory) {
      highlights.push(
        t("dashboard.insightBiggestCategory", {
          category: biggestCategory[0],
          amount: formatCurrency(biggestCategory[1]),
        })
      );
    }

    const ownerTotals = new Map<string, number>();
    for (const e of expensesInRange) {
      const category = (e.category || "").trim();
      if (category.toLowerCase() === "50/50" && ownerOptions.length >= 2) {
        const split = e.amount / 2;
        ownerTotals.set(
          ownerOptions[0]!,
          (ownerTotals.get(ownerOptions[0]!) ?? 0) + split
        );
        ownerTotals.set(
          ownerOptions[1]!,
          (ownerTotals.get(ownerOptions[1]!) ?? 0) + split
        );
        continue;
      }
      const explicit = (e.owner || "").trim();
      const inferred = !explicit ? matchOwnerFromCategory(category, ownerOptions) : null;
      const owner = explicit || inferred || "";
      if (owner) {
        ownerTotals.set(owner, (ownerTotals.get(owner) ?? 0) + e.amount);
      }
    }
    const biggestOwner = Array.from(ownerTotals.entries()).sort(
      (a, b) => b[1] - a[1]
    )[0];
    if (biggestOwner) {
      highlights.push(
        t("dashboard.insightBiggestOwner", {
          owner: biggestOwner[0],
          amount: formatCurrency(biggestOwner[1]),
        })
      );
    }

    if (monthTotals.length > 1) {
      const current = monthTotals[0]?.totalSpent ?? 0;
      const previous = monthTotals[1]?.totalSpent ?? 0;
      const delta = current - previous;
      if (Math.abs(delta) < 1) {
        highlights.push(t("dashboard.insightMomFlat"));
      } else if (delta > 0) {
        highlights.push(
          t("dashboard.insightMomUp", {
            amount: formatCurrency(delta),
          })
        );
      } else {
        highlights.push(
          t("dashboard.insightMomDown", {
            amount: formatCurrency(Math.abs(delta)),
          })
        );
      }
    }

    if (totals.totalExpenses > totals.totalIncome) {
      alerts.push(t("dashboard.alertSpendOverIncome"));
    }

    if (totals.totalIncome > 0) {
      const essentialsRatio = essentialsTotal / totals.totalIncome;
      if (essentialsRatio > 0.6) {
        alerts.push(
          t("dashboard.alertEssentialsHigh", {
            percent: formatPercent(essentialsRatio),
          })
        );
      }
    }

    return { highlights, alerts };
  }, [
    essentialsTotal,
    expensesInRange,
    monthTotals,
    ownerOptions,
    totals.totalExpenses,
    totals.totalIncome,
    t,
  ]);

  return (
    <div className="space-y-6 min-w-0 overflow-x-hidden pb-24 md:pb-0">
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

      <div data-tour="dashboardKpis" className="grid grid-cols-2 gap-2 md:grid-cols-4 xl:grid-cols-6">
        <Card className={kpiCardClass}>
          <CardHeader className={kpiHeaderClass}>
            <CardTitle className="text-[11px] font-medium text-muted-foreground">
              {t("dashboard.totalIncome")}
            </CardTitle>
          </CardHeader>
          <CardContent className={`${kpiContentBase} text-base font-semibold sm:text-lg`}>
            {formatCurrency(totals.totalIncome)}
          </CardContent>
        </Card>
        <Card className={kpiCardClass}>
          <CardHeader className={kpiHeaderClass}>
            <CardTitle className="text-[11px] font-medium text-muted-foreground">
              {t("dashboard.totalExpenses")}
            </CardTitle>
          </CardHeader>
          <CardContent className={`${kpiContentBase} text-base font-semibold sm:text-lg`}>
            {formatCurrency(totals.totalExpenses)}
          </CardContent>
        </Card>
        <Card className={kpiCardClass}>
          <CardHeader className={kpiHeaderClass}>
            <CardTitle className="text-[11px] font-medium text-muted-foreground">
              {t("dashboard.netCashflow")}
            </CardTitle>
          </CardHeader>
          <CardContent className={`${kpiContentBase} text-base font-semibold sm:text-lg`}>
            {formatCurrency(totals.net)}
          </CardContent>
        </Card>
        <Card className={kpiCardClass}>
          <CardHeader className={kpiHeaderClass}>
            <CardTitle className="text-[11px] font-medium text-muted-foreground">
              {t("dashboard.avgDailySpend")}
            </CardTitle>
          </CardHeader>
          <CardContent className={`${kpiContentBase} text-base font-semibold sm:text-lg`}>
            {formatCurrency(avgDailySpend)}
          </CardContent>
        </Card>
        <Card className={kpiCardClass}>
          <CardHeader className={kpiHeaderClass}>
            <CardTitle className="text-[11px] font-medium text-muted-foreground">
              {t("dashboard.largestExpense")}
            </CardTitle>
          </CardHeader>
          <CardContent className={`${kpiContentBase} text-base font-semibold sm:text-lg`}>
            {formatCurrency(largestExpense)}
          </CardContent>
        </Card>
        <Card className={kpiCardClass}>
          <CardHeader className={kpiHeaderClass}>
            <CardTitle className="text-[11px] font-medium text-muted-foreground">
              {t("dashboard.incomeCoverage")}
            </CardTitle>
          </CardHeader>
          <CardContent className={`${kpiContentBase} space-y-1`}>
            <div className="text-base font-semibold sm:text-lg">
              {formatCurrency(incomeCoverage)}
            </div>
            <div className="text-[11px] text-muted-foreground">
              {essentialsTotal > 0
                ? `${t("dashboard.essentials")}: ${formatCurrency(essentialsTotal)}`
                : t("dashboard.noEssentials")}
            </div>
          </CardContent>
        </Card>
        <Card className={kpiCardClass}>
          <CardHeader className={kpiHeaderClass}>
            <CardTitle className="text-[11px] font-medium text-muted-foreground">
              {t("dashboard.savingsRate")}
            </CardTitle>
          </CardHeader>
          <CardContent className={`${kpiContentBase} text-base font-semibold sm:text-lg`}>
            {formatPercent(totals.savingsRate)}
          </CardContent>
        </Card>
        <Card className={kpiCardClass}>
          <CardHeader className={kpiHeaderClass}>
            <CardTitle className="text-[11px] font-medium text-muted-foreground">
              {t("dashboard.spentNoMortgage")}
            </CardTitle>
          </CardHeader>
          <CardContent className={`${kpiContentBase} text-base font-semibold sm:text-lg`}>
            {formatCurrency(totals.spentNoMortgage)}
          </CardContent>
        </Card>
        <Card className={kpiCardClass}>
          <CardHeader className={kpiHeaderClass}>
            <CardTitle className="text-[11px] font-medium text-muted-foreground">
              {t("dashboard.debtRemaining")}
            </CardTitle>
          </CardHeader>
          <CardContent className={`${kpiContentBase} text-base font-semibold sm:text-lg`}>
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
                    content={({ active, payload, label }) => {
                      if (!active || !payload?.length) return null;
                      return (
                        <div className="border-border/50 bg-background grid min-w-[8rem] items-start gap-1.5 rounded-lg border px-2.5 py-1.5 text-xs shadow-xl">
                          <div className="font-medium">{label}</div>
                          <div className="grid gap-1.5">
                            {payload.map((item) => {
                              const key = String(item.dataKey ?? item.name ?? "value");
                              const labelText =
                                categoryTrend.config[
                                  key as keyof typeof categoryTrend.config
                                ]?.label ?? key;
                              return (
                                <div
                                  key={key}
                                  className="flex items-center gap-2"
                                >
                                  <span
                                    className="h-2.5 w-2.5 rounded-[2px]"
                                    style={{ background: item.color ?? item.payload?.fill }}
                                  />
                                  <span className="text-muted-foreground">
                                    {labelText}
                                  </span>
                                  <span className="ml-auto">
                                    {formatCurrency(Number(item.value ?? 0))}
                                  </span>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      );
                    }}
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

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              {t("dashboard.categoryTrend")}
            </CardTitle>
          </CardHeader>
          <CardContent className="overflow-hidden min-w-0">
            {categoryTrend.series.length > 0 ? (
              <ChartContainer
                config={categoryTrend.config}
                className="h-[240px] w-full max-w-full aspect-auto"
              >
                {range === "current" ? (
                  <BarChart
                    data={categoryTrend.series.map((series) => ({
                      name: series.name,
                      value: Number(categoryTrend.data[0]?.[series.key] ?? 0),
                    }))}
                    margin={{ left: 8, right: 8 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis
                      dataKey="name"
                      tickLine={false}
                      axisLine={false}
                      height={40}
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
                    <Bar dataKey="value" radius={[6, 6, 0, 0]}>
                      {categoryTrend.series.map((series) => (
                        <Cell
                          key={series.key}
                          fill={`var(--color-${series.key})`}
                        />
                      ))}
                    </Bar>
                  </BarChart>
                ) : (
                  <LineChart data={categoryTrend.data} margin={{ left: 8, right: 8 }}>
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
                    {categoryTrend.series.map((series) => (
                      <Line
                        key={series.key}
                        type="monotone"
                        dataKey={series.key}
                        stroke={`var(--color-${series.key})`}
                        strokeWidth={2}
                        dot={false}
                      />
                    ))}
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
              {t("dashboard.ownerTrend")}
            </CardTitle>
          </CardHeader>
          <CardContent className="overflow-hidden min-w-0">
            {ownerTrend.series.length > 0 ? (
              <ChartContainer
                config={ownerTrend.config}
                className="h-[240px] w-full max-w-full aspect-auto"
              >
                <BarChart data={ownerTrend.data} margin={{ left: 8, right: 8 }}>
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
                  {ownerTrend.series.map((series) => (
                    <Bar
                      key={series.key}
                      dataKey={series.key}
                      stackId="owners"
                      fill={`var(--color-${series.key})`}
                      radius={[4, 4, 0, 0]}
                    />
                  ))}
                </BarChart>
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

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            {t("dashboard.insightsTitle")}
          </CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <div className="text-xs font-medium text-muted-foreground">
              {t("dashboard.highlights")}
            </div>
            {insights.highlights.length > 0 ? (
              <ul className="list-disc pl-4 text-sm space-y-1">
                {insights.highlights.map((item, index) => (
                  <li key={index}>{item}</li>
                ))}
              </ul>
            ) : (
              <div className="text-sm text-muted-foreground">
                {t("dashboard.noData")}
              </div>
            )}
          </div>
          <div className="space-y-2">
            <div className="text-xs font-medium text-muted-foreground">
              {t("dashboard.alerts")}
            </div>
            {insights.alerts.length > 0 ? (
              <ul className="list-disc pl-4 text-sm space-y-1">
                {insights.alerts.map((item, index) => (
                  <li key={index}>{item}</li>
                ))}
              </ul>
            ) : (
              <div className="text-sm text-muted-foreground">
                {t("dashboard.noAlerts")}
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
