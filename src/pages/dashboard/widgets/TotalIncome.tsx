import { useTranslation } from "react-i18next";
import { AreaChart, Area } from "recharts";
import { ResponsiveContainer } from "recharts";
import { formatCurrency } from "@/lib/format";
import { DsHelpTooltip, DsMetricCard } from "@/components/ds";
import type { WidgetSize } from "@/types/widget";

interface SparklineRow {
  monthKey: string;
  incomeTotal: number;
}

interface TotalIncomeProps {
  totalIncome: number;
  sparklineRows?: SparklineRow[];
  size?: WidgetSize;
}

export function TotalIncome({ totalIncome, sparklineRows, size = "sm" }: TotalIncomeProps) {
  const { t } = useTranslation();

  // sm: total + label
  if (size === "sm") {
    return (
      <DsMetricCard
        title={t("dashboard.kpiTotalIncomeMtd")}
        value={formatCurrency(totalIncome)}
      />
    );
  }

  // md: total + tooltip + sparkline
  return (
    <DsMetricCard
      title={
        <span className="inline-flex items-center gap-1.5">
          {t("dashboard.kpiTotalIncomeMtd")}
          <DsHelpTooltip
            content={t("dashboard.help.kpiTotalIncome")}
            ariaLabel={t("common.help")}
          />
        </span>
      }
      value={formatCurrency(totalIncome)}
      sparkline={
        sparklineRows && sparklineRows.length > 1 ? (
          <ResponsiveContainer width="100%" height={28}>
            <AreaChart data={sparklineRows}>
              <defs>
                <linearGradient id="incomeSpark" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="var(--viz-series-3)" stopOpacity={0.3} />
                  <stop offset="100%" stopColor="var(--viz-series-3)" stopOpacity={0.03} />
                </linearGradient>
              </defs>
              <Area type="monotone" dataKey="incomeTotal" stroke="var(--viz-series-3)" fill="url(#incomeSpark)" strokeWidth={1.5} dot={false} isAnimationActive={false} />
            </AreaChart>
          </ResponsiveContainer>
        ) : undefined
      }
    />
  );
}
