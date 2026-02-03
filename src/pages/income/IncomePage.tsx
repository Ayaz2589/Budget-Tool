import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useBudget } from "@/context/BudgetContext";
import type { Income } from "@/lib/types";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
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
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="space-y-1 min-w-0">
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-semibold">{t("income.title")}</h1>
            <PageTourTrigger pageId="income" steps={incomeTourSteps} />
          </div>
          <p className="text-sm text-muted-foreground">{t("income.subtitle")}</p>
        </div>
      </div>
      <div data-tour="addIncome" className="flex flex-wrap items-center justify-between gap-2">
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

      <Card data-tour="incomeList">
        <CardHeader>
          <CardTitle>Income entries</CardTitle>
          <CardDescription>Edit or delete entries below.</CardDescription>
        </CardHeader>
        <CardContent>
          {sortedIncome.length === 0 ? (
            <div className="text-center text-muted-foreground py-8 px-4 border rounded-md">
              No income entries yet.
            </div>
          ) : (
            <>
              <div className="hidden md:block">
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
              <div className="md:hidden max-h-[50vh] overflow-y-auto border rounded-md">
                <IncomeList
                  sortedIncome={sortedIncome}
                  onIncomeTap={setIncomeForActions}
                />
              </div>
            </>
          )}
        </CardContent>
      </Card>

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
