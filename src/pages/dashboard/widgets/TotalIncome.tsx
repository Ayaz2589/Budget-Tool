import { useTranslation } from "react-i18next";
import { formatCurrency } from "@/lib/format";
import { DsHelpTooltip, DsMetricCard } from "@/components/ds";
import type { WidgetSize } from "@/types/widget";

interface TotalIncomeProps {
  totalIncome: number;
  size?: WidgetSize;
}

export function TotalIncome({ totalIncome, size = "sm" }: TotalIncomeProps) {
  const { t } = useTranslation();

  // sm (~141×104px) / wide (~290×104px): total + label
  if (size === "sm") {
    return (
      <DsMetricCard
        title={t("dashboard.kpiTotalIncomeMtd")}
        value={formatCurrency(totalIncome)}
      />
    );
  }

  // md (~290×216px): total + tooltip for additional context
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
