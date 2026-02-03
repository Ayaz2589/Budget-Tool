import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { DollarSign, Calendar, Trash2 } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { getDebtBalance } from "@/lib/debtUtils";
import { formatCurrency } from "@/lib/format";
import type { DebtPayment } from "@/types/core";
import { cn } from "@/lib/utils";
import type { DebtActionsDialogProps } from "@/types/debt";

export type { DebtActionsDialogProps };

export function DebtActionsDialog({
  debt,
  payments,
  onClose,
  onAddPayment,
  onEditRecurring,
  onUpdateOwner,
  ownerOptions = [],
  onDelete,
  onRemovePayment,
  t,
}: DebtActionsDialogProps) {
  const [paymentToRemove, setPaymentToRemove] = useState<DebtPayment | null>(
    null
  );

  if (debt === null) return null;

  const balance = getDebtBalance(debt, payments);
  const hasRecurring = debt.recurringAmount != null && debt.recurringAmount > 0;

  const handleAddPayment = () => {
    onAddPayment(debt.id);
    onClose();
  };

  const handleEditRecurring = () => {
    onEditRecurring(debt);
    onClose();
  };

  const handleDelete = () => {
    onDelete(debt.id);
    onClose();
  };

  const recurringLabel = hasRecurring
    ? `${formatCurrency(debt.recurringAmount!)} ${
        debt.recurringFrequency === "biweekly"
          ? `bi-weekly from ${debt.recurringStartDate ?? debt.startDate ?? "—"}`
          : `monthly on day ${debt.recurringDayOfMonth ?? "—"}`
      }`
    : "—";

  return (
    <Dialog open={debt !== null} onOpenChange={(open) => !open && onClose()}>
      <DialogContent
        showCloseButton={true}
        className="fixed bottom-0 left-0 right-0 top-auto z-50 w-full max-w-full max-h-[85vh] translate-x-0 translate-y-0 rounded-t-2xl border-t p-0 gap-0 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:slide-out-to-bottom data-[state=open]:slide-in-from-bottom"
      >
        <DialogHeader className="p-4 pb-2">
          <DialogTitle className="text-left truncate pr-8">
            {debt.name}
          </DialogTitle>
        </DialogHeader>
        <div className="overflow-y-auto overscroll-contain px-4 pb-8 flex flex-col gap-4">
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div>
              <p className="text-muted-foreground text-xs uppercase tracking-wide">
                Initial
              </p>
              <p className="font-medium mt-0.5">
                {formatCurrency(debt.initialAmount)}
              </p>
            </div>
            <div>
              <p className="text-muted-foreground text-xs uppercase tracking-wide">
                Balance
              </p>
              <p className="text-lg font-semibold mt-0.5">
                {formatCurrency(balance)}
              </p>
            </div>
            <div className="col-span-2">
              <p className="text-muted-foreground text-xs uppercase tracking-wide">
                Recurring
              </p>
              <p className="text-sm font-medium mt-0.5 text-muted-foreground">
                {recurringLabel}
              </p>
            </div>
          </div>

          <div className="space-y-2">
            <Label>{t("common.owner")}</Label>
            <Select
              value={debt.owner || "_none"}
              onValueChange={(v) =>
                onUpdateOwner(debt.id, v === "_none" ? "" : v)
              }
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder={t("common.noOwner")} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="_none">{t("common.noOwner")}</SelectItem>
                {ownerOptions.map((o) => (
                  <SelectItem key={o} value={o}>
                    {o}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex flex-col gap-2">
            <Button
              variant="outline"
              size="sm"
              className="w-full justify-start"
              onClick={handleEditRecurring}
            >
              <Calendar className="size-4" />
              {hasRecurring ? "Edit recurring" : "Set recurring"}
            </Button>
            <Button
              size="sm"
              className="w-full justify-start"
              onClick={handleAddPayment}
              disabled={balance <= 0}
            >
              <DollarSign className="size-4" />
              Make payment
            </Button>
            <Button
              variant="destructive"
              size="sm"
              className="w-full justify-start"
              onClick={handleDelete}
            >
              <Trash2 className="size-4 text-destructive" />
              Delete debt
            </Button>
          </div>

          {payments.length > 0 && (
            <div className="border-t pt-4 space-y-2">
              <h4 className="text-sm font-medium text-muted-foreground">
                Payment history
              </h4>
              <ul className="space-y-1">
                {payments.map((p) => (
                  <li
                    key={p.id}
                    className={cn(
                      "flex items-center justify-between gap-2 py-2 px-3 rounded-md bg-muted/50 text-sm"
                    )}
                  >
                    <span className="text-muted-foreground">{p.date}</span>
                    <span className="font-medium">
                      {formatCurrency(p.amount)}
                    </span>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-muted-foreground hover:text-destructive shrink-0"
                      onClick={() => setPaymentToRemove(p)}
                      aria-label={t("debt.removePayment")}
                    >
                      <Trash2 className="size-4 text-destructive" />
                    </Button>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </DialogContent>
      <Dialog
        open={paymentToRemove !== null}
        onOpenChange={(open) => !open && setPaymentToRemove(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("debt.removePaymentTitle")}</DialogTitle>
            <DialogDescription>
              {paymentToRemove
                ? t("debt.removePaymentDesc", {
                    amount: formatCurrency(paymentToRemove.amount),
                    date: paymentToRemove.date,
                  })
                : ""}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setPaymentToRemove(null)}
            >
              {t("common.cancel")}
            </Button>
            <Button
              type="button"
              variant="destructive"
              onClick={() => {
                if (paymentToRemove) {
                  onRemovePayment(paymentToRemove.id);
                  setPaymentToRemove(null);
                }
              }}
            >
              <Trash2 className="size-4" />
              {t("debt.removePayment")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Dialog>
  );
}
