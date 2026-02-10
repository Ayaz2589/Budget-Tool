import { useState, useMemo, useEffect, useRef } from "react";
import { useTranslation } from "react-i18next";
import { useLocation } from "react-router-dom";
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
import { CreditCard, Plus, Trash2 } from "lucide-react";
import { DsActionBar, DsEmptyState, DsSectionHeader } from "@/components/ds";
import { AddDebtDialog } from "./AddDebtDialog";
import { AddPaymentDialog } from "./AddPaymentDialog";
import { DebtList } from "./DebtList";
import { DebtListMobile } from "./DebtListMobile";
import { DebtActionsDialog } from "./DebtActionsDialog";

export function DebtPage() {
  const location = useLocation();
  const {
    debts,
    debtPayments,
    addDebt,
    updateDebt,
    removeDebt,
    addDebtPayment,
    removeDebtPayment,
    owners,
    uiFormatSettings,
  } = useBudget();
  const [addDebtOpen, setAddDebtOpen] = useState(false);
  const [paymentDebtId, setPaymentDebtId] = useState<string | null>(null);
  const [deleteConfirmDebtId, setDeleteConfirmDebtId] = useState<string | null>(
    null,
  );
  const [debtForActions, setDebtForActions] = useState<Debt | null>(null);
  const handledDebtIdRef = useRef<string | null>(null);

  useEffect(() => {
    const targetDebtId = new URLSearchParams(location.search).get("debtId");
    if (!targetDebtId) return;
    if (handledDebtIdRef.current === targetDebtId) return;
    const target = debts.find((debt) => debt.id === targetDebtId);
    if (target) {
      setDebtForActions(target);
      handledDebtIdRef.current = targetDebtId;
    }
  }, [debts, location.search]);

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
      <div className="mb-3 px-4 md:px-0 pt-4 md:pt-0 shrink-0 bg-background/95 md:bg-transparent backdrop-blur md:backdrop-blur-none">
        <DsSectionHeader
          title={t("debt.title")}
          subtitle={t("debt.subtitle")}
          showCurrencyChip
          actions={
            <Button
              className="hidden md:inline-flex"
              onClick={() => setAddDebtOpen(true)}
            >
              <Plus className="size-4" />
              {t("debt.addDebt")}
            </Button>
          }
        />
      </div>

      <AddDebtDialog
        open={addDebtOpen}
        onOpenChange={setAddDebtOpen}
        owners={owners}
        dateFormat={uiFormatSettings.dateFormat}
        onSubmit={(payload) => {
          addDebt(payload);
          setAddDebtOpen(false);
        }}
      />

      <div
       
        className="flex-1 min-h-0 flex flex-col overflow-hidden"
      >
        <div className="flex-1 min-h-0 flex flex-col overflow-hidden gap-0 px-0 pb-24 md:px-0 md:pb-0 md:gap-4 transactions-card-content">
          {debts.length === 0 ? (
            <DsEmptyState
              icon={<CreditCard className="size-8" />}
              title={t("debt.noDebtsYet")}
            />
          ) : (
            <>
              <div className="hidden md:block">
                <DebtList
                  debts={debts}
                  paymentsByDebt={paymentsByDebt}
                  onDebtTap={setDebtForActions}
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

      <DsActionBar>
            <Button
              onClick={() => setAddDebtOpen(true)}
              density="compact"
             
              className="h-11 w-11 rounded-full p-0"
              aria-label={t("debt.addDebt")}
            >
              <Plus className="size-4" />
            </Button>
      </DsActionBar>

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

      <DebtActionsDialog
        debt={debtForActions}
        payments={
          debtForActions ? (paymentsByDebt.get(debtForActions.id) ?? []) : []
        }
        onClose={() => setDebtForActions(null)}
        onAddPayment={setPaymentDebtId}
        onUpdateOwner={(id, owner) =>
          updateDebt(id, { owner: owner || undefined })
        }
        ownerOptions={owners}
        onDelete={setDeleteConfirmDebtId}
        onRemovePayment={removeDebtPayment}
        t={t}
      />
    </div>
  );
}
