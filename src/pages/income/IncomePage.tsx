import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useBudget } from "@/context/BudgetContext";
import { usePresetTransactions } from "@/context/PresetTransactionsContext";
import { useRules } from "@/context/RulesContext";
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
import { FileDown } from "lucide-react";
import { downloadTransactionsAndIncomePdf } from "@/lib/pdfExport";
import { AddIncomeDialog } from "./AddIncomeDialog";
import { EditIncomeDialog } from "./EditIncomeDialog";
import { IncomeTable } from "./IncomeTable";
import { IncomeList } from "./IncomeList";
import { IncomeActionsDialog } from "./IncomeActionsDialog";

export function IncomePage() {
  const {
    expenses,
    income,
    debts,
    debtPayments,
    addIncome,
    updateIncome,
    removeIncome,
    incomeCategories,
  } = useBudget();
  const { rules } = useRules();
  const { presetTransactions } = usePresetTransactions();
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
      <h1 className="text-2xl font-semibold">{t("income.title")}</h1>
      <Card>
        <CardHeader>
          <CardTitle>{t("income.addIncome")}</CardTitle>
          <CardDescription>{t("income.addIncomeDesc")}</CardDescription>
        </CardHeader>
        <CardContent>
          <AddIncomeDialog
            open={addOpen}
            onOpenChange={setAddOpen}
            incomeCategories={incomeCategories}
            onSubmit={handleAdd}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Income entries</CardTitle>
          <CardDescription>Edit or delete entries below.</CardDescription>
          <div className="pt-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() =>
                downloadTransactionsAndIncomePdf(
                  expenses,
                  income,
                  debts,
                  debtPayments,
                  rules,
                  presetTransactions,
                )
              }
            >
              <FileDown className="size-4" />
              Download PDF (transactions & income)
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {sortedIncome.length === 0 ? (
            <div className="text-center text-muted-foreground py-8 px-4 border rounded-md">
              No income entries. Add one above.
            </div>
          ) : (
            <>
              <div className="hidden md:block">
                <IncomeTable
                  sortedIncome={sortedIncome}
                  incomeCategories={incomeCategories}
                  onEdit={setEditIncome}
                  onDelete={setIncomeToDeleteId}
                  onUpdateCategory={(id, category) =>
                    updateIncome(id, { category })
                  }
                  onUpdateOwner={(id, owner) => updateIncome(id, { owner })}
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
        onUpdateOwner={(id, owner) => updateIncome(id, { owner })}
        onEdit={(i) => {
          setIncomeForActions(null);
          setEditIncome(i);
        }}
        onDelete={removeIncome}
        incomeCategories={incomeCategories}
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
              {t("common.delete")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <EditIncomeDialog
        income={editIncome}
        onClose={() => setEditIncome(null)}
        incomeCategories={incomeCategories}
        onSubmit={handleEdit}
      />
    </div>
  );
}
