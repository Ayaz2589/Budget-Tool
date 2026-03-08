import { useTranslation } from "react-i18next";
import { Cell, Pie, PieChart } from "recharts";
import { formatCurrency } from "@/lib/format";
import { DsChartCard, DsEmptyState, DsLegendList } from "@/components/ds";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import type { DashboardOwnerSlice } from "@/types/dashboard";
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

interface OwnerSplitChartProps {
  ownerSlices: DashboardOwnerSlice[];
  size?: WidgetSize;
}

export function OwnerSplitChart({
  ownerSlices,
  size,
}: OwnerSplitChartProps) {
  const { t } = useTranslation();
  const effectiveSize: WidgetSize = size ?? "md";

  const chartTitle = t("dashboard.chartSharedVsIndividualSpending");

  if (ownerSlices.length === 0) {
    return (
      <DsChartCard title={chartTitle} className="min-w-0" size={effectiveSize}>
        <DsEmptyState title={t("dashboard.chartNoOwnerSplitData")} className="py-4" />
      </DsChartCard>
    );
  }

  // sm: summary text (owner count + largest contributor)
  if (effectiveSize === "sm") {
    const sorted = [...ownerSlices].sort((a, b) => b.value - a.value);
    const largest = sorted[0];
    return (
      <DsChartCard title={chartTitle} className="min-w-0" size={effectiveSize}>
        <div className="space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground">
              {t("dashboard.splitOwners")}
            </span>
            <span className="text-sm font-semibold">{ownerSlices.length}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground truncate mr-2">
              {largest.label}
            </span>
            <span className="text-sm font-semibold shrink-0">{formatCurrency(largest.value)}</span>
          </div>
        </div>
      </DsChartCard>
    );
  }

  // Single-owner: skip pie chart, show direct summary at md/lg
  if (ownerSlices.length === 1) {
    const single = ownerSlices[0];
    return (
      <DsChartCard title={chartTitle} className="min-w-0" size={effectiveSize}>
        <div className="flex items-center justify-between py-2">
          <span className="text-sm font-medium truncate">{single.label}</span>
          <span className="text-lg font-semibold">{formatCurrency(single.value)}</span>
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

  const legend = (
    <DsLegendList
      items={ownerSlices.map((slice, index) => ({
        key: slice.key,
        label: slice.label,
        value: formatCurrency(slice.value),
        color: DONUT_COLORS[index % DONUT_COLORS.length]!,
      }))}
    />
  );

  // md: side-by-side pie + legend
  if (effectiveSize === "md") {
    return (
      <DsChartCard title={chartTitle} className="min-w-0" size={effectiveSize}>
        <div className="flex items-center gap-6">
          <div className="w-[160px] shrink-0">
            <ChartContainer config={chartConfig} fillHeight>
              <PieChart>
                <Pie
                  data={ownerSlices.filter((s) => s.value > 0)}
                  dataKey="value"
                  nameKey="label"
                  innerRadius={35}
                  outerRadius={60}
                  startAngle={180}
                  endAngle={0}
                  cx="50%"
                  cy="80%"
                  cornerRadius={0}
                  paddingAngle={0}
                  minAngle={5}
                >
                  {ownerSlices.filter((s) => s.value > 0).map((slice, index) => (
                    <Cell key={slice.key} fill={DONUT_COLORS[index % DONUT_COLORS.length]} />
                  ))}
                </Pie>
                <ChartTooltip content={tooltipContent} />
              </PieChart>
            </ChartContainer>
          </div>
          <div className="min-w-0 flex-1">
            {legend}
          </div>
        </div>
      </DsChartCard>
    );
  }

  // lg: side-by-side large pie chart + legend on right
  return (
    <DsChartCard title={chartTitle} className="min-w-0" size={effectiveSize}>
      <div className="flex items-center gap-8">
        <div className="w-[280px] shrink-0">
          <ChartContainer config={chartConfig} fillHeight>
            <PieChart>
              <Pie
                data={ownerSlices.filter((s) => s.value > 0)}
                dataKey="value"
                nameKey="label"
                innerRadius={65}
                outerRadius={100}
                startAngle={180}
                endAngle={0}
                cx="50%"
                cy="80%"
                cornerRadius={0}
                paddingAngle={0}
                minAngle={5}
              >
                {ownerSlices.filter((s) => s.value > 0).map((slice, index) => (
                  <Cell key={slice.key} fill={DONUT_COLORS[index % DONUT_COLORS.length]} />
                ))}
              </Pie>
              <ChartTooltip content={tooltipContent} />
            </PieChart>
          </ChartContainer>
        </div>
        <div className="min-w-0 flex-1">
          {legend}
        </div>
      </div>
    </DsChartCard>
  );
}
