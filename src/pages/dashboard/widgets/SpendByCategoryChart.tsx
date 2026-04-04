import { useState } from "react";
import { useTranslation } from "react-i18next";
import { BarChart3, ChevronDown, ChevronUp } from "lucide-react";
import { formatCurrency } from "@/lib/format";
import { DsChartCard, DsEmptyState } from "@/components/ds";
import type { DashboardParentCategorySlice } from "@/types/dashboard";
import type { WidgetSize } from "@/lib/widgets/widget";

const BAR_COLORS = [
  "var(--viz-series-1)",
  "var(--viz-series-2)",
  "var(--viz-series-3)",
  "var(--viz-series-4)",
  "var(--viz-series-5)",
  "var(--viz-expense)",
  "var(--viz-debt)",
];

interface SpendByCategoryChartProps {
  parentCategorySlices: DashboardParentCategorySlice[];
  size?: WidgetSize;
}

export function SpendByCategoryChart({
  parentCategorySlices,
  size = "lg",
}: SpendByCategoryChartProps) {
  const { t } = useTranslation();
  const title = t("dashboard.spendByCategory", { defaultValue: "Spend by Category" });

  if (parentCategorySlices.length === 0) {
    return (
      <DsChartCard title={title} size={size}>
        <DsEmptyState
          icon={<BarChart3 className="size-5" />}
          title={t("dashboard.noCategoryData", { defaultValue: "No category data" })}
          className="py-4"
        />
      </DsChartCard>
    );
  }

  // sm: summary
  if (size === "sm") {
    const top = parentCategorySlices[0];
    return (
      <DsChartCard title={title} size={size}>
        <div className="space-y-1">
          <p className="text-lg font-semibold">{top?.label}</p>
          <p className="text-sm text-muted-foreground">{formatCurrency(top?.value ?? 0)}</p>
        </div>
      </DsChartCard>
    );
  }

  // md/lg: horizontal bar chart with labels and amounts
  const COLLAPSED_COUNT = 5;
  const [expanded, setExpanded] = useState(false);
  const data = parentCategorySlices.map((slice, i) => ({
    ...slice,
    fill: BAR_COLORS[i % BAR_COLORS.length],
  }));
  const hasMore = data.length > COLLAPSED_COUNT;
  const visibleData = expanded ? data : data.slice(0, COLLAPSED_COUNT);

  return (
    <DsChartCard title={title} size={size}>
      <div className="space-y-3">
        {visibleData.map((row) => {
          const maxValue = parentCategorySlices[0]?.value ?? 1;
          const pct = Math.round((row.value / maxValue) * 100);
          return (
            <div key={row.label} className="space-y-1">
              <div className="flex items-center justify-between text-sm">
                <span className="font-medium">{row.label}</span>
                <span className="text-muted-foreground">{formatCurrency(row.value)}</span>
              </div>
              <div className="h-2 w-full rounded-full bg-muted">
                <div
                  className="h-2 rounded-full"
                  style={{ width: `${pct}%`, backgroundColor: row.fill }}
                />
              </div>
            </div>
          );
        })}
        {hasMore && (
          <button
            type="button"
            className="flex w-full items-center justify-center gap-1 pt-1 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors"
            onClick={() => setExpanded(!expanded)}
          >
            {expanded ? (
              <>Show less <ChevronUp className="size-3.5" /></>
            ) : (
              <>+{data.length - COLLAPSED_COUNT} more <ChevronDown className="size-3.5" /></>
            )}
          </button>
        )}
      </div>
    </DsChartCard>
  );
}
