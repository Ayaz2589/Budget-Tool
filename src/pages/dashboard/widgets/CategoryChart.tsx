import { useTranslation } from "react-i18next";
import { Cell, Pie, PieChart } from "recharts";
import { formatCurrency } from "@/lib/format";
import { DsChartCard, DsEmptyState, DsLegendList } from "@/components/ds";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import type { DashboardCategorySlice } from "@/types/dashboard";
import type { WidgetSize } from "@/lib/widgets/widget";

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

interface CategoryChartProps {
  categorySlices: DashboardCategorySlice[];
  size?: WidgetSize;
}

export function CategoryChart({
  categorySlices,
  size,
}: CategoryChartProps) {
  const { t } = useTranslation();
  const effectiveSize: WidgetSize = size ?? "md";

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

  // lg: full pie chart with legend
  if (effectiveSize === "lg") {
    return (
      <DsChartCard title={chartTitle} className="min-w-0" size={effectiveSize}>
        <ChartContainer config={chartConfig} heightMobile={200} heightDesktop={220}>
          <PieChart>
            <Pie data={categorySlices} dataKey="value" nameKey="label" outerRadius={80}>
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

  // md: side-by-side pie + legend
  return (
    <DsChartCard title={chartTitle} className="min-w-0" size={effectiveSize}>
      <div className="flex items-center gap-6">
        <div className="w-[160px] shrink-0">
          <ChartContainer config={chartConfig} heightMobile={140} heightDesktop={140}>
            <PieChart>
              <Pie data={categorySlices} dataKey="value" nameKey="label" outerRadius={60}>
                {categorySlices.map((slice, index) => (
                  <Cell key={slice.label} fill={DONUT_COLORS[index % DONUT_COLORS.length]} />
                ))}
              </Pie>
              <ChartTooltip content={tooltipContent} />
            </PieChart>
          </ChartContainer>
        </div>
        <div className="min-w-0 flex-1">
          <DsLegendList
            items={categorySlices.map((slice, index) => ({
              key: slice.label,
              label: slice.label,
              value: formatCurrency(slice.value),
              color: DONUT_COLORS[index % DONUT_COLORS.length]!,
            }))}
          />
        </div>
      </div>
    </DsChartCard>
  );
}
