import { useTranslation } from "react-i18next";
import { AreaChart, Area } from "recharts";
import { ResponsiveContainer } from "recharts";
import { formatCurrency } from "@/lib/format";
import { DsMetricCard } from "@/components/ds";
import { formatDebtPaidSubtitle } from "@/pages/dashboard/insightsBuilder";
import type { WidgetSize } from "@/types/widget";

interface SparklineRow {
  monthKey: string;
  debtPaymentsTotal: number;
}

interface TotalDebtProps {
  debtOutstanding: number;
  debtPaidThisMonth: number;
  sparklineRows?: SparklineRow[];
  size?: WidgetSize;
}

export function TotalDebt({ debtOutstanding, debtPaidThisMonth, sparklineRows, size = "sm" }: TotalDebtProps) {
  const { t } = useTranslation();

  // sm: debt + label
  if (size === "sm") {
    return (
      <DsMetricCard
        title={t("dashboard.kpiTotalDebtOutstanding")}
        value={formatCurrency(debtOutstanding)}
      />
    );
  }

  // md: outstanding debt + sparkline (subtitle hidden when sparkline present to avoid clipping)
  const hasSparkline = sparklineRows && sparklineRows.length > 1;
  return (
    <DsMetricCard
      title={t("dashboard.kpiTotalDebtOutstanding")}
      value={formatCurrency(debtOutstanding)}
      subtitle={!hasSparkline ? formatDebtPaidSubtitle(debtPaidThisMonth, t) : undefined}
      sparkline={
        sparklineRows && sparklineRows.length > 1 ? (
          <ResponsiveContainer width="100%" height={28}>
            <AreaChart data={sparklineRows}>
              <defs>
                <linearGradient id="debtSpark" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="var(--viz-series-2)" stopOpacity={0.3} />
                  <stop offset="100%" stopColor="var(--viz-series-2)" stopOpacity={0.03} />
                </linearGradient>
              </defs>
              <Area type="monotone" dataKey="debtPaymentsTotal" stroke="var(--viz-series-2)" fill="url(#debtSpark)" strokeWidth={1.5} dot={false} isAnimationActive={false} />
            </AreaChart>
          </ResponsiveContainer>
        ) : undefined
      }
    />
  );
}
