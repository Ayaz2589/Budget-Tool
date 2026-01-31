import { useState, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { useBudget } from "@/context/BudgetContext";
import type { Debt, DebtPayment } from "@/lib/types";
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
import { Button } from "@/components/ui/button";
import { Plus, Trash2 } from "lucide-react";
import { formatCurrency } from "@/lib/format";
import { AddDebtDialog } from "./AddDebtDialog";
import { AddPaymentDialog } from "./AddPaymentDialog";
import { EditRecurringDialog } from "./EditRecurringDialog";
import { DebtList } from "./DebtList";
import { DebtListMobile } from "./DebtListMobile";
import { DebtActionsDialog } from "./DebtActionsDialog";

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
  const [debtForActions, setDebtForActions] = useState<Debt | null>(null);
  const [paymentToRemoveId, setPaymentToRemoveId] = useState<string | null>(
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
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="space-y-1">
          <h1 className="text-2xl font-semibold">{t("debt.title")}</h1>
          <p className="text-sm text-muted-foreground">{t("debt.subtitle")}</p>
        </div>
        <Button onClick={() => setAddDebtOpen(true)}>
          <Plus className="size-4" />
          {t("debt.addDebt")}
        </Button>
      </div>

      <AddDebtDialog
        open={addDebtOpen}
        onOpenChange={setAddDebtOpen}
        onSubmit={(payload) => {
          addDebt(payload);
          setAddDebtOpen(false);
        }}
      />

      <Card>
        <CardHeader>
          <CardTitle>Debts</CardTitle>
          <CardDescription>
            Current balance = initial amount minus payments. Make payments to
            track progress.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {debts.length === 0 ? (
            <p className="text-muted-foreground text-sm py-6 text-center">
              No debts yet.
            </p>
          ) : (
            <>
              <div className="hidden md:block">
                <DebtList
                  debts={debts}
                  paymentsByDebt={paymentsByDebt}
                  onAddPayment={setPaymentDebtId}
                  onEditRecurring={(debt) => setRecurringDebtId(debt.id)}
                  onDelete={setDeleteConfirmDebtId}
                  onRemovePayment={setPaymentToRemoveId}
                />
              </div>
              <div className="md:hidden max-h-[50vh] overflow-y-auto border rounded-md">
                <DebtListMobile
                  debts={debts}
                  paymentsByDebt={paymentsByDebt}
                  onDebtTap={setDebtForActions}
                />
              </div>
            </>
          )}
        </CardContent>
      </Card>

      <DebtActionsDialog
        debt={debtForActions}
        payments={
          debtForActions ? (paymentsByDebt.get(debtForActions.id) ?? []) : []
        }
        onClose={() => setDebtForActions(null)}
        onAddPayment={(id) => {
          setDebtForActions(null);
          setPaymentDebtId(id);
        }}
        onEditRecurring={(debt) => {
          setDebtForActions(null);
          setRecurringDebtId(debt.id);
        }}
        onDelete={(id) => {
          setDebtForActions(null);
          setDeleteConfirmDebtId(id);
        }}
        onRemovePayment={removeDebtPayment}
        t={t}
      />

      <Dialog
        open={paymentToRemoveId !== null}
        onOpenChange={(open) => !open && setPaymentToRemoveId(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("debt.removePaymentTitle")}</DialogTitle>
            <DialogDescription>
              {(() => {
                const p = debtPayments.find((x) => x.id === paymentToRemoveId);
                return p
                  ? t("debt.removePaymentDesc", {
                      amount: formatCurrency(p.amount),
                      date: p.date,
                    })
                  : "";
              })()}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setPaymentToRemoveId(null)}
            >
              {t("common.cancel")}
            </Button>
            <Button
              type="button"
              variant="destructive"
              onClick={() => {
                if (paymentToRemoveId) {
                  removeDebtPayment(paymentToRemoveId);
                  setPaymentToRemoveId(null);
                }
              }}
            >
              <Trash2 className="size-4" />
              {t("debt.removePayment")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={deleteConfirmDebtId !== null}
        onOpenChange={(open) => !open && setDeleteConfirmDebtId(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("debt.deleteDebtTitle")}</DialogTitle>
            <DialogDescription>
              {t("debt.deleteDebtDesc")}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setDeleteConfirmDebtId(null)}
            >
              {t("common.cancel")}
            </Button>
            <Button
              type="button"
              variant="destructive"
              onClick={() => {
                if (deleteConfirmDebtId) {
                  removeDebt(deleteConfirmDebtId);
                  setDeleteConfirmDebtId(null);
                }
              }}
            >
              <Trash2 className="size-4" />
              {t("debt.deleteDebt")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

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
