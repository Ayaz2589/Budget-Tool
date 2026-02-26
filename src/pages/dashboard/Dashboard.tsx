import { useState, useCallback, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { Plus, SlidersHorizontal, Wallet, Grid2X2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  DsActionBar,
  DsEmptyState,
  DsHelpTooltip,
  DsSectionHeader,
  DsWidgetCatalog,
} from "@/components/ds";
import { useMediaQuery } from "@/hooks/useMediaQuery";
import { useBudget } from "@/context";
import {
  DashboardLayoutProvider,
  useDashboardLayout,
} from "@/context/DashboardLayoutContext";
import { AddTransactionDialog } from "@/components/AddTransactionDialog";
import { AddIncomeDialog } from "@/pages/income/AddIncomeDialog";
import { useDashboardData } from "./useDashboardData";
import { DashboardGrid } from "./DashboardGrid";
import { DashboardMobileGrid } from "./DashboardMobileGrid";
import { DashboardFilters } from "./DashboardFilters";

function DashboardContent() {
  const isMobile = useMediaQuery("(max-width: 767px)");
  const data = useDashboardData();
  const { t } = data;
  const { expenses, income, debts, incomeCategories, owners, addIncome, uiFormatSettings } = useBudget();
  const {
    layout,
    hideWidget,
    showWidget,
    resetToDefault,
  } = useDashboardLayout();
  const isEmpty = expenses.length === 0 && income.length === 0 && debts.length === 0;

  const [addTransactionOpen, setAddTransactionOpen] = useState(false);
  const [addIncomeOpen, setAddIncomeOpen] = useState(false);
  const [catalogOpen, setCatalogOpen] = useState(false);
  const [resetDialogOpen, setResetDialogOpen] = useState(false);

  const handleAddIncome = useCallback(
    (payload: Parameters<typeof addIncome>[0]) => {
      addIncome(payload);
      setAddIncomeOpen(false);
    },
    [addIncome],
  );

  const handleReset = useCallback(() => {
    resetToDefault();
    setResetDialogOpen(false);
  }, [resetToDefault]);

  const visibleWidgetIds = useMemo(
    () => new Set(layout.desktopGrid.filter((item) => item.visible).map((item) => item.id)),
    [layout.desktopGrid],
  );

  const { t: tWidget } = useTranslation();

  // Build the props object passed to widget render functions
  const dashboardData: Record<string, unknown> = {
    ...data,
  };

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
                <Button
                  variant="outline"
                  size="icon"
                  className="h-10 w-10"
                  onClick={() => setCatalogOpen(true)}
                  aria-label={tWidget("widget.manageWidgets")}
                >
                  <Grid2X2 className="size-5" />
                </Button>
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
          isMobile ? (
            <DashboardMobileGrid dashboardData={dashboardData} />
          ) : (
            <DashboardGrid dashboardData={dashboardData} />
          )
        )}
      </div>

      <DsActionBar mobileOnly={false}>
        <Button
          variant="secondary"
          density="compact"
          onClick={() => setCatalogOpen(true)}
          className="rounded-full p-0"
          size="icon"
          aria-label={tWidget("widget.manageWidgets")}
        >
          <Grid2X2 className="size-4" />
        </Button>
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

      <DsWidgetCatalog
        open={catalogOpen}
        onOpenChange={setCatalogOpen}
        visibleWidgetIds={visibleWidgetIds}
        onShow={showWidget}
        onHide={hideWidget}
        onReset={() => setResetDialogOpen(true)}
      />

      <AlertDialog open={resetDialogOpen} onOpenChange={setResetDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{tWidget("widget.resetConfirmTitle")}</AlertDialogTitle>
            <AlertDialogDescription>
              {tWidget("widget.resetConfirmDescription")}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t("common.cancel")}</AlertDialogCancel>
            <AlertDialogAction onClick={handleReset}>
              {tWidget("widget.resetConfirmAction")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

export function Dashboard() {
  return (
    <DashboardLayoutProvider>
      <DashboardContent />
    </DashboardLayoutProvider>
  );
}
