import { useTranslation } from "react-i18next";
import { formatCurrency } from "@/lib/format";
import { NetCashFlow } from "./widgets/NetCashFlow";
import { TotalSpent } from "./widgets/TotalSpent";
import { TotalIncome } from "./widgets/TotalIncome";
import { TotalDebt } from "./widgets/TotalDebt";
import { CashFlowChart } from "./widgets/CashFlowChart";
import { NetTrendChart } from "./widgets/NetTrendChart";
import { CategoryChart } from "./widgets/CategoryChart";
import { OwnerSplitChart } from "./widgets/OwnerSplitChart";
import { DebtSnapshot } from "./widgets/DebtSnapshot";
import { SpendBySource } from "./widgets/SpendBySource";
import { RecentActivity } from "./widgets/RecentActivity";
import { OwnerTransfers } from "./widgets/OwnerTransfers";
import { OwnerExpenseByOwner } from "./widgets/OwnerExpenseByOwner";
import type { useDashboardData } from "./useDashboardData";

type DashboardData = ReturnType<typeof useDashboardData>;

interface DashboardFixedLayoutProps {
  data: DashboardData;
}

function SectionDivider() {
  return <hr className="border-border/40" />;
}

function MonthInReview({ data }: { data: DashboardData }) {
  const { t } = useTranslation();
  const { kpis } = data;
  const net = kpis.netCashFlow;

  const [year, month] = data.selectedMonthKey.split("-");
  const monthDate = new Date(Number(year), Number(month) - 1);
  const monthName = monthDate.toLocaleString("default", { month: "long", year: "numeric" });

  return (
    <div className="mt-4 rounded-lg border border-border/40 bg-muted/30 px-5 py-4 space-y-1.5">
      <h2 className="text-base font-semibold tracking-tight md:text-lg">{monthName}</h2>
      <p className="text-sm leading-relaxed text-muted-foreground">
        {net >= 0
          ? t("dashboard.summaryPositive", {
              defaultValue: `You earned ${formatCurrency(kpis.totalIncome)} and spent ${formatCurrency(kpis.totalSpent)}, leaving ${formatCurrency(net)} in positive cash flow.`,
            })
          : t("dashboard.summaryNegative", {
              defaultValue: `You earned ${formatCurrency(kpis.totalIncome)} and spent ${formatCurrency(kpis.totalSpent)}. Spending exceeded income by ${formatCurrency(Math.abs(net))}.`,
            })}
        {kpis.debtOutstanding > 0 &&
          ` ${t("dashboard.summaryDebt", { defaultValue: `${formatCurrency(kpis.debtOutstanding)} in debt remains outstanding.` })}`}
      </p>
    </div>
  );
}

export function DashboardFixedLayout({ data }: DashboardFixedLayoutProps) {
  return (
    <div className="space-y-12">
      {/* Month in Review — narrative summary */}
      <MonthInReview data={data} />

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
      <section className="space-y-4">
        <CashFlowChart
          cashFlowDisplayRows={data.cashFlowDisplayRows}
          incomeOwnerKeys={data.incomeOwnerKeys}
          includeDebtPayments={data.includeDebtPayments}
          size="lg"
        />
      </section>

      <SectionDivider />

      {/* Net Trend + Category Breakdown */}
      <div className="grid grid-cols-1 items-start gap-6 md:grid-cols-2">
        <section className="space-y-4">
          <NetTrendChart
            netCashFlowRows={data.netCashFlowRows}
            range={data.range}
            size="lg"
          />
        </section>
        <section className="space-y-4">
          <CategoryChart
            categorySlices={data.categorySlices}
            size="lg"
          />
        </section>
      </div>

      <SectionDivider />

      {/* Owner Split + Spend by Source */}
      <div className="grid grid-cols-1 items-start gap-6 md:grid-cols-2">
        <section className="space-y-4">
          <OwnerSplitChart
            ownerSlices={data.ownerSlices}
            size="lg"
          />
        </section>
        <section className="space-y-4">
          <SpendBySource
            spendBySourceRows={data.spendBySourceRows}
            size="lg"
          />
        </section>
      </div>

      <SectionDivider />

      {/* Debt Snapshot + Recent Activity */}
      <div className="grid grid-cols-1 items-start gap-6 md:grid-cols-2">
        <section className="space-y-4">
          <DebtSnapshot
            debtRows={data.debtRows}
            size="lg"
          />
        </section>
        <section className="space-y-4">
          <RecentActivity
            recentActivity={data.recentActivity}
            size="lg"
          />
        </section>
      </div>

      <SectionDivider />

      {/* Owner Expense Breakdown — full width */}
      <section className="space-y-4">
        <OwnerExpenseByOwner
          visibleOwnerNetRows={data.visibleOwnerNetRows}
          ownerExpenseItemsByOwner={data.ownerExpenseItemsByOwner}
          totalSpentForSelectedRange={data.totalSpentForSelectedRange}
          percentFormatter={data.percentFormatter}
          size="lg"
        />
      </section>

      <SectionDivider />

      {/* Owner Transfers — full width */}
      <section className="space-y-4">
        <OwnerTransfers
          ownerTransfersMtd={data.ownerTransfersMtd}
          ownerTransfersMtdTotal={data.ownerTransfersMtdTotal}
          size="lg"
        />
      </section>
    </div>
  );
}
