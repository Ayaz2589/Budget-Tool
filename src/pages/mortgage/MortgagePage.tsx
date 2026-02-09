import { useState, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { useBudget } from "@/context/BudgetContext";
import type { Expense } from "@/lib/types";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Home, Plus } from "lucide-react";
import { DsActionBar, DsEmptyState, DsSectionHeader } from "@/components/ds";
import {
  formatCurrencyFromNumber,
  parseCurrencyInput,
} from "@/lib/currencyInput";
import { dateInputToIso, isoToDateInput } from "@/lib/dateInput";
import { AddMortgagePaymentDialog } from "./AddMortgagePaymentDialog";
import { MortgagePaymentsTable } from "./MortgagePaymentsTable";
import { MortgagePaymentsList } from "./MortgagePaymentsList";
import { MortgagePaymentActionsDialog } from "./MortgagePaymentActionsDialog";
import { DeleteMortgagePaymentDialog } from "./DeleteMortgagePaymentDialog";

const MORTGAGE_CATEGORY = "Mortgage";
const DEFAULT_MORTGAGE_AMOUNT = 5400;

export function MortgagePage() {
  const { expenses, addExpense, updateExpense, removeExpense, owners, uiFormatSettings } = useBudget();
  const [addOpen, setAddOpen] = useState(false);
  const [addDate, setAddDate] = useState(() =>
    isoToDateInput(new Date().toISOString().slice(0, 10), uiFormatSettings.dateFormat),
  );
  const [addAmount, setAddAmount] = useState(
    formatCurrencyFromNumber(DEFAULT_MORTGAGE_AMOUNT)
  );
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
    const num = parseCurrencyInput(addAmount);
    if (Number.isNaN(num) || num <= 0) return;
    const isoDate = dateInputToIso(addDate, uiFormatSettings.dateFormat);
    if (!isoDate) return;
    addExpense({
      date: isoDate,
      amount: num,
      description: MORTGAGE_CATEGORY,
      category: MORTGAGE_CATEGORY,
      source: "manual",
      owner: addOwner || undefined,
    });
    setAddDate(
      isoToDateInput(new Date().toISOString().slice(0, 10), uiFormatSettings.dateFormat)
    );
    setAddAmount(formatCurrencyFromNumber(DEFAULT_MORTGAGE_AMOUNT));
    setAddOpen(false);
  };

  const handleRemove = (exp: Expense) => {
    removeExpense(exp.id);
    setDeleteConfirm(null);
  };

  const { t } = useTranslation();
  return (
    <div className="flex flex-col min-h-0 flex-1 overflow-hidden">
      <div className="mb-3 px-4 md:px-0 pt-4 md:pt-0 shrink-0 bg-background/95 md:bg-transparent backdrop-blur md:backdrop-blur-none">
        <DsSectionHeader
          title={t("mortgage.title")}
          subtitle={t("mortgage.subtitle")}
          actions={
            <Button className="hidden md:inline-flex" onClick={() => setAddOpen(true)}>
              <Plus className="size-4" />
              {t("mortgage.addPayment")}
            </Button>
          }
        />
      </div>

      <Card className="flex-1 min-h-0 flex flex-col overflow-hidden md:border-0 md:shadow-none md:rounded-none md:bg-transparent md:py-0">
        <CardContent className="flex-1 min-h-0 flex flex-col overflow-hidden gap-0 px-0 pb-24 md:px-0 md:pb-0 md:gap-4 transactions-card-content">
          <AddMortgagePaymentDialog
            open={addOpen}
            onOpenChange={setAddOpen}
            dateFormat={uiFormatSettings.dateFormat}
            date={addDate}
            onDateChange={setAddDate}
            amount={addAmount}
            onAmountChange={setAddAmount}
            owner={addOwner}
            onOwnerChange={setAddOwner}
            ownerOptions={owners}
            onSubmit={handleAdd}
          />

          <div>
            {mortgagePayments.length === 0 ? (
              <DsEmptyState
                icon={<Home className="size-8" />}
                title={t("mortgage.noPaymentsYet")}
              />
            ) : (
              <>
                <div className="hidden md:block">
                  <MortgagePaymentsTable
                    payments={mortgagePayments}
                    onPaymentTap={setPaymentForActions}
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

      <DsActionBar>
            <Button
              onClick={() => setAddOpen(true)}
              density="compact"
             
              className="h-11 w-11 rounded-full p-0"
              aria-label={t("mortgage.addMortgagePayment")}
            >
              <Plus className="size-4" />
            </Button>
      </DsActionBar>

      <MortgagePaymentActionsDialog
        payment={paymentForActions}
        onClose={() => setPaymentForActions(null)}
        onRemove={(exp) => {
          setPaymentForActions(null);
          setDeleteConfirm(exp);
        }}
        onUpdateOwner={(id, owner) =>
          updateExpense(id, {
            owner: owner || undefined,
            paidByOwner: owner || undefined,
            allocationMode: owner ? "single" : undefined,
            allocation: owner ? [{ owner, percent: 100 }] : undefined,
          })
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
