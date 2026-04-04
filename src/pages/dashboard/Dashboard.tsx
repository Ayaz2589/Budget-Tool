import { useState, useCallback } from "react";
import { Plus, SlidersHorizontal, Wallet } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DsActionBar,
  DsEmptyState,
  DsHelpTooltip,
  DsSectionHeader,
} from "@/components/ds";
import { useBudget } from "@/context";
import { AddTransactionDialog } from "@/components/AddTransactionDialog";
import { AddIncomeDialog } from "@/pages/income/AddIncomeDialog";
import { useDashboardData } from "./useDashboardData";
import { DashboardFixedLayout } from "./DashboardFixedLayout";
import { DashboardFilters } from "./DashboardFilters";

export function Dashboard() {
  const data = useDashboardData();
  const { t } = data;
  const { expenses, income, debts, owners, addIncome, uiFormatSettings } = useBudget();
  const isEmpty = expenses.length === 0 && income.length === 0 && debts.length === 0;

  const [addTransactionOpen, setAddTransactionOpen] = useState(false);
  const [addIncomeOpen, setAddIncomeOpen] = useState(false);

  const handleAddIncome = useCallback(
    (payload: Parameters<typeof addIncome>[0]) => {
      addIncome(payload);
      setAddIncomeOpen(false);
    },
    [addIncome],
  );

  return (
    <div data-tour-page="dashboard" className="flex flex-col min-h-0 min-w-0 flex-1 overflow-y-auto overflow-x-hidden pb-24 md:pb-0">
      <div className={`min-w-0 px-4 md:px-0 pt-4 md:pt-0 space-y-4${isEmpty ? " flex flex-1 flex-col" : ""}`}>
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
          />
        </div>

        {isEmpty ? (
          <DsEmptyState
            variant="hero"
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
          <DashboardFixedLayout data={data} />
        )}
      </div>

      <DsActionBar mobileOnly={false}>
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

      <AddTransactionDialog
        open={addTransactionOpen}
        onOpenChange={setAddTransactionOpen}
      />

      <AddIncomeDialog
        open={addIncomeOpen}
        onOpenChange={setAddIncomeOpen}
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
