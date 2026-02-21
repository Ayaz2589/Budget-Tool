import { useState, useCallback } from "react";
import { Plus, SlidersHorizontal, Wallet } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Accordion } from "@/components/ui/accordion";
import {
  DsActionBar,
  DsEmptyState,
  DsHelpTooltip,
  DsSectionHeader,
} from "@/components/ds";
import { useMediaQuery } from "@/hooks/useMediaQuery";
import { useBudget, usePresetTransactions } from "@/context";
import { AddTransactionDialog } from "@/components/AddTransactionDialog";
import { AddIncomeDialog } from "@/pages/income/AddIncomeDialog";
import { useDashboardData } from "./useDashboardData";
import { DashboardKpiCards } from "./DashboardKpiCards";
import { DashboardCashFlowChart } from "./DashboardCashFlowChart";
import { DashboardNetCashFlowChart } from "./DashboardNetCashFlowChart";
import { DashboardCategoryChart } from "./DashboardCategoryChart";
import { DashboardOwnerSplit } from "./DashboardOwnerSplit";
import { DashboardDebtSnapshot } from "./DashboardDebtSnapshot";
import { DashboardInsights } from "./DashboardInsights";
import { DashboardFilters } from "./DashboardFilters";
import { DashboardQuickAdd } from "./DashboardQuickAdd";

export function Dashboard() {
  const isMobile = useMediaQuery("(max-width: 767px)");
  const data = useDashboardData();
  const { t } = data;
  const { expenses, income, debts, incomeCategories, owners, addIncome, uiFormatSettings } = useBudget();
  const { presetTransactions } = usePresetTransactions();
  const isEmpty = expenses.length === 0 && income.length === 0 && debts.length === 0;

  const [addTransactionOpen, setAddTransactionOpen] = useState(false);
  const [addIncomeOpen, setAddIncomeOpen] = useState(false);
  const [selectedPresetId, setSelectedPresetId] = useState<string | undefined>();

  const handlePresetTap = useCallback((presetId: string) => {
    setSelectedPresetId(presetId);
    setAddTransactionOpen(true);
  }, []);

  const handleAddTransactionOpenChange = useCallback((open: boolean) => {
    setAddTransactionOpen(open);
    if (!open) setSelectedPresetId(undefined);
  }, []);

  const handleAddIncome = useCallback(
    (payload: Parameters<typeof addIncome>[0]) => {
      addIncome(payload);
      setAddIncomeOpen(false);
    },
    [addIncome],
  );

  return (
    <div data-tour-page="dashboard" className="flex flex-col min-h-0 min-w-0 flex-1 overflow-y-auto overflow-x-hidden pb-24 md:pb-0">
      <div className={`min-w-0 px-2 md:px-0 pt-4 md:pt-0 space-y-4${isEmpty ? " flex flex-1 flex-col" : ""}`}>
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
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    className="gap-2"
                    onClick={() => data.setSettingsOpen(true)}
                  >
                    <SlidersHorizontal className="size-4" />
                    <span>{t("settings.title")}</span>
                  </Button>
                  <Button
                    variant="default"
                    className="gap-2"
                    onClick={() => setAddIncomeOpen(true)}
                  >
                    <Wallet className="size-4" />
                    <span>{t("dashboard.addIncome")}</span>
                  </Button>
                  <Button
                    variant="default"
                    className="gap-2"
                    onClick={() => setAddTransactionOpen(true)}
                  >
                    <Plus className="size-4" />
                    <span>{t("dashboard.addExpense")}</span>
                  </Button>
                </div>
              ) : undefined
            }
          />
        </div>

        {isEmpty ? (
          <DsEmptyState
            title={t("dashboard.emptyTitle")}
            description={t("dashboard.emptyHint")}
            actions={
              <>
                <Button onClick={() => setAddTransactionOpen(true)}>
                  <Plus className="size-4" />
                  {t("dashboard.addExpense")}
                </Button>
                <Button variant="outline" onClick={() => setAddIncomeOpen(true)}>
                  <Wallet className="size-4" />
                  {t("dashboard.addIncome")}
                </Button>
              </>
            }
          />
        ) : (
          <>
            <DashboardKpiCards
              kpis={data.kpis}
              expenseScope={data.expenseScope}
              includeDebtPayments={data.includeDebtPayments}
            />

            <DashboardQuickAdd
              presets={presetTransactions}
              onPresetTap={handlePresetTap}
              onAddBlank={() => setAddTransactionOpen(true)}
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
          </>
        )}
      </div>

      {isMobile ? (
        <DsActionBar>
          <Button
            variant="secondary"
            density="compact"
            onClick={() => data.setSettingsOpen(true)}
            className="rounded-full p-0"
            size="icon"
            aria-label={t("settings.title")}
          >
            <SlidersHorizontal className="size-4" />
          </Button>
          <Button
            variant="secondary"
            density="compact"
            onClick={() => setAddIncomeOpen(true)}
            className="rounded-full p-0"
            size="icon"
            aria-label={t("dashboard.addIncome")}
          >
            <Wallet className="size-4" />
          </Button>
          <Button
            variant="default"
            density="compact"
            onClick={() => setAddTransactionOpen(true)}
            className="rounded-full p-0"
            size="icon"
            aria-label={t("dashboard.addExpense")}
          >
            <Plus className="size-4" />
          </Button>
        </DsActionBar>
      ) : null}

      <AddTransactionDialog
        open={addTransactionOpen}
        onOpenChange={handleAddTransactionOpenChange}
        initialPresetId={selectedPresetId}
      />

      <AddIncomeDialog
        open={addIncomeOpen}
        onOpenChange={setAddIncomeOpen}
        incomeCategories={incomeCategories}
        owners={owners}
        dateFormat={uiFormatSettings.dateFormat}
        onSubmit={handleAddIncome}
      />

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
