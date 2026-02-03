import { useState, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { useBudget } from "@/context/BudgetContext";
import type { Expense } from "@/lib/types";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { PageTourTrigger } from "@/components/PageTourTrigger";
import { formatCurrency } from "@/lib/format";
import { mortgageTourSteps } from "@/lib/pageTourSteps";
import { AddMortgagePaymentDialog } from "./AddMortgagePaymentDialog";
import { MortgagePaymentsTable } from "./MortgagePaymentsTable";
import { MortgagePaymentsList } from "./MortgagePaymentsList";
import { MortgagePaymentActionsDialog } from "./MortgagePaymentActionsDialog";
import { DeleteMortgagePaymentDialog } from "./DeleteMortgagePaymentDialog";

const MORTGAGE_CATEGORY = "Mortgage";
const DEFAULT_MORTGAGE_AMOUNT = 5400;

export function MortgagePage() {
  const { expenses, addExpense, updateExpense, removeExpense, owners } = useBudget();
  const [addOpen, setAddOpen] = useState(false);
  const [addDate, setAddDate] = useState(() =>
    new Date().toISOString().slice(0, 10),
  );
  const [addAmount, setAddAmount] = useState(String(DEFAULT_MORTGAGE_AMOUNT));
  const [addOwner, setAddOwner] = useState(() => owners[0] ?? "");
  const [deleteConfirm, setDeleteConfirm] = useState<Expense | null>(null);
  const [paymentForActions, setPaymentForActions] = useState<Expense | null>(
    null,
  );

  const mortgagePayments = useMemo(() => {
    return [...expenses]
      .filter(
        (e) =>
          (e.category || "").toLowerCase() === MORTGAGE_CATEGORY.toLowerCase(),
      )
      .sort((a, b) => b.date.localeCompare(a.date));
  }, [expenses]);

  const totalThisYear = useMemo(() => {
    const y = new Date().getFullYear();
    return mortgagePayments
      .filter((e) => e.date.startsWith(String(y)))
      .reduce((s, e) => s + e.amount, 0);
  }, [mortgagePayments]);

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    const num = parseFloat(addAmount.replace(/[$,]/g, ""));
    if (Number.isNaN(num) || num <= 0) return;
    const dateStr = addDate.trim();
    if (!dateStr) return;
    addExpense({
      date: dateStr,
      amount: num,
      description: MORTGAGE_CATEGORY,
      category: MORTGAGE_CATEGORY,
      source: "manual",
      owner: addOwner || undefined,
    });
    setAddDate(new Date().toISOString().slice(0, 10));
    setAddAmount(String(DEFAULT_MORTGAGE_AMOUNT));
    setAddOpen(false);
  };

  const handleRemove = (exp: Expense) => {
    removeExpense(exp.id);
    setDeleteConfirm(null);
  };

  const { t } = useTranslation();
  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="space-y-1 min-w-0">
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-semibold">{t("mortgage.title")}</h1>
            <PageTourTrigger pageId="mortgage" steps={mortgageTourSteps} />
          </div>
          <p className="text-sm text-muted-foreground">{t("mortgage.subtitle")}</p>
        </div>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>{t("mortgage.mortgagePayments")}</CardTitle>
          <CardDescription>
            {t("mortgage.mortgagePaymentsDesc")}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap items-center gap-4" data-tour="addPayment">
            <AddMortgagePaymentDialog
              open={addOpen}
              onOpenChange={setAddOpen}
              date={addDate}
              onDateChange={setAddDate}
              amount={addAmount}
              onAmountChange={setAddAmount}
              owner={addOwner}
              onOwnerChange={setAddOwner}
              ownerOptions={owners}
              onSubmit={handleAdd}
            />
            <span className="text-sm text-muted-foreground">
              Total this year: {formatCurrency(totalThisYear)}
            </span>
          </div>

          {mortgagePayments.length === 0 ? (
            <p className="text-muted-foreground text-sm">
              No mortgage payments recorded yet. Add one above.
            </p>
          ) : (
            <div data-tour="paymentsList">
              <div className="hidden md:block overflow-x-auto border rounded-md">
                <MortgagePaymentsTable
                  payments={mortgagePayments}
                  onRemove={setDeleteConfirm}
                  onUpdateOwner={(id, owner) =>
                    updateExpense(id, { owner: owner || undefined })
                  }
                  ownerOptions={owners}
                />
              </div>
              <div className="md:hidden max-h-[50vh] overflow-y-auto">
                <MortgagePaymentsList
                  payments={mortgagePayments}
                  onPaymentTap={setPaymentForActions}
                />
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <MortgagePaymentActionsDialog
        payment={paymentForActions}
        onClose={() => setPaymentForActions(null)}
        onRemove={(exp) => {
          setPaymentForActions(null);
          setDeleteConfirm(exp);
        }}
        onUpdateOwner={(id, owner) =>
          updateExpense(id, { owner: owner || undefined })
        }
        ownerOptions={owners}
        t={t}
      />

      <DeleteMortgagePaymentDialog
        expense={deleteConfirm}
        onClose={() => setDeleteConfirm(null)}
        onConfirm={() => deleteConfirm && handleRemove(deleteConfirm)}
      />
    </div>
  );
}
