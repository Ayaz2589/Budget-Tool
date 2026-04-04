import { NetCashFlow } from "./widgets/NetCashFlow";
import { TotalSpent } from "./widgets/TotalSpent";
import { TotalIncome } from "./widgets/TotalIncome";
import { TotalDebt } from "./widgets/TotalDebt";
import { CashFlowChart } from "./widgets/CashFlowChart";
import { SpendByCategoryChart } from "./widgets/SpendByCategoryChart";
import { CategoryTrendsChart } from "./widgets/CategoryTrendsChart";
import { DailySpendingHeatmap } from "./widgets/DailySpendingHeatmap";
import { OwnerExpenseByOwner } from "./widgets/OwnerExpenseByOwner";
import type { useDashboardData } from "./useDashboardData";

type DashboardData = ReturnType<typeof useDashboardData>;

interface DashboardFixedLayoutProps {
  data: DashboardData;
}

function SectionDivider() {
  return <hr className="border-border/40" />;
}

export function DashboardFixedLayout({ data }: DashboardFixedLayoutProps) {
  return (
    <div className="space-y-12 pb-24">
      {/* KPI Row — flat metrics, no cards */}
      <div className="grid grid-cols-2 gap-x-6 gap-y-4 md:grid-cols-4">
        <NetCashFlow
          netCashFlow={data.kpis.netCashFlow}
          sparklineRows={data.kpiSparklineRows}
          size="md"
        />
        <TotalSpent
          totalSpent={data.kpis.totalSpent}
          spentVsLastMonthPct={data.kpis.spentVsLastMonthPct}
          sparklineRows={data.kpiSparklineRows}
          expenseScope={data.expenseScope}
          includeDebtPayments={data.includeDebtPayments}
          size="md"
        />
        <TotalIncome
          totalIncome={data.kpis.totalIncome}
          sparklineRows={data.kpiSparklineRows}
          size="md"
        />
        <TotalDebt
          debtOutstanding={data.kpis.debtOutstanding}
          debtPaidThisMonth={data.kpis.debtPaidThisMonth}
          sparklineRows={data.kpiSparklineRows}
          size="md"
        />
      </div>

      <SectionDivider />

      {/* Cash Flow Chart — full width */}
      <section>
        <CashFlowChart
          cashFlowDisplayRows={data.cashFlowDisplayRows}
          incomeOwnerKeys={data.incomeOwnerKeys}
          includeDebtPayments={data.includeDebtPayments}
          size="lg"
        />
      </section>

      <SectionDivider />

      {/* Daily Spending Heatmap — full width */}
      <section>
        <DailySpendingHeatmap
          dailySpending={data.dailySpending}
          size="lg"
        />
      </section>

      <SectionDivider />

      {/* Spend by Category + Category Trends — side by side */}
      <div className="grid grid-cols-1 items-start gap-6 md:grid-cols-2">
        <section>
          <SpendByCategoryChart
            parentCategorySlices={data.parentCategorySlices}
            size="lg"
          />
        </section>
        <section>
          <CategoryTrendsChart
            categoryTrends={data.categoryTrends}
            categoryComparison={data.categoryComparison}
            size="lg"
          />
        </section>
      </div>

      <SectionDivider />

      {/* Expense by Owner — full width */}
      <section>
        <OwnerExpenseByOwner
          visibleOwnerNetRows={data.visibleOwnerNetRows}
          ownerExpenseItemsByOwner={data.ownerExpenseItemsByOwner}
          totalSpentForSelectedRange={data.totalSpentForSelectedRange}
          percentFormatter={data.percentFormatter}
          size="lg"
        />
      </section>
    </div>
  );
}
