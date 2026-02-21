import { useTranslation } from "react-i18next";
import { Cell, Pie, PieChart } from "recharts";
import { formatCurrency } from "@/lib/format";
import { DsChartCard, DsEmptyState, DsLegendList } from "@/components/ds";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import type { DashboardCategorySlice } from "@/types/dashboard";
import type { WidgetSize } from "@/types/widget";

const DONUT_COLORS = [
  "var(--viz-series-1)",
  "var(--viz-series-4)",
  "var(--viz-series-3)",
  "var(--viz-series-2)",
  "var(--viz-series-5)",
  "var(--viz-expense)",
  "var(--viz-debt)",
];

function asNumber(value: unknown): number {
  if (typeof value === "number") return value;
  if (typeof value === "string") {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : 0;
  }
  return 0;
}

interface DashboardCategoryChartProps {
  categorySlices: DashboardCategorySlice[];
  size?: WidgetSize;
}

export function DashboardCategoryChart({
  categorySlices,
  size,
}: DashboardCategoryChartProps) {
  const { t } = useTranslation();
  const effectiveSize: WidgetSize = size && (["sm", "md", "lg"] as const).includes(size) ? size : "md";

  const chartTitle = t("dashboard.chartSpendingBreakdown");

  if (categorySlices.length === 0) {
    return (
      <DsChartCard title={chartTitle} className="min-w-0" size={effectiveSize}>
        <DsEmptyState title={t("dashboard.chartNoSpendingCategories")} className="py-4" />
      </DsChartCard>
    );
  }

  // sm: show top category name and percentage
  if (effectiveSize === "sm") {
    const total = categorySlices.reduce((sum, s) => sum + s.value, 0);
    const sorted = [...categorySlices].sort((a, b) => b.value - a.value);
    const top = sorted[0];
    const topPct = total > 0 ? Math.round((top.value / total) * 100) : 0;

    return (
      <DsChartCard title={chartTitle} className="min-w-0" size={effectiveSize}>
        <div className="space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground">{top.label}</span>
            <span className="text-sm font-semibold">{topPct}%</span>
          </div>
          <p className="text-lg font-semibold">{formatCurrency(top.value)}</p>
          {sorted.length > 1 && (
            <p className="text-xs text-muted-foreground">
              {t("dashboard.moreItemsCount", { count: sorted.length - 1 })}
            </p>
          )}
        </div>
      </DsChartCard>
    );
  }

  const tooltipContent = (
    <ChartTooltipContent
      className="min-w-[16rem] bg-card border-border px-4 py-3 text-sm shadow-md"
      labelClassName="text-sm font-semibold"
      valueFormatter={(value) => formatCurrency(asNumber(value))}
    />
  );

  const chartConfig = { value: { label: t("dashboard.chartAmount"), color: DONUT_COLORS[0]! } };

  // lg: full pie chart with complete legend
  if (effectiveSize === "lg") {
    return (
      <DsChartCard title={chartTitle} className="min-w-0" size={effectiveSize}>
        <ChartContainer config={chartConfig} heightMobile={210} heightDesktop={260}>
          <PieChart>
            <Pie data={categorySlices} dataKey="value" nameKey="label" outerRadius={90}>
              {categorySlices.map((slice, index) => (
                <Cell key={slice.label} fill={DONUT_COLORS[index % DONUT_COLORS.length]} />
              ))}
            </Pie>
            <ChartTooltip content={tooltipContent} />
          </PieChart>
        </ChartContainer>
        <DsLegendList
          items={categorySlices.map((slice, index) => ({
            key: slice.label,
            label: slice.label,
            value: formatCurrency(slice.value),
            color: DONUT_COLORS[index % DONUT_COLORS.length]!,
          }))}
        />
      </DsChartCard>
    );
  }

  // md (default): donut chart with truncated legend (top 4)
  return (
    <DsChartCard title={chartTitle} className="min-w-0" size={effectiveSize}>
      <ChartContainer config={chartConfig} heightMobile={210} heightDesktop={260}>
        <PieChart>
          <Pie
            data={categorySlices}
            dataKey="value"
            nameKey="label"
            innerRadius={42}
            outerRadius={70}
          >
            {categorySlices.map((slice, index) => (
              <Cell key={slice.label} fill={DONUT_COLORS[index % DONUT_COLORS.length]} />
            ))}
          </Pie>
          <ChartTooltip content={tooltipContent} />
        </PieChart>
      </ChartContainer>
      <DsLegendList
        items={categorySlices.slice(0, 4).map((slice, index) => ({
          key: slice.label,
          label: slice.label,
          value: formatCurrency(slice.value),
          color: DONUT_COLORS[index % DONUT_COLORS.length]!,
        }))}
      />
    </DsChartCard>
  );
}
