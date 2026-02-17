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

  if (size === "sm") {
    return (
      <DsMetricCard
        title={t("dashboard.kpiTotalIncomeMtd")}
        value={formatCurrency(totalIncome)}
      />
    );
  }

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
