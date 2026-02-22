import { useTranslation } from "react-i18next";
import { formatCurrency } from "@/lib/format";
import { DsMetricCard } from "@/components/ds";
import { formatDebtPaidSubtitle } from "@/pages/dashboard/insightsBuilder";
import type { WidgetSize } from "@/types/widget";

interface TotalDebtProps {
  debtOutstanding: number;
  debtPaidThisMonth: number;
  size?: WidgetSize;
}

export function TotalDebt({ debtOutstanding, debtPaidThisMonth, size = "sm" }: TotalDebtProps) {
  const { t } = useTranslation();

  // sm (~141×104px) / wide (~290×104px): debt + label
  if (size === "sm") {
    return (
      <DsMetricCard
        title={t("dashboard.kpiTotalDebtOutstanding")}
        value={formatCurrency(debtOutstanding)}
      />
    );
  }

  // md (~290×216px): outstanding debt + paid-this-month detail
  return (
    <DsMetricCard
      title={t("dashboard.kpiTotalDebtOutstanding")}
      value={formatCurrency(debtOutstanding)}
      subtitle={formatDebtPaidSubtitle(debtPaidThisMonth, t)}
    />
  );
}
