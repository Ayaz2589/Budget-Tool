import { useTranslation } from "react-i18next";
import { formatCurrency } from "@/lib/format";
import { DsHelpTooltip, DsMetricCard } from "@/components/ds";
import { formatSpentDeltaLabel } from "@/pages/dashboard/insightsBuilder";
import type { DashboardExpenseScope } from "@/types/dashboard";
import type { WidgetSize } from "@/types/widget";

interface WidgetKpiTotalSpentProps {
  totalSpent: number;
  spentVsLastMonthPct: number | null;
  expenseScope: DashboardExpenseScope;
  includeDebtPayments: boolean;
  size?: WidgetSize;
}

export function WidgetKpiTotalSpent({
  totalSpent,
  spentVsLastMonthPct,
  expenseScope,
  includeDebtPayments,
  size = "md",
}: WidgetKpiTotalSpentProps) {
  const { t } = useTranslation();

  if (size === "sm") {
    return (
      <DsMetricCard
        title={t("dashboard.kpiTotalSpentMtd")}
        value={formatCurrency(totalSpent)}
      />
    );
  }

  return (
    <DsMetricCard
      title={
        <span className="inline-flex items-center gap-1.5">
          {t("dashboard.kpiTotalSpentMtd")}
          <DsHelpTooltip
            content={t("dashboard.help.kpiTotalSpent")}
            ariaLabel={t("common.help")}
          />
        </span>
      }
      value={formatCurrency(totalSpent)}
      subtitle={
        <span className="space-y-0.5">
          <span className="block">
            {t("dashboard.vsLastMonth")}: {formatSpentDeltaLabel(spentVsLastMonthPct)}
          </span>
          <span className="block text-xs">
            {expenseScope === "all" && includeDebtPayments
              ? t("dashboard.kpiTotalSpentDefAll")
              : expenseScope === "all" && !includeDebtPayments
                ? t("dashboard.kpiTotalSpentDefAllExcludeDebt")
                : expenseScope === "exclude-mortgage" && includeDebtPayments
                  ? t("dashboard.kpiTotalSpentDefExcludeMortgage")
                  : t("dashboard.kpiTotalSpentDefExcludeMortgageAndDebt")}
          </span>
        </span>
      }
    />
  );
}
