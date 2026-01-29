import { useState, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { useBudget } from "@/context/BudgetContext";
import type { DebtPayment } from "@/lib/types";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { AddDebtDialog } from "@/pages/debt/AddDebtDialog";
import { AddPaymentDialog } from "@/pages/debt/AddPaymentDialog";
import { EditRecurringDialog } from "@/pages/debt/EditRecurringDialog";
import { DebtList } from "@/pages/debt/DebtList";

export function DebtPage() {
  const {
    debts,
    debtPayments,
    addDebt,
    updateDebt,
    removeDebt,
    addDebtPayment,
    removeDebtPayment,
  } = useBudget();
  const [addDebtOpen, setAddDebtOpen] = useState(false);
  const [paymentDebtId, setPaymentDebtId] = useState<string | null>(null);
  const [recurringDebtId, setRecurringDebtId] = useState<string | null>(null);
  const [deleteConfirmDebtId, setDeleteConfirmDebtId] = useState<string | null>(
    null,
  );

  const paymentsByDebt = useMemo(() => {
    const map = new Map<string, DebtPayment[]>();
    for (const p of debtPayments) {
      const list = map.get(p.debtId) ?? [];
      list.push(p);
      map.set(p.debtId, list);
    }
    for (const list of map.values()) {
      list.sort((a, b) => b.date.localeCompare(a.date));
    }
    return map;
  }, [debtPayments]);

  const recurringDebt =
    recurringDebtId != null
      ? (debts.find((d) => d.id === recurringDebtId) ?? null)
      : null;

  const { t } = useTranslation();
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">{t("debt.title")}</h1>
      <Card>
        <CardHeader>
          <CardTitle>{t("debt.addDebt")}</CardTitle>
          <CardDescription>{t("debt.addDebtDesc")}</CardDescription>
        </CardHeader>
        <CardContent>
          <AddDebtDialog
            open={addDebtOpen}
            onOpenChange={setAddDebtOpen}
            onSubmit={(payload) => {
              addDebt(payload);
              setAddDebtOpen(false);
            }}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Debts</CardTitle>
          <CardDescription>
            Current balance = initial amount minus payments. Make payments to
            track progress.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <DebtList
            debts={debts}
            paymentsByDebt={paymentsByDebt}
            onAddPayment={setPaymentDebtId}
            onEditRecurring={(debt) => setRecurringDebtId(debt.id)}
            onDelete={setDeleteConfirmDebtId}
            onRemovePayment={removeDebtPayment}
            deleteConfirmDebtId={deleteConfirmDebtId}
            onConfirmDelete={(id) => {
              removeDebt(id);
              setDeleteConfirmDebtId(null);
            }}
            onDismissDelete={() => setDeleteConfirmDebtId(null)}
          />
        </CardContent>
      </Card>

      <AddPaymentDialog
        open={paymentDebtId !== null}
        debtId={paymentDebtId}
        onClose={() => setPaymentDebtId(null)}
        onSubmit={(payload) => {
          addDebtPayment(payload);
          setPaymentDebtId(null);
        }}
      />

      <EditRecurringDialog
        open={recurringDebtId !== null}
        debt={recurringDebt}
        onClose={() => setRecurringDebtId(null)}
        onSave={(payload) => {
          if (recurringDebtId) updateDebt(recurringDebtId, payload);
          setRecurringDebtId(null);
        }}
        onClear={() => {
          if (recurringDebtId)
            updateDebt(recurringDebtId, {
              recurringAmount: undefined,
              recurringFrequency: undefined,
              recurringDayOfMonth: undefined,
              recurringStartDate: undefined,
            });
          setRecurringDebtId(null);
        }}
      />
    </div>
  );
}
