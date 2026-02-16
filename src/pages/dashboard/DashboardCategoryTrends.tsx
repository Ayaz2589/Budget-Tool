import { useTranslation } from "react-i18next";
import { Line, LineChart, ResponsiveContainer } from "recharts";
import { formatCurrency } from "@/lib/format";
import { DsChartCard, DsEmptyState } from "@/components/ds";
import type { DashboardCategoryTrend } from "@/types/dashboard";

const SPARKLINE_COLORS = [
  "var(--viz-series-1)",
  "var(--viz-series-4)",
  "var(--viz-series-3)",
  "var(--viz-series-2)",
];

interface DashboardCategoryTrendsProps {
  trends: DashboardCategoryTrend[];
}

export function DashboardCategoryTrends({
  trends,
}: DashboardCategoryTrendsProps) {
  const { t } = useTranslation();

  return (
    <DsChartCard title={t("dashboard.categoryTrendsTitle")} className="min-w-0">
      {trends.length === 0 ? (
        <DsEmptyState
          title={t("dashboard.categoryTrendsNoData")}
          className="py-4"
        />
      ) : (
        <div className="grid grid-cols-2 gap-2 lg:grid-cols-4">
          {trends.map((trend, index) => (
            <div
              key={trend.category}
              className="rounded-2xl border border-border bg-card px-3 py-2.5 md:px-4 md:py-3 space-y-1"
            >
              <p className="text-xs font-medium text-muted-foreground truncate">
                {trend.category}
              </p>
              <p className="text-lg font-semibold leading-tight tracking-tight">
                {formatCurrency(trend.currentAmount)}
              </p>
              <div className="h-8">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={trend.points}>
                    <Line
                      type="monotone"
                      dataKey="amount"
                      stroke={
                        SPARKLINE_COLORS[index % SPARKLINE_COLORS.length]
                      }
                      strokeWidth={1.5}
                      dot={false}
                      isAnimationActive={false}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          ))}
        </div>
      )}
    </DsChartCard>
  );
}
