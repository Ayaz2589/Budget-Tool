import { type ReactNode, useMemo } from "react";
import { SlidersHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";
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
import { DashboardSpendingPace } from "./DashboardSpendingPace";
import { DashboardSavingsRate } from "./DashboardSavingsRate";
import { DashboardCategoryTrends } from "./DashboardCategoryTrends";
import { DashboardQuickStats } from "./DashboardQuickStats";
import { DashboardDebtSnapshot } from "./DashboardDebtSnapshot";
import { DashboardInsights } from "./DashboardInsights";
import { DashboardFilters } from "./DashboardFilters";
import { type WidgetId, getVisibleWidgets, getWidgetMeta } from "./dashboardWidgets";

export function Dashboard() {
  const isMobile = useMediaQuery("(max-width: 767px)");
  const data = useDashboardData();
  const { t } = data;

  const visibleWidgets = useMemo(
    () => getVisibleWidgets(data.widgetConfig),
    [data.widgetConfig],
  );

  function renderWidget(id: WidgetId): ReactNode {
    switch (id) {
      case "quick-stats":
        return <DashboardQuickStats stats={data.quickStats} />;
      case "spending-pace":
        return <DashboardSpendingPace pace={data.spendingPace} />;
      case "savings-rate":
        return <DashboardSavingsRate savingsRate={data.savingsRate} />;
      case "cash-flow":
        return (
          <DashboardCashFlowChart
            cashFlowDisplayRows={data.cashFlowDisplayRows}
            incomeOwnerKeys={data.incomeOwnerKeys}
            includeDebtPayments={data.includeDebtPayments}
          />
        );
      case "net-cash-flow":
        return (
          <DashboardNetCashFlowChart
            netCashFlowRows={data.netCashFlowRows}
            range={data.range}
          />
        );
      case "category-breakdown":
        return <DashboardCategoryChart categorySlices={data.categorySlices} />;
      case "owner-split":
        return (
          <DashboardOwnerSplit
            ownerSlices={data.ownerSlices}
            visibleOwnerNetRows={data.visibleOwnerNetRows}
            ownerExpenseItemsByOwner={data.ownerExpenseItemsByOwner}
            totalSpentForSelectedRange={data.totalSpentForSelectedRange}
            percentFormatter={data.percentFormatter}
          />
        );
      case "category-trends":
        return <DashboardCategoryTrends trends={data.categoryTrends} />;
      case "debt-transfers":
        return (
          <DashboardDebtSnapshot
            debtRows={data.debtRows}
            spendBySourceRows={data.spendBySourceRows}
            ownerTransfersMtd={data.ownerTransfersMtd}
            ownerTransfersMtdTotal={data.ownerTransfersMtdTotal}
            recentActivity={data.recentActivity}
          />
        );
      case "insights":
        return (
          <DashboardInsights
            insights={data.insights}
            onDismiss={data.dismissInsight}
          />
        );
    }
  }

  // Group consecutive half-width widgets into 2-col grid rows
  const widgetRows: ReactNode[] = [];
  let i = 0;
  while (i < visibleWidgets.length) {
    const id = visibleWidgets[i]!;
    const meta = getWidgetMeta(id);
    const nextId = visibleWidgets[i + 1];
    const nextMeta = nextId ? getWidgetMeta(nextId) : undefined;

    if (meta.size === "half" && nextMeta?.size === "half") {
      widgetRows.push(
        <div key={`${id}-${nextId}`} className="min-w-0 grid grid-cols-1 gap-3 lg:grid-cols-2">
          {renderWidget(id)}
          {renderWidget(nextId!)}
        </div>,
      );
      i += 2;
    } else {
      widgetRows.push(
        <div key={id}>{renderWidget(id)}</div>,
      );
      i += 1;
    }
  }

  return (
    <div data-tour-page="dashboard" className="flex flex-col min-h-0 min-w-0 flex-1 overflow-y-auto overflow-x-hidden pb-24 md:pb-0">
      <div className="min-w-0 px-2 md:px-0 pt-4 md:pt-0 space-y-3">
        <div className="space-y-2" data-tour="dashboard-header">
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

        {widgetRows}
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
        widgetConfig={data.widgetConfig}
        onWidgetConfigChange={data.setWidgetConfig}
      />
    </div>
  );
}
