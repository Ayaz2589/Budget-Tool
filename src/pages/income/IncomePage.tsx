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
import { FileDown } from "lucide-react";
import { downloadTransactionsAndIncomePdf } from "@/lib/pdfExport";
import { AddIncomeDialog } from "./AddIncomeDialog";
import { EditIncomeDialog } from "./EditIncomeDialog";
import { IncomeTable } from "./IncomeTable";

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
  const [addOpen, setAddOpen] = useState(false);
  const [editIncome, setEditIncome] = useState<Income | null>(null);

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
                )
              }
            >
              <FileDown className="size-4" />
              Download PDF (transactions & income)
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <IncomeTable
            sortedIncome={sortedIncome}
            incomeCategories={incomeCategories}
            onEdit={setEditIncome}
            onDelete={removeIncome}
            onUpdateCategory={(id, category) => updateIncome(id, { category })}
            onUpdateOwner={(id, owner) => updateIncome(id, { owner })}
          />
        </CardContent>
      </Card>

      <EditIncomeDialog
        income={editIncome}
        onClose={() => setEditIncome(null)}
        incomeCategories={incomeCategories}
        onSubmit={handleEdit}
      />
    </div>
  );
}
