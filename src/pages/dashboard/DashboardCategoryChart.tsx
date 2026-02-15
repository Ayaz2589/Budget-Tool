import { useTranslation } from "react-i18next";
import { Cell, Pie, PieChart } from "recharts";
import { formatCurrency } from "@/lib/format";
import { DsChartCard, DsEmptyState, DsLegendList } from "@/components/ds";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import type { DashboardCategorySlice } from "@/types/dashboard";

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
}

export function DashboardCategoryChart({
  categorySlices,
}: DashboardCategoryChartProps) {
  const { t } = useTranslation();

  return (
    <DsChartCard title={t("dashboard.chartSpendingBreakdown")} className="min-w-0">
      {categorySlices.length === 0 ? (
        <DsEmptyState title={t("dashboard.chartNoSpendingCategories")} className="py-4" />
      ) : (
        <>
          <div className="hidden md:block">
            <ChartContainer config={{ value: { label: t("dashboard.chartAmount"), color: DONUT_COLORS[0]! } }} heightMobile={210} heightDesktop={260}>
              <PieChart>
                <Pie
                  data={categorySlices}
                  dataKey="value"
                  nameKey="label"
                  outerRadius={90}
                >
                  {categorySlices.map((slice, index) => (
                    <Cell key={slice.label} fill={DONUT_COLORS[index % DONUT_COLORS.length]} />
                  ))}
                </Pie>
                <ChartTooltip
                  content={
                    <ChartTooltipContent
                      className="min-w-[16rem] bg-card border-border px-4 py-3 text-sm shadow-md"
                      labelClassName="text-sm font-semibold"
                      valueFormatter={(value) => formatCurrency(asNumber(value))}
                    />
                  }
                />
              </PieChart>
            </ChartContainer>
          </div>
          <div className="md:hidden space-y-2">
            <ChartContainer config={{ value: { label: t("dashboard.chartAmount"), color: DONUT_COLORS[0]! } }} heightMobile={210} heightDesktop={260}>
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
                <ChartTooltip
                  content={
                    <ChartTooltipContent
                      className="min-w-[16rem] bg-card border-border px-4 py-3 text-sm shadow-md"
                      labelClassName="text-sm font-semibold"
                      valueFormatter={(value) => formatCurrency(asNumber(value))}
                    />
                  }
                />
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
          </div>
        </>
      )}
    </DsChartCard>
  );
}
