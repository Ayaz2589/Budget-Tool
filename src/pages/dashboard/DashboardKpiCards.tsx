import { WidgetKpiNetCashFlow } from "./widgets/WidgetKpiNetCashFlow";
import { WidgetKpiTotalSpent } from "./widgets/WidgetKpiTotalSpent";
import { WidgetKpiTotalIncome } from "./widgets/WidgetKpiTotalIncome";
import { WidgetKpiTotalDebt } from "./widgets/WidgetKpiTotalDebt";
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
  return (
    <div data-tour="dashboard-kpis" className="grid grid-cols-2 gap-1.5 md:grid-cols-2 md:gap-3 xl:grid-cols-4">
      <WidgetKpiNetCashFlow netCashFlow={kpis.netCashFlow} />
      <WidgetKpiTotalSpent
        totalSpent={kpis.totalSpent}
        spentVsLastMonthPct={kpis.spentVsLastMonthPct}
        expenseScope={expenseScope}
        includeDebtPayments={includeDebtPayments}
      />
      <WidgetKpiTotalIncome totalIncome={kpis.totalIncome} />
      <WidgetKpiTotalDebt
        debtOutstanding={kpis.debtOutstanding}
        debtPaidThisMonth={kpis.debtPaidThisMonth}
      />
    </div>
  );
}
