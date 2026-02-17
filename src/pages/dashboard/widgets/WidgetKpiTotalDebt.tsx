import { useTranslation } from "react-i18next";
import { formatCurrency } from "@/lib/format";
import { DsHelpTooltip, DsMetricCard } from "@/components/ds";
import { formatDebtPaidSubtitle } from "@/pages/dashboard/insightsBuilder";
import type { WidgetSize } from "@/types/widget";

interface WidgetKpiTotalDebtProps {
  debtOutstanding: number;
  debtPaidThisMonth: number;
  size?: WidgetSize;
}

export function WidgetKpiTotalDebt({ debtOutstanding, debtPaidThisMonth, size = "md" }: WidgetKpiTotalDebtProps) {
  const { t } = useTranslation();

  if (size === "sm") {
    return (
      <DsMetricCard
        title={t("dashboard.kpiTotalDebtOutstanding")}
        value={formatCurrency(debtOutstanding)}
      />
    );
  }

  return (
    <DsMetricCard
      title={
        <span className="inline-flex items-center gap-1.5">
          {t("dashboard.kpiTotalDebtOutstanding")}
          <DsHelpTooltip
            content={t("dashboard.help.kpiDebtOutstanding")}
            ariaLabel={t("common.help")}
          />
        </span>
      }
      value={formatCurrency(debtOutstanding)}
      subtitle={formatDebtPaidSubtitle(debtPaidThisMonth, t)}
    />
  );
}
