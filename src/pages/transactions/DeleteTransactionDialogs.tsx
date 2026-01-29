import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { formatCurrency } from "@/lib/format";
import type { Expense } from "@/lib/types";

export type DeleteOneTransactionDialogProps = {
  expense: Expense | null;
  onClose: () => void;
  onConfirm: () => void;
  t: (key: string, opts?: Record<string, string>) => string;
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
            {t("common.delete")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export type DeleteSelectedTransactionsDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  count: number;
  onConfirm: () => void;
  t: (key: string, opts?: { count?: number }) => string;
};

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
            {t("transactions.deleteSelected", { count })}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export type DeleteAllTransactionsDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  count: number;
  onConfirm: () => void;
  t: (key: string, opts?: { count?: number }) => string;
};

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
            {t("transactions.deleteAll")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
