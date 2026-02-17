import { useState, useCallback, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { Plus, SlidersHorizontal, Wallet, LayoutGrid, Check, RotateCcw, Grid2X2 } from "lucide-react";
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
  DsHelpTooltip,
  DsSectionHeader,
  DsWidgetCatalog,
} from "@/components/ds";
import { useMediaQuery } from "@/hooks/useMediaQuery";
import { useBudget, usePresetTransactions } from "@/context";
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
  const { incomeCategories, owners, addIncome, uiFormatSettings } = useBudget();
  const { presetTransactions } = usePresetTransactions();
  const {
    layout,
    isEditing,
    startEditing,
    stopEditing,
    hideWidget,
    showWidget,
    resetToDefault,
  } = useDashboardLayout();

  const [addTransactionOpen, setAddTransactionOpen] = useState(false);
  const [addIncomeOpen, setAddIncomeOpen] = useState(false);
  const [selectedPresetId, setSelectedPresetId] = useState<string | undefined>();
  const [catalogOpen, setCatalogOpen] = useState(false);
  const [resetDialogOpen, setResetDialogOpen] = useState(false);

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

  const handleReset = useCallback(() => {
    resetToDefault();
    stopEditing();
    setResetDialogOpen(false);
  }, [resetToDefault, stopEditing]);

  const visibleWidgetIds = useMemo(
    () => new Set(layout.desktopGrid.filter((item) => item.visible).map((item) => item.id)),
    [layout.desktopGrid],
  );

  const { t: tWidget } = useTranslation();

  // Build the props object passed to widget render functions
  const dashboardData: Record<string, unknown> = {
    ...data,
    presetTransactions,
    onPresetTap: handlePresetTap,
    onAddBlank: () => setAddTransactionOpen(true),
  };

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
                <div className="flex items-center gap-2">
                  {isEditing ? (
                    <>
                      <Button
                        variant="outline"
                        className="h-11 gap-2"
                        onClick={() => setCatalogOpen(true)}
                      >
                        <Grid2X2 className="size-4" />
                        <span>{tWidget("widget.manageWidgets")}</span>
                      </Button>
                      <Button
                        variant="outline"
                        className="h-11 gap-2"
                        onClick={() => setResetDialogOpen(true)}
                      >
                        <RotateCcw className="size-4" />
                        <span>{tWidget("widget.resetLayout")}</span>
                      </Button>
                      <Button
                        variant="default"
                        className="h-11 gap-2"
                        onClick={stopEditing}
                      >
                        <Check className="size-4" />
                        <span>{tWidget("widget.doneEditing")}</span>
                      </Button>
                    </>
                  ) : (
                    <>
                      <Button
                        variant="outline"
                        className="h-11 gap-2"
                        onClick={startEditing}
                      >
                        <LayoutGrid className="size-4" />
                        <span>{tWidget("widget.editLayout")}</span>
                      </Button>
                      <Button
                        variant="default"
                        className="h-11 gap-2"
                        onClick={() => setAddTransactionOpen(true)}
                      >
                        <Plus className="size-4" />
                        <span>{t("dashboard.addExpense")}</span>
                      </Button>
                      <Button
                        variant="secondary"
                        className="h-11 gap-2"
                        onClick={() => setAddIncomeOpen(true)}
                      >
                        <Wallet className="size-4" />
                        <span>{t("dashboard.addIncome")}</span>
                      </Button>
                      <Button
                        variant="outline"
                        className="h-11 gap-2"
                        onClick={() => data.setSettingsOpen(true)}
                      >
                        <SlidersHorizontal className="size-4" />
                        <span>{t("settings.title")}</span>
                      </Button>
                    </>
                  )}
                </div>
              ) : undefined
            }
          />
        </div>

        {isEditing && (
          <div className="flex items-center gap-2 rounded-lg bg-muted/60 px-4 py-2 text-sm text-muted-foreground">
            <LayoutGrid className="size-4 shrink-0" />
            <span>{tWidget("widget.editingHint")}</span>
          </div>
        )}

        {isMobile ? (
          <DashboardMobileGrid dashboardData={dashboardData} />
        ) : (
          <DashboardGrid dashboardData={dashboardData} />
        )}
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
          <Button
            variant="secondary"
            density="compact"
            onClick={() => setAddIncomeOpen(true)}
            className="h-11 w-11 rounded-full p-0"
            aria-label={t("dashboard.addIncome")}
          >
            <Wallet className="size-4" />
          </Button>
          <Button
            variant="default"
            density="compact"
            onClick={() => setAddTransactionOpen(true)}
            className="h-11 w-11 rounded-full p-0"
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

      <DsWidgetCatalog
        open={catalogOpen}
        onOpenChange={setCatalogOpen}
        visibleWidgetIds={visibleWidgetIds}
        onShow={showWidget}
        onHide={hideWidget}
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
