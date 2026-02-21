import { useTranslation } from "react-i18next";
import { formatCurrency } from "@/lib/format";
import { DsHelpTooltip, DsMetricCard } from "@/components/ds";
import type { WidgetSize } from "@/types/widget";

interface WidgetKpiTotalIncomeProps {
  totalIncome: number;
  size?: WidgetSize;
}

export function WidgetKpiTotalIncome({ totalIncome, size = "md" }: WidgetKpiTotalIncomeProps) {
  const { t } = useTranslation();
  const effectiveSize: WidgetSize = (["sm", "md", "lg"] as const).includes(size) ? size : "md";

  // lg: title + tooltip
  if (effectiveSize === "lg") {
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
      />
    );
  }

  // sm and md: title text only, value
  return (
    <DsMetricCard
      title={t("dashboard.kpiTotalIncomeMtd")}
      value={formatCurrency(totalIncome)}
    />
  );
}
