import { useState, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { useBudget } from "@/context/BudgetContext";
import { useRules } from "@/context/RulesContext";
import { getDebtBalance } from "@/lib/debtUtils";
import {
  computeAllTotals,
  computeMonthTotals,
  type MonthTotals,
} from "@/lib/totals";
import { getDashboardWarnings } from "@/lib/rules";
import { DEFAULT_INCOME_CATEGORIES } from "@/lib/types";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import type { ChartConfig } from "@/components/ui/chart";
import { SummaryCards } from "./SummaryCards";
import { DebtSection } from "./DebtSection";
import { ByMonthSection } from "./ByMonthSection";
import { MonthSelector } from "./MonthSelector";
import { OverviewSection } from "./OverviewSection";
import { SpendingByTypeSection } from "./SpendingByTypeSection";

export function Dashboard() {
  const { t } = useTranslation();
  const { expenses, income, iOweNova, debts, debtPayments } = useBudget();
  const { rules } = useRules();
  const months = computeAllTotals({
    expenses,
    income,
    iOweNovaByMonth: iOweNova,
  });
  const currentMonthKey = new Date().toISOString().slice(0, 7);
  const warnings = useMemo(
    () => getDashboardWarnings(expenses, rules, currentMonthKey),
    [expenses, rules, currentMonthKey],
  );

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
    <div className="space-y-6 min-w-0 overflow-x-hidden">
      <div className="space-y-1">
        <h1 className="text-2xl font-semibold">{t("dashboard.title")}</h1>
        <p className="text-sm text-muted-foreground">{t("dashboard.subtitle")}</p>
      </div>
      <MonthSelector
        value={selectedMonthKey}
        onChange={setSelectedMonthKey}
        options={monthOptions}
        currentMonthKey={currentMonthKey}
        isCurrentMonth={isCurrentMonth}
        t={t}
      />

      {warnings.length > 0 && (
        <div className="rounded-lg border border-destructive/40 bg-destructive/5 p-4 space-y-2">
          <div className="text-sm font-semibold text-destructive">
            {t("dashboard.warningsTitle")}
          </div>
          <ul className="text-sm text-destructive space-y-1">
            {warnings.map((warning, index) => (
              <li key={`${warning}-${index}`}>{warning}</li>
            ))}
          </ul>
        </div>
      )}

      <Accordion
        type="multiple"
        defaultValue={["summary", "overview", "debt", "spending", "bymonth"]}
        className="min-w-0 border-0 rounded-none pt-0 md:rounded-lg md:border md:pt-4"
      >
        <AccordionItem value="summary">
          <AccordionTrigger className="px-0 py-3 text-lg font-semibold hover:no-underline md:px-4 md:py-4">
            {t("dashboard.summary")}
          </AccordionTrigger>
          <AccordionContent className="px-0 pt-0 pb-0 space-y-6 md:px-4 md:pt-4 md:pb-4">
            <SummaryCards selectedMonth={selectedMonth} />
          </AccordionContent>
        </AccordionItem>
        <OverviewSection
          summaryBarData={summaryBarData}
          summaryBarConfig={summaryBarConfig}
          spendingPieData={spendingPieData}
          incomeStackedBarData={incomeStackedBarData}
          incomeStackedBarConfig={incomeStackedBarConfig}
          incomeCategoryKeys={incomeCategoryKeys}
          t={t}
        />
        <AccordionItem value="debt">
          <AccordionTrigger className="px-0 py-3 text-lg font-semibold hover:no-underline md:px-4 md:py-4">
            {t("dashboard.debt")}
          </AccordionTrigger>
          <AccordionContent className="px-0 pt-0 pb-0 space-y-6 md:px-4 md:pt-4 md:pb-4">
            <DebtSection debtSummary={debtSummary} />
          </AccordionContent>
        </AccordionItem>
        <SpendingByTypeSection
          fiftyFiftyByType={fiftyFiftyByType}
          mySpendingByType={mySpendingByType}
          tasnuvasSpendingByType={tasnuvasSpendingByType}
          fiftyFiftyChartConfig={fiftyFiftyChartConfig}
          mySpendingChartConfig={mySpendingChartConfig}
          tasnuvasSpendingChartConfig={tasnuvasSpendingChartConfig}
          t={t}
        />
        <AccordionItem value="bymonth">
          <AccordionTrigger className="px-0 py-3 text-lg font-semibold hover:no-underline md:px-4 md:py-4">
            {t("dashboard.byMonth")}
          </AccordionTrigger>
          <AccordionContent className="px-0 pt-0 pb-0 space-y-6 md:px-4 md:pt-4 md:pb-4">
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
