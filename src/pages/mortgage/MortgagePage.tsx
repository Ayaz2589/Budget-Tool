import { useState, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { useBudget } from "@/context/BudgetContext";
import type { Expense } from "@/lib/types";
import { Card, CardContent } from "@/components/ui/card";
import { PageTourTrigger } from "@/components/PageTourTrigger";
import { mortgageTourSteps } from "@/lib/pageTourSteps";
import { Button } from "@/components/ui/button";
import { Home, Plus } from "lucide-react";
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
    <div className="flex flex-col min-h-0 flex-1 overflow-hidden">
      <div className="hidden md:flex flex-wrap items-start justify-between gap-2 shrink-0 mb-4">
        <div className="space-y-1 min-w-0">
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-semibold">{t("mortgage.title")}</h1>
            <PageTourTrigger pageId="mortgage" steps={mortgageTourSteps} />
          </div>
          <p className="text-sm text-muted-foreground">
            {t("mortgage.subtitle")}
          </p>
        </div>
        <Button data-tour-action="openAddMortgage" onClick={() => setAddOpen(true)}>
          <Plus className="size-4" />
          {t("mortgage.addPayment")}
        </Button>
      </div>
      <div className="md:hidden mb-3 px-4 pt-4 shrink-0 bg-background/95 backdrop-blur">
        <div className="px-0 py-3 flex items-center justify-between gap-3">
          <div className="min-w-0">
            <h1 className="text-xl font-semibold">{t("mortgage.title")}</h1>
            <p className="text-xs text-muted-foreground">
              {t("mortgage.subtitle")}
            </p>
          </div>
          <PageTourTrigger pageId="mortgage" steps={mortgageTourSteps} />
        </div>
      </div>

      <Card className="flex-1 min-h-0 flex flex-col overflow-hidden md:border-0 md:shadow-none md:rounded-none md:bg-transparent md:py-0">
        <CardContent className="flex-1 min-h-0 flex flex-col overflow-hidden gap-0 px-0 pb-24 md:px-0 md:pb-0 md:gap-4 transactions-card-content">
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

          <div data-tour="paymentsList">
            {mortgagePayments.length === 0 ? (
              <div className="text-center text-muted-foreground py-10 px-4 md:px-0 flex flex-col items-center gap-3">
                <Home className="size-8 text-muted-foreground/70" />
                <p className="text-sm font-medium text-foreground/80">
                  {t("mortgage.noPaymentsYet")}
                </p>
              </div>
            ) : (
              <>
                <div className="hidden md:block md:border md:rounded-md">
                  <MortgagePaymentsTable
                    payments={mortgagePayments}
                    onRemove={setDeleteConfirm}
                    onUpdateOwner={(id, owner) =>
                      updateExpense(id, { owner: owner || undefined })
                    }
                    ownerOptions={owners}
                  />
                </div>
                <div className="md:hidden">
                  <MortgagePaymentsList
                    payments={mortgagePayments}
                    onPaymentTap={setPaymentForActions}
                  />
                </div>
              </>
            )}
          </div>
        </CardContent>
      </Card>

      <div className="md:hidden fixed inset-x-0 bottom-[calc(env(safe-area-inset-bottom)+72px)] z-30 px-4 pb-3 pointer-events-none">
        <div className="pointer-events-auto flex items-center justify-end">
          <div className="flex items-center gap-2 rounded-full border border-border/60 bg-background/20 shadow-lg shadow-black/30 backdrop-blur px-2 py-2">
            <Button
              onClick={() => setAddOpen(true)}
              data-tour-action="openAddMortgage"
              className="h-11 w-11 rounded-full p-0"
              aria-label={t("mortgage.addMortgagePayment")}
            >
              <Plus className="size-4" />
            </Button>
          </div>
        </div>
      </div>

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
