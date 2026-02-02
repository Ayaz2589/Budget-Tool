import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatCurrency } from "@/lib/format";
import type {
  DeleteOneTransactionDialogProps,
  DeleteSelectedTransactionsDialogProps,
  DeleteAllTransactionsDialogProps,
} from "@/types/transactions";

export type {
  DeleteOneTransactionDialogProps,
  DeleteSelectedTransactionsDialogProps,
  DeleteAllTransactionsDialogProps,
};

export function DeleteOneTransactionDialog({
  expense,
  onClose,
  onConfirm,
  t,
}: DeleteOneTransactionDialogProps) {
  return (
    <Dialog open={expense !== null} onOpenChange={(open) => !open && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t("transactions.deleteThisTitle")}</DialogTitle>
          <DialogDescription>
            {expense
              ? t("transactions.deleteThisDesc", {
                  date: expense.date,
                  description: expense.description,
                  amount: formatCurrency(expense.amount),
                })
              : t("transactions.deleteThisDesc", {
                  date: "",
                  description: "",
                  amount: "",
                })}
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            {t("common.cancel")}
          </Button>
          <Button variant="destructive" onClick={onConfirm}>
            <Trash2 className="size-4" />
            {t("common.delete")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export function DeleteSelectedTransactionsDialog({
  open,
  onOpenChange,
  count,
  onConfirm,
  t,
}: DeleteSelectedTransactionsDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t("transactions.deleteSelectedTitle")}</DialogTitle>
          <DialogDescription>
            {t("transactions.deleteSelectedDesc", { count })}
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            {t("common.cancel")}
          </Button>
          <Button variant="destructive" onClick={onConfirm}>
            <Trash2 className="size-4" />
            {t("transactions.deleteSelected", { count })}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export function DeleteAllTransactionsDialog({
  open,
  onOpenChange,
  count,
  onConfirm,
  t,
}: DeleteAllTransactionsDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t("transactions.deleteAllTitle")}</DialogTitle>
          <DialogDescription>
            {t("transactions.deleteAllDesc", { count })}
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            {t("common.cancel")}
          </Button>
          <Button variant="destructive" onClick={onConfirm}>
            <Trash2 className="size-4" />
            {t("transactions.deleteAll")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
