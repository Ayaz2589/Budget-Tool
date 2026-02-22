import { NetCashFlow } from "./widgets/NetCashFlow";
import { TotalSpent } from "./widgets/TotalSpent";
import { TotalIncome } from "./widgets/TotalIncome";
import { TotalDebt } from "./widgets/TotalDebt";
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
      <NetCashFlow netCashFlow={kpis.netCashFlow} />
      <TotalSpent
        totalSpent={kpis.totalSpent}
        spentVsLastMonthPct={kpis.spentVsLastMonthPct}
        expenseScope={expenseScope}
        includeDebtPayments={includeDebtPayments}
      />
      <TotalIncome totalIncome={kpis.totalIncome} />
      <TotalDebt
        debtOutstanding={kpis.debtOutstanding}
        debtPaidThisMonth={kpis.debtPaidThisMonth}
      />
    </div>
  );
}
