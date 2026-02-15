import { useTranslation } from "react-i18next";
import { formatCurrency } from "@/lib/format";
import { DsHelpTooltip, DsMetricCard } from "@/components/ds";
import { formatDebtPaidSubtitle, formatSpentDeltaLabel } from "@/pages/dashboard/insightsBuilder";
import type { DashboardExpenseScope } from "@/types/dashboard";
import type { DashboardKpis } from "@/types/dashboard";

interface DashboardKpiCardsProps {
  kpis: DashboardKpis;
  expenseScope: DashboardExpenseScope;
  includeDebtPayments: boolean;
}

export function DashboardKpiCards({
  kpis,
  expenseScope,
  includeDebtPayments,
}: DashboardKpiCardsProps) {
  const { t } = useTranslation();

  return (
    <div data-tour="dashboard-kpis" className="grid grid-cols-2 gap-1.5 md:grid-cols-2 md:gap-3 xl:grid-cols-4">
      <DsMetricCard
        title={
          <span className="inline-flex items-center gap-1.5">
            {t("dashboard.kpiNetCashFlowMtd")}
            <DsHelpTooltip
              content={t("dashboard.help.kpiNetCashFlow")}
              ariaLabel={t("common.help")}
            />
          </span>
        }
        value={formatCurrency(kpis.netCashFlow)}
        tone={kpis.netCashFlow >= 0 ? "positive" : "negative"}
      />
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
        value={formatCurrency(kpis.totalSpent)}
        subtitle={
          <span className="space-y-0.5">
            <span className="block">
              {t("dashboard.vsLastMonth")}: {formatSpentDeltaLabel(kpis.spentVsLastMonthPct)}
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
        value={formatCurrency(kpis.totalIncome)}
      />
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
        value={formatCurrency(kpis.debtOutstanding)}
        subtitle={formatDebtPaidSubtitle(kpis.debtPaidThisMonth, t)}
      />
    </div>
  );
}
