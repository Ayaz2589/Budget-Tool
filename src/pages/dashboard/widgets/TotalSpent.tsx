import { useTranslation } from "react-i18next";
import { formatCurrency } from "@/lib/format";
import { DsMetricCard } from "@/components/ds";
import { formatSpentDeltaLabel } from "@/pages/dashboard/insightsBuilder";
import type { WidgetSize } from "@/types/widget";

interface TotalSpentProps {
  totalSpent: number;
  spentVsLastMonthPct: number | null;
  expenseScope: import("@/types/dashboard").DashboardExpenseScope;
  includeDebtPayments: boolean;
  size?: WidgetSize;
}

export function TotalSpent({
  totalSpent,
  spentVsLastMonthPct,
  size = "sm",
}: TotalSpentProps) {
  const { t } = useTranslation();

  // sm (~141×104px) / wide (~290×104px): total + label
  if (size === "sm") {
    return (
      <DsMetricCard
        title={t("dashboard.kpiTotalSpentMtd")}
        value={formatCurrency(totalSpent)}
      />
    );
  }

  // md (~290×216px): total + month-over-month change
  return (
    <DsMetricCard
      title={t("dashboard.kpiTotalSpentMtd")}
      value={formatCurrency(totalSpent)}
      subtitle={
        <span>
          {t("dashboard.vsLastMonth")}: {formatSpentDeltaLabel(spentVsLastMonthPct)}
        </span>
      }
    />
  );
}
