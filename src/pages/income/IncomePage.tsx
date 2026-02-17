import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { useLocation } from "react-router-dom";
import { useBudget } from "@/context";
import type { Income } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Plus, Wallet } from "lucide-react";
import { DsActionBar, DsEmptyState, DsHelpTooltip, DsSectionHeader } from "@/components/ds";
import { AddIncomeDialog } from "./AddIncomeDialog";
import { EditIncomeDialog } from "./EditIncomeDialog";
import { IncomeTable } from "./IncomeTable";
import { IncomeList } from "./IncomeList";
import { IncomeActionsDialog } from "./IncomeActionsDialog";

export function IncomePage() {
  const location = useLocation();
  const {
    income,
    addIncome,
    updateIncome,
    removeIncome,
    incomeCategories,
    owners,
    uiFormatSettings,
  } = useBudget();
  const [addOpen, setAddOpen] = useState(false);
  const [editIncome, setEditIncome] = useState<Income | null>(null);
  const [incomeForActions, setIncomeForActions] = useState<Income | null>(null);

  const { t } = useTranslation();
  const sortedIncome = [...income].sort((a, b) => b.date.localeCompare(a.date));
  const byMonth = (() => {
    const map = new Map<string, Income[]>();
    for (const i of sortedIncome) {
      const key = i.date.slice(0, 7);
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(i);
    }
    return Array.from(map.entries()).sort((a, b) => b[0].localeCompare(a[0]));
  })();
  const currentMonthKey = new Date().toISOString().slice(0, 7);
  const defaultOpenMonth = byMonth.some(([k]) => k === currentMonthKey)
    ? currentMonthKey
    : (byMonth[0]?.[0] ?? "");

  const handleAdd = (payload: Parameters<typeof addIncome>[0]) => {
    addIncome(payload);
    setAddOpen(false);
  };

  const handleEdit = (
    id: string,
    payload: Parameters<typeof updateIncome>[1],
  ) => {
    updateIncome(id, payload);
    setEditIncome(null);
  };

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    setAddOpen(params.get("tourSheet") === "income-add");
  }, [location.search]);

  return (
    <div data-tour-page="income" className="flex flex-col min-h-0 flex-1 overflow-hidden">
      <div className="mb-3 px-4 md:px-0 pt-4 md:pt-0 shrink-0 bg-background/95 md:bg-transparent backdrop-blur md:backdrop-blur-none">
        <DsSectionHeader
          title={
            <span className="inline-flex items-center gap-1.5">
              {t("income.title")}
              <DsHelpTooltip
                content={t("income.help.page")}
                ariaLabel={t("common.help")}
              />
            </span>
          }
          subtitle={t("income.subtitle")}
          showCurrencyChip
          actions={
            <Button
              className="hidden md:inline-flex"
              onClick={() => setAddOpen(true)}
            >
              <Plus className="size-4" />
              {t("income.addIncome")}
            </Button>
          }
        />
      </div>

      <AddIncomeDialog
        open={addOpen}
        onOpenChange={setAddOpen}
        incomeCategories={incomeCategories}
        owners={owners}
        dateFormat={uiFormatSettings.dateFormat}
        onSubmit={handleAdd}
      />

      <Card className="flex-1 min-h-0 flex flex-col overflow-hidden md:border-0 md:shadow-none md:rounded-none md:bg-transparent md:py-0">
        <CardContent data-tour="income-table" className="flex-1 min-h-0 flex flex-col overflow-hidden gap-0 px-0 pb-24 md:px-0 md:pb-0 md:gap-4 transactions-card-content">
          {sortedIncome.length === 0 ? (
            <DsEmptyState
              icon={<Wallet className="size-8" />}
              title={t("income.noIncomeEntries")}
              description={t("income.emptyStateHint")}
              actions={
                <Button onClick={() => setAddOpen(true)}>
                  <Plus className="size-4" />
                  {t("income.addIncome")}
                </Button>
              }
            />
          ) : (
            <>
              <div className="hidden md:block">
                <IncomeTable
                  byMonth={byMonth}
                  defaultOpenMonth={defaultOpenMonth}
                  onIncomeTap={setIncomeForActions}
                  onUpdateCategory={(id, category) => updateIncome(id, { category })}
                  onUpdateOwner={(id, owner) => updateIncome(id, { owner: owner || undefined })}
                  incomeCategories={incomeCategories}
                  ownerOptions={owners}
                />
              </div>
              <div className="md:hidden">
                <IncomeList
                  byMonth={byMonth}
                  defaultOpenMonth={defaultOpenMonth}
                  onIncomeTap={setIncomeForActions}
                />
              </div>
            </>
          )}
        </CardContent>
      </Card>

      <DsActionBar>
            <Button
              onClick={() => setAddOpen(true)}
              density="compact"
             
              className="h-11 w-11 rounded-full p-0"
              aria-label={t("income.addIncome")}
            >
              <Plus className="size-4" />
            </Button>
      </DsActionBar>

      <IncomeActionsDialog
        income={incomeForActions}
        onClose={() => setIncomeForActions(null)}
        onUpdateCategory={(id, category) => updateIncome(id, { category })}
        onUpdateOwner={(id, owner) =>
          updateIncome(id, { owner: owner || undefined })
        }
        onEdit={(i) => {
          setIncomeForActions(null);
          setEditIncome(i);
        }}
        onDelete={removeIncome}
        incomeCategories={incomeCategories}
        ownerOptions={owners}
        t={t}
      />

      <EditIncomeDialog
        income={editIncome}
        onClose={() => setEditIncome(null)}
        incomeCategories={incomeCategories}
        owners={owners}
        onSubmit={handleEdit}
      />
    </div>
  );
}
