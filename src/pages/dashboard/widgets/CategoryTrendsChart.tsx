import { useTranslation } from "react-i18next";
import { Line, LineChart, XAxis, YAxis } from "recharts";
import { Activity } from "lucide-react";
import { formatCurrency } from "@/lib/format";
import { DsChartCard, DsEmptyState } from "@/components/ds";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import type { DashboardCategoryComparisonRow, DashboardCategoryTrends } from "@/types/dashboard";
import { cn } from "@/lib/utils";
import type { WidgetSize } from "@/lib/widgets/widget";

const LINE_COLORS = [
  "var(--viz-series-1)",
  "var(--viz-series-2)",
  "var(--viz-series-3)",
  "var(--viz-series-4)",
  "var(--viz-series-5)",
  "var(--viz-expense)",
  "var(--viz-debt)",
];

interface CategoryTrendsChartProps {
  categoryTrends: DashboardCategoryTrends;
  categoryComparison?: DashboardCategoryComparisonRow[];
  size?: WidgetSize;
}

export function CategoryTrendsChart({
  categoryTrends,
  categoryComparison,
  size = "lg",
}: CategoryTrendsChartProps) {
  const { t } = useTranslation();
  const title = t("dashboard.categoryTrends", { defaultValue: "Category Trends" });

  if (categoryTrends.categories.length === 0) {
    return (
      <DsChartCard title={title} size={size}>
        <DsEmptyState
          icon={<Activity className="size-5" />}
          title={t("dashboard.noCategoryTrends", { defaultValue: "No trend data" })}
          className="py-4"
        />
      </DsChartCard>
    );
  }

  const isSingleMonth = categoryTrends.monthKeys.length < 2;

  // sm: top category trend direction
  if (size === "sm") {
    const top = categoryTrends.series[0];
    if (!top || top.values.length < 2) {
      return (
        <DsChartCard title={title} size={size}>
          <p className="text-sm text-muted-foreground">{top?.category ?? "—"}</p>
        </DsChartCard>
      );
    }
    const last = top.values[top.values.length - 1]!;
    const prev = top.values[top.values.length - 2]!;
    const direction = last >= prev ? "up" : "down";
    return (
      <DsChartCard title={title} size={size}>
        <p className="text-sm font-medium">{top.category}</p>
        <p className="text-xs text-muted-foreground">
          {direction === "up" ? "\u2191" : "\u2193"} {formatCurrency(last)}
        </p>
      </DsChartCard>
    );
  }

  const config: Record<string, { label: string; color: string }> = {};
  categoryTrends.categories.forEach((cat, i) => {
    config[cat] = { label: cat, color: LINE_COLORS[i % LINE_COLORS.length]! };
  });

  const tooltipContent = (
    <ChartTooltip
      content={
        <ChartTooltipContent
          className="min-w-[12rem] bg-card border-border px-4 py-3 text-sm shadow-md"
          valueFormatter={(value) => formatCurrency(Number(value))}
        />
      }
    />
  );

  const legend = (
    <div className="flex flex-wrap justify-center gap-x-4 gap-y-1 pt-2">
      {categoryTrends.categories.map((cat, i) => (
        <span key={cat} className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <span
            className="inline-block size-2.5 rounded-full"
            style={{ backgroundColor: LINE_COLORS[i % LINE_COLORS.length] }}
          />
          {cat}
        </span>
      ))}
    </div>
  );

  // Single month: month-over-month comparison
  if (isSingleMonth && categoryComparison) {
    return (
      <DsChartCard title={title} size={size}>
        <div className="space-y-3">
          {categoryComparison.map((row, i) => {
            const arrow = row.direction === "up" ? "\u2191" : row.direction === "down" ? "\u2193" : "\u2014";
            const changeLabel = row.changePct === null
              ? t("dashboard.categoryNew", { defaultValue: "New" })
              : `${row.changePct >= 0 ? "+" : ""}${Math.round(row.changePct * 100)}%`;

            return (
              <div key={row.label} className="flex items-center justify-between text-sm">
                <span className="flex items-center gap-2">
                  <span
                    className="inline-block size-2.5 rounded-full"
                    style={{ backgroundColor: LINE_COLORS[i % LINE_COLORS.length] }}
                  />
                  <span className="font-medium">{row.label}</span>
                </span>
                <span className="flex items-center gap-3">
                  <span className="font-medium">{formatCurrency(row.currentValue)}</span>
                  <span className={cn(
                    "text-xs font-medium min-w-[4rem] text-right",
                    row.direction === "up" && "text-destructive",
                    row.direction === "down" && "text-emerald-500",
                    row.direction === "flat" && "text-muted-foreground",
                  )}>
                    {arrow} {changeLabel}
                  </span>
                </span>
              </div>
            );
          })}
        </div>
      </DsChartCard>
    );
  }

  // Multi-month: line chart
  const chartData = categoryTrends.monthKeys.map((mk, i) => {
    const row: Record<string, string | number> = { monthKey: mk };
    for (const s of categoryTrends.series) {
      row[s.category] = s.values[i] ?? 0;
    }
    return row;
  });

  return (
    <DsChartCard title={title} size={size}>
      <ChartContainer
        config={config}
        heightMobile={200}
        heightDesktop={size === "lg" ? 300 : 200}
      >
        <LineChart data={chartData}>
          <XAxis
            dataKey="monthKey"
            axisLine={false}
            tickLine={false}
            tickMargin={8}
          />
          <YAxis hide />
          {tooltipContent}
          {categoryTrends.categories.map((cat, i) => (
            <Line
              key={cat}
              type="monotone"
              dataKey={cat}
              stroke={LINE_COLORS[i % LINE_COLORS.length]}
              strokeWidth={2}
              dot={false}
            />
          ))}
        </LineChart>
      </ChartContainer>
      {legend}
    </DsChartCard>
  );
}
