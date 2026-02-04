import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useBudget } from "@/context/BudgetContext";
import type { Income } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Plus, Trash2 } from "lucide-react";
import { PageTourTrigger } from "@/components/PageTourTrigger";
import { incomeTourSteps } from "@/lib/pageTourSteps";
import { AddIncomeDialog } from "./AddIncomeDialog";
import { EditIncomeDialog } from "./EditIncomeDialog";
import { IncomeTable } from "./IncomeTable";
import { IncomeList } from "./IncomeList";
import { IncomeActionsDialog } from "./IncomeActionsDialog";

export function IncomePage() {
  const {
    income,
    addIncome,
    updateIncome,
    removeIncome,
    incomeCategories,
    owners,
  } = useBudget();
  const [addOpen, setAddOpen] = useState(false);
  const [editIncome, setEditIncome] = useState<Income | null>(null);
  const [incomeForActions, setIncomeForActions] = useState<Income | null>(null);
  const [incomeToDeleteId, setIncomeToDeleteId] = useState<string | null>(null);

  const { t } = useTranslation();
  const sortedIncome = [...income].sort((a, b) => b.date.localeCompare(a.date));

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

  return (
    <div className="flex flex-col min-h-0 flex-1 overflow-hidden">
      <div className="hidden md:flex flex-wrap items-start justify-between gap-2 shrink-0 mb-4">
        <div className="space-y-1 min-w-0">
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-semibold">{t("income.title")}</h1>
            <PageTourTrigger pageId="income" steps={incomeTourSteps} />
          </div>
          <p className="text-sm text-muted-foreground">{t("income.subtitle")}</p>
        </div>
      </div>
      <div className="md:hidden mb-3 px-4 pt-4 shrink-0 bg-background/95 backdrop-blur">
        <div className="px-0 py-3 flex items-center justify-between gap-3">
          <div className="min-w-0">
            <h1 className="text-xl font-semibold">{t("income.title")}</h1>
            <p className="text-xs text-muted-foreground">
              {t("income.subtitle")}
            </p>
          </div>
          <PageTourTrigger pageId="income" steps={incomeTourSteps} />
        </div>
      </div>
      <div
        data-tour="addIncome"
        className="hidden md:flex items-center justify-end mb-4"
      >
        <Button onClick={() => setAddOpen(true)}>
          <Plus className="size-4" />
          {t("income.addIncome")}
        </Button>
      </div>

      <AddIncomeDialog
        open={addOpen}
        onOpenChange={setAddOpen}
        incomeCategories={incomeCategories}
        owners={owners}
        onSubmit={handleAdd}
      />

      <Card data-tour="incomeList" className="flex-1 min-h-0 flex flex-col overflow-hidden">
        <CardContent className="flex-1 min-h-0 flex flex-col overflow-hidden gap-0 px-0 pb-24 md:px-0 md:pb-0 md:gap-4 transactions-card-content">
          {sortedIncome.length === 0 ? (
            <div className="text-center text-muted-foreground py-8 px-4 border rounded-md">
              No income entries yet.
            </div>
          ) : (
            <>
              <div className="hidden md:block md:border md:rounded-md">
                <IncomeTable
                  sortedIncome={sortedIncome}
                  incomeCategories={incomeCategories}
                  ownerOptions={owners}
                  onEdit={setEditIncome}
                  onDelete={setIncomeToDeleteId}
                  onUpdateCategory={(id, category) =>
                    updateIncome(id, { category })
                  }
                  onUpdateOwner={(id, owner) =>
                    updateIncome(id, { owner: owner || undefined })
                  }
                />
              </div>
              <div className="md:hidden">
                <IncomeList
                  sortedIncome={sortedIncome}
                  onIncomeTap={setIncomeForActions}
                />
              </div>
            </>
          )}
        </CardContent>
      </Card>

      <div className="md:hidden fixed inset-x-0 bottom-[calc(env(safe-area-inset-bottom)+72px)] z-30 px-4 pb-3 pointer-events-none">
        <div className="pointer-events-auto flex items-center justify-end">
          <div className="flex items-center gap-2 rounded-full border border-border/60 bg-background/20 shadow-lg shadow-black/30 backdrop-blur px-2 py-2">
            <Button
              onClick={() => setAddOpen(true)}
              className="h-11 w-11 rounded-full p-0"
              aria-label={t("income.addIncome")}
            >
              <Plus className="size-4" />
            </Button>
          </div>
        </div>
      </div>

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

      <Dialog
        open={incomeToDeleteId !== null}
        onOpenChange={(open) => !open && setIncomeToDeleteId(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("income.deleteIncomeTitle")}</DialogTitle>
            <DialogDescription>
              {t("income.deleteIncomeDesc")}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setIncomeToDeleteId(null)}
            >
              {t("common.cancel")}
            </Button>
            <Button
              type="button"
              variant="destructive"
              onClick={() => {
                if (incomeToDeleteId) {
                  removeIncome(incomeToDeleteId);
                  setIncomeToDeleteId(null);
                }
              }}
            >
              <Trash2 className="size-4" />
              {t("common.delete")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

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
