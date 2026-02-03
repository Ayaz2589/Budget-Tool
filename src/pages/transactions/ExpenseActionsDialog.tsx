import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Trash2 } from "lucide-react";
import { CategoryOption } from "@/lib/categoryColors";
import { formatCurrency } from "@/lib/format";
import type { ExpenseActionsDialogProps } from "@/types/transactions";

export type { ExpenseActionsDialogProps };

export function ExpenseActionsDialog({
  expense,
  onClose,
  onUpdateCategory,
  onUpdateOwner,
  onDelete,
  expenseCategories,
  ownerOptions = [],
  t,
}: ExpenseActionsDialogProps) {
  if (expense === null) return null;

  const handleDelete = () => {
    onDelete(expense);
    onClose();
  };

  return (
    <Sheet open={expense !== null} onOpenChange={(open) => !open && onClose()}>
      <SheetContent
        side="bottom"
        showCloseButton={true}
        className="w-full max-w-full max-h-[92vh] rounded-t-2xl border-t p-0 gap-0"
      >
        <SheetHeader className="p-5 pb-3">
          <SheetTitle className="text-left pr-8 break-words text-xl leading-snug">
            {expense.description || t("transactions.transaction")}
          </SheetTitle>
        </SheetHeader>
        <div className="overflow-y-auto overscroll-contain px-5 pb-10 flex flex-col gap-5">
          <div className="text-base text-muted-foreground space-y-1">
            <p>{expense.date}</p>
            <p className="font-semibold text-foreground text-lg">
              {formatCurrency(expense.amount)}
            </p>
          </div>
          <div className="space-y-2">
            <Label className="text-sm">{t("common.category")}</Label>
            <Select
              value={expense.category || "_"}
              onValueChange={(v) =>
                onUpdateCategory(expense.id, v === "_" ? "" : v)
              }
            >
              <SelectTrigger className="w-full h-12 text-base">
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
          <div className="space-y-2">
            <Label className="text-sm">{t("common.owner")}</Label>
            <Select
              value={expense.owner || "_none"}
              onValueChange={(v) =>
                onUpdateOwner(expense.id, v === "_none" ? "" : v)
              }
            >
              <SelectTrigger className="w-full h-12 text-base">
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
          <Button
            variant="destructive"
            className="w-full h-12 text-base"
            onClick={handleDelete}
          >
            <Trash2 className="size-4" />
            {t("common.delete")}
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
