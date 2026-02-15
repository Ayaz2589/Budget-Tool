import { SlidersHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Accordion } from "@/components/ui/accordion";
import {
  DsActionBar,
  DsHelpTooltip,
  DsSectionHeader,
} from "@/components/ds";
import { useMediaQuery } from "@/hooks/useMediaQuery";
import { useDashboardData } from "./useDashboardData";
import { DashboardKpiCards } from "./DashboardKpiCards";
import { DashboardCashFlowChart } from "./DashboardCashFlowChart";
import { DashboardNetCashFlowChart } from "./DashboardNetCashFlowChart";
import { DashboardCategoryChart } from "./DashboardCategoryChart";
import { DashboardOwnerSplit } from "./DashboardOwnerSplit";
import { DashboardDebtSnapshot } from "./DashboardDebtSnapshot";
import { DashboardInsights } from "./DashboardInsights";
import { DashboardFilters } from "./DashboardFilters";

export function Dashboard() {
  const isMobile = useMediaQuery("(max-width: 767px)");
  const data = useDashboardData();
  const { t } = data;

  return (
    <div data-tour-page="dashboard" className="flex flex-col min-h-0 min-w-0 flex-1 overflow-y-auto overflow-x-hidden pb-24 md:pb-0">
      <div className="min-w-0 px-2 md:px-0 pt-4 md:pt-0 space-y-4">
        <div className="space-y-3" data-tour="dashboard-header">
          <DsSectionHeader
            title={
              <span className="inline-flex items-center gap-1.5">
                {t("dashboard.title")}
                <DsHelpTooltip
                  content={t("dashboard.help.page")}
                  ariaLabel={t("common.help")}
                />
              </span>
            }
            subtitle={t("dashboard.healthQuestion")}
            showCurrencyChip
            actions={
              !isMobile ? (
                <Button
                  variant="outline"
                  className="h-11 gap-2"
                  onClick={() => data.setSettingsOpen(true)}
                >
                  <SlidersHorizontal className="size-4" />
                  <span>{t("settings.title")}</span>
                </Button>
              ) : undefined
            }
          />
        </div>

        <DashboardKpiCards
          kpis={data.kpis}
          expenseScope={data.expenseScope}
          includeDebtPayments={data.includeDebtPayments}
        />

        <div data-tour="dashboard-trends" className="min-w-0 grid grid-cols-1 gap-4 lg:grid-cols-2">
          <DashboardCashFlowChart
            cashFlowDisplayRows={data.cashFlowDisplayRows}
            incomeOwnerKeys={data.incomeOwnerKeys}
            includeDebtPayments={data.includeDebtPayments}
          />
          <DashboardNetCashFlowChart
            netCashFlowRows={data.netCashFlowRows}
            range={data.range}
          />
        </div>

        <section data-tour="dashboard-pies" className="min-w-0 grid grid-cols-1 gap-4 lg:grid-cols-2">
          <DashboardCategoryChart categorySlices={data.categorySlices} />
          <DashboardOwnerSplit
            ownerSlices={data.ownerSlices}
            visibleOwnerNetRows={data.visibleOwnerNetRows}
            ownerExpenseItemsByOwner={data.ownerExpenseItemsByOwner}
            totalSpentForSelectedRange={data.totalSpentForSelectedRange}
            percentFormatter={data.percentFormatter}
          />
        </section>

        <Accordion
          type="multiple"
          defaultValue={["debt", "spend-source"]}
          className="space-y-3 pb-4 pt-2"
        >
          <DashboardDebtSnapshot
            debtRows={data.debtRows}
            spendBySourceRows={data.spendBySourceRows}
            ownerTransfersMtd={data.ownerTransfersMtd}
            ownerTransfersMtdTotal={data.ownerTransfersMtdTotal}
            recentActivity={data.recentActivity}
          />
          <DashboardInsights
            insights={data.insights}
            onDismiss={data.dismissInsight}
          />
        </Accordion>
      </div>

      {isMobile ? (
        <DsActionBar>
          <Button
            variant="secondary"
            density="compact"
            onClick={() => data.setSettingsOpen(true)}
            className="h-11 w-11 rounded-full p-0"
            aria-label={t("settings.title")}
          >
            <SlidersHorizontal className="size-4" />
          </Button>
        </DsActionBar>
      ) : null}

      <DashboardFilters
        settingsOpen={data.settingsOpen}
        setSettingsOpen={data.setSettingsOpen}
        viewMode={data.viewMode}
        setViewMode={data.setViewMode}
        selectedOwner={data.selectedOwner}
        setSelectedOwner={data.setSelectedOwner}
        ownerOptions={data.ownerOptions}
        selectedMonthKey={data.selectedMonthKey}
        setSelectedMonthKey={data.setSelectedMonthKey}
        availableMonthKeys={data.availableMonthKeys}
        range={data.range}
        setRange={data.setRange}
        expenseScope={data.expenseScope}
        setExpenseScope={data.setExpenseScope}
        includeDebtPayments={data.includeDebtPayments}
        setIncludeDebtPayments={data.setIncludeDebtPayments}
      />
    </div>
  );
}
