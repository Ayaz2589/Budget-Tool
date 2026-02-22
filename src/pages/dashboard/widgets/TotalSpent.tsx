import { useTranslation } from "react-i18next";
import { AreaChart, Area } from "recharts";
import { ResponsiveContainer } from "recharts";
import { formatCurrency } from "@/lib/format";
import { DsMetricCard } from "@/components/ds";
import { formatSpentDeltaLabel } from "@/pages/dashboard/insightsBuilder";
import type { WidgetSize } from "@/types/widget";

interface SparklineRow {
  monthKey: string;
  expensesTotal: number;
}

interface TotalSpentProps {
  totalSpent: number;
  spentVsLastMonthPct: number | null;
  sparklineRows?: SparklineRow[];
  expenseScope: import("@/types/dashboard").DashboardExpenseScope;
  includeDebtPayments: boolean;
  size?: WidgetSize;
}

export function TotalSpent({
  totalSpent,
  spentVsLastMonthPct,
  sparklineRows,
  size = "sm",
}: TotalSpentProps) {
  const { t } = useTranslation();

  // sm: total + label
  if (size === "sm") {
    return (
      <DsMetricCard
        title={t("dashboard.kpiTotalSpentMtd")}
        value={formatCurrency(totalSpent)}
      />
    );
  }

  // md: total + sparkline (subtitle hidden when sparkline present to avoid clipping)
  const hasSparkline = sparklineRows && sparklineRows.length > 1;
  return (
    <DsMetricCard
      title={t("dashboard.kpiTotalSpentMtd")}
      value={formatCurrency(totalSpent)}
      subtitle={
        !hasSparkline ? (
          <span>
            {t("dashboard.vsLastMonth")}: {formatSpentDeltaLabel(spentVsLastMonthPct)}
          </span>
        ) : undefined
      }
      sparklineBottom={size === "lg"}
      sparkline={
        sparklineRows && sparklineRows.length > 1 ? (
          <ResponsiveContainer width={size === "lg" ? "100%" : "75%"} height={20}>
            <AreaChart data={sparklineRows}>
              <defs>
                <linearGradient id="spentSpark" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="var(--viz-series-1)" stopOpacity={0.3} />
                  <stop offset="100%" stopColor="var(--viz-series-1)" stopOpacity={0.03} />
                </linearGradient>
              </defs>
              <Area type="monotone" dataKey="expensesTotal" stroke="var(--viz-series-1)" fill="url(#spentSpark)" strokeWidth={1.5} dot={false} isAnimationActive={false} />
            </AreaChart>
          </ResponsiveContainer>
        ) : undefined
      }
    />
  );
}
