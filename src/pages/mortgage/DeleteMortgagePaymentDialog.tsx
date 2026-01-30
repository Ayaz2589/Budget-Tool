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
import type { Expense } from "@/lib/types";

export type DeleteMortgagePaymentDialogProps = {
  expense: Expense | null;
  onClose: () => void;
  onConfirm: () => void;
};

export function DeleteMortgagePaymentDialog({
  expense,
  onClose,
  onConfirm,
}: DeleteMortgagePaymentDialogProps) {
  return (
    <Dialog open={!!expense} onOpenChange={(open) => !open && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Remove mortgage payment?</DialogTitle>
          <DialogDescription>
            {expense
              ? `Remove ${expense.date} payment of ${formatCurrency(expense.amount)}? This cannot be undone.`
              : ""}
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button variant="destructive" onClick={onConfirm}>
            <Trash2 className="size-4" />
            Remove
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
