import { useState, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { useBudget } from "@/context/BudgetContext";
import type { Debt, DebtPayment } from "@/lib/types";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { PageTourTrigger } from "@/components/PageTourTrigger";
import { debtTourSteps } from "@/lib/pageTourSteps";
import { CreditCard, Plus, Trash2 } from "lucide-react";
import { formatCurrency } from "@/lib/format";
import { AddDebtDialog } from "./AddDebtDialog";
import { AddPaymentDialog } from "./AddPaymentDialog";
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
    owners,
  } = useBudget();
  const [addDebtOpen, setAddDebtOpen] = useState(false);
  const [paymentDebtId, setPaymentDebtId] = useState<string | null>(null);
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

  const { t } = useTranslation();
  return (
    <div className="flex flex-col min-h-0 flex-1 overflow-hidden">
      <div className="hidden md:flex flex-wrap items-start justify-between gap-2 shrink-0 mb-4">
        <div className="space-y-1 min-w-0">
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-semibold">{t("debt.title")}</h1>
            <PageTourTrigger pageId="debt" steps={debtTourSteps} />
          </div>
          <p className="text-sm text-muted-foreground">{t("debt.subtitle")}</p>
        </div>
        <Button data-tour="addDebt" onClick={() => setAddDebtOpen(true)}>
          <Plus className="size-4" />
          {t("debt.addDebt")}
        </Button>
      </div>
      <div className="md:hidden mb-3 px-4 pt-4 shrink-0 bg-background/95 backdrop-blur">
        <div className="px-0 py-3 flex items-center justify-between gap-3">
          <div className="min-w-0">
            <h1 className="text-xl font-semibold">{t("debt.title")}</h1>
            <p className="text-xs text-muted-foreground">
              {t("debt.subtitle")}
            </p>
          </div>
          <PageTourTrigger pageId="debt" steps={debtTourSteps} />
        </div>
      </div>

      <AddDebtDialog
        open={addDebtOpen}
        onOpenChange={setAddDebtOpen}
        owners={owners}
        onSubmit={(payload) => {
          addDebt(payload);
          setAddDebtOpen(false);
        }}
      />

      <div
        data-tour="debtList"
        className="flex-1 min-h-0 flex flex-col overflow-hidden"
      >
        <div className="flex-1 min-h-0 flex flex-col overflow-hidden gap-0 px-0 pb-24 md:px-0 md:pb-0 md:gap-4 transactions-card-content">
          {debts.length === 0 ? (
            <div className="text-center text-muted-foreground py-10 px-4 flex flex-col items-center gap-3">
              <CreditCard className="size-8 text-muted-foreground/70" />
              <p className="text-sm font-medium text-foreground/80">
                {t("debt.noDebtsYet")}
              </p>
            </div>
          ) : (
            <>
              <div className="hidden md:block">
                <DebtList
                  debts={debts}
                  paymentsByDebt={paymentsByDebt}
                  onAddPayment={setPaymentDebtId}
                  onUpdateOwner={(id, owner) =>
                    updateDebt(id, { owner: owner || undefined })
                  }
                  ownerOptions={owners}
                  onDelete={setDeleteConfirmDebtId}
                  onRemovePayment={setPaymentToRemoveId}
                />
              </div>
              <div className="md:hidden">
                <DebtListMobile
                  debts={debts}
                  paymentsByDebt={paymentsByDebt}
                  onDebtTap={setDebtForActions}
                />
              </div>
            </>
          )}
        </div>
      </div>

      <div className="md:hidden fixed inset-x-0 bottom-[calc(env(safe-area-inset-bottom)+72px)] z-30 px-4 pb-3 pointer-events-none">
        <div className="pointer-events-auto flex items-center justify-end">
          <div className="flex items-center gap-2 rounded-full border border-border/60 bg-background/20 shadow-lg shadow-black/30 backdrop-blur px-2 py-2">
            <Button
              onClick={() => setAddDebtOpen(true)}
              className="h-11 w-11 rounded-full p-0"
              aria-label={t("debt.addDebt")}
            >
              <Plus className="size-4" />
            </Button>
          </div>
        </div>
      </div>

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
        onUpdateOwner={(id, owner) =>
          updateDebt(id, { owner: owner || undefined })
        }
        ownerOptions={owners}
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
    </div>
  );
}
