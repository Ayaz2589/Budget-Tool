import { useTranslation } from "react-i18next";
import { ListOrdered } from "lucide-react";
import { formatCurrency } from "@/lib/format";
import { DsChartCard, DsEmptyState } from "@/components/ds";
import type { DashboardCategorySlice } from "@/types/dashboard";
import type { WidgetSize } from "@/lib/widgets/widget";

const BAR_COLORS = [
  "var(--viz-series-1)",
  "var(--viz-series-2)",
  "var(--viz-series-3)",
  "var(--viz-series-4)",
  "var(--viz-series-5)",
];

interface TopCategoriesProps {
  categorySlices: DashboardCategorySlice[];
  size?: WidgetSize;
}

export function TopCategories({
  categorySlices,
  size = "lg",
}: TopCategoriesProps) {
  const { t } = useTranslation();
  const title = t("dashboard.topCategories", { defaultValue: "Top Categories" });

  if (categorySlices.length === 0) {
    return (
      <DsChartCard title={title} size={size}>
        <DsEmptyState
          icon={<ListOrdered className="size-5" />}
          title={t("dashboard.noCategoryData", { defaultValue: "No category data" })}
          className="py-4"
        />
      </DsChartCard>
    );
  }

  const top5 = categorySlices.slice(0, 5);
  const total = categorySlices.reduce((sum, s) => sum + s.value, 0);
  const maxValue = top5[0]?.value ?? 1;

  // sm: top category only
  if (size === "sm") {
    const top = top5[0]!;
    const pct = total > 0 ? Math.round((top.value / total) * 100) : 0;
    return (
      <DsChartCard title={title} size={size}>
        <p className="text-sm font-medium">{top.label}</p>
        <p className="text-xs text-muted-foreground">
          {formatCurrency(top.value)} ({pct}%)
        </p>
      </DsChartCard>
    );
  }

  return (
    <DsChartCard title={title} size={size}>
      <div className="space-y-3">
        {top5.map((slice, i) => {
          const pct = total > 0 ? Math.round((slice.value / total) * 100) : 0;
          const barPct = Math.round((slice.value / maxValue) * 100);
          return (
            <div key={slice.label} className="space-y-1">
              <div className="flex items-center justify-between text-sm">
                <span className="flex items-center gap-2">
                  <span className="w-5 text-right text-xs font-medium text-muted-foreground">
                    {i + 1}
                  </span>
                  <span className="font-medium">{slice.label}</span>
                </span>
                <span className="flex items-center gap-2">
                  <span className="text-xs text-muted-foreground">{pct}%</span>
                  <span className="w-20 text-right font-medium">{formatCurrency(slice.value)}</span>
                </span>
              </div>
              <div className="ml-7 h-1.5 w-full rounded-full bg-muted">
                <div
                  className="h-1.5 rounded-full"
                  style={{
                    width: `${barPct}%`,
                    backgroundColor: BAR_COLORS[i % BAR_COLORS.length],
                  }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </DsChartCard>
  );
}
