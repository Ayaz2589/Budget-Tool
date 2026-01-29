import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { CategoryOption } from "@/lib/categoryColors";
import { formatCurrency } from "@/lib/format";
import type { Expense } from "@/lib/types";

export type ExpenseActionsDialogProps = {
  expense: Expense | null;
  onClose: () => void;
  onUpdateCategory: (id: string, category: string) => void;
  onDelete: (expense: Expense) => void;
  expenseCategories: string[];
  t: (key: string) => string;
};

export function ExpenseActionsDialog({
  expense,
  onClose,
  onUpdateCategory,
  onDelete,
  expenseCategories,
  t,
}: ExpenseActionsDialogProps) {
  if (expense === null) return null;

  const handleDelete = () => {
    onDelete(expense);
    onClose();
  };

  return (
    <Dialog open={expense !== null} onOpenChange={(open) => !open && onClose()}>
      <DialogContent
        showCloseButton={true}
        className="fixed bottom-0 left-0 right-0 top-auto z-50 max-h-[85vh] translate-x-0 translate-y-0 rounded-t-2xl border-t p-0 gap-0 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:slide-out-to-bottom data-[state=open]:slide-in-from-bottom"
      >
        <DialogHeader className="p-4 pb-2">
          <DialogTitle className="text-left truncate pr-8">
            {expense.description || t("transactions.transaction")}
          </DialogTitle>
        </DialogHeader>
        <div className="overflow-y-auto overscroll-contain px-4 pb-8 flex flex-col gap-4">
          <div className="text-sm text-muted-foreground space-y-1">
            <p>{expense.date}</p>
            <p className="font-medium text-foreground">
              {formatCurrency(expense.amount)}
            </p>
          </div>
          <div className="space-y-2">
            <Label>{t("common.category")}</Label>
            <Select
              value={expense.category || "_"}
              onValueChange={(v) =>
                onUpdateCategory(expense.id, v === "_" ? "" : v)
              }
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder={t("common.category")} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="_">
                  <CategoryOption
                    name={t("common.uncategorized")}
                    type="expense"
                  />
                </SelectItem>
                {expenseCategories.map((c) => (
                  <SelectItem key={c} value={c}>
                    <CategoryOption name={c} type="expense" />
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <Button
            variant="destructive"
            className="w-full"
            onClick={handleDelete}
          >
            {t("common.delete")}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
