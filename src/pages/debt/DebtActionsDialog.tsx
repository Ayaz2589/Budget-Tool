import { useState } from "react";
import {
  Sheet,
  SheetContent,
} from "@/components/ui/sheet";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Trash2 } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { getDebtBalance } from "@/lib/debtUtils";
import { formatCurrency, formatDate } from "@/lib/format";
import type { DebtPayment } from "@/types/core";
import { cn } from "@/lib/utils";
import type { DebtActionsDialogProps } from "@/types/debt";
import { DsSheetActions, DsSheetHeader } from "@/components/ds";

export type { DebtActionsDialogProps };

export function DebtActionsDialog({
  debt,
  payments,
  onClose,
  onAddPayment,
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

  const handleAddPayment = () => {
    onAddPayment(debt.id);
    onClose();
  };

  const handleDelete = () => {
    onDelete(debt.id);
    onClose();
  };

  return (
    <Sheet open={debt !== null} onOpenChange={(open) => !open && onClose()}>
      <SheetContent
        side="right"
        showCloseButton={true}
        className="h-full w-[85vw] max-w-sm border-l p-0 gap-0 rounded-l-2xl flex flex-col overflow-hidden"
      >
        <DsSheetHeader className="p-4 pb-2" title={debt.name} />
        <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain px-4 pb-4 flex flex-col gap-4">
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
                    <span className="text-muted-foreground">{formatDate(p.date)}</span>
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
        <DsSheetActions className="py-3">
          <div className="flex items-center gap-2">
            <Button
              density="compact"
              className="h-11 flex-1 justify-center text-center"
              onClick={handleAddPayment}
              disabled={balance <= 0}
            >
              Make payment
            </Button>
            <Button
              variant="destructive"
              density="compact"
              className="h-11 flex-1 justify-center text-center"
              onClick={handleDelete}
            >
              <Trash2 className="size-4 text-destructive" />
              Delete debt
            </Button>
          </div>
        </DsSheetActions>
      </SheetContent>
      <Dialog
        open={paymentToRemove !== null}
        onOpenChange={(open) => !open && setPaymentToRemove(null)}
      >
        <DialogContent>
          <div className="flex flex-col gap-2 text-center sm:text-left">
            <DialogTitle>{t("debt.removePaymentTitle")}</DialogTitle>
            <DialogDescription>
              {paymentToRemove
                ? t("debt.removePaymentDesc", {
                    amount: formatCurrency(paymentToRemove.amount),
                    date: paymentToRemove.date,
                  })
                : ""}
            </DialogDescription>
          </div>
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
    </Sheet>
  );
}
