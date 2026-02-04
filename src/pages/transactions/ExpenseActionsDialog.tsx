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
import { useMediaQuery } from "@/hooks/useMediaQuery";

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

  const fieldClass = "h-11 w-full";
  const selectTriggerClass = "h-11 w-full data-[size=default]:h-11";
  const isDesktop = useMediaQuery("(min-width: 768px)");
  const sheetSide = "right";

  return (
    <Sheet open={expense !== null} onOpenChange={(open) => !open && onClose()}>
      <SheetContent
        side={sheetSide}
        showCloseButton={true}
        className="h-full w-[85vw] max-w-sm border-l p-0 gap-0 rounded-l-2xl overflow-y-auto"
      >
        <SheetHeader className="px-4 pt-5 pb-3">
          <SheetTitle className="text-left pr-8 break-words text-xl leading-snug">
            {expense.description || t("addTransaction.transaction")}
          </SheetTitle>
        </SheetHeader>
        <div className="grid gap-5 px-4 pb-8 overflow-y-auto overscroll-contain">
          <div className="rounded-xl border border-border/60 bg-muted/20 p-4 space-y-3">
            <div className="flex items-center justify-between text-xs text-muted-foreground uppercase tracking-wide">
              <span>{t("common.date")}</span>
              <span>{expense.date}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground uppercase tracking-wide">
                {t("common.amount")}
              </span>
              <span className="text-lg font-semibold text-foreground">
                {formatCurrency(expense.amount)}
              </span>
            </div>
          </div>
          <div className="space-y-2">
            <Label className="text-sm text-muted-foreground">
              {t("common.category")}
            </Label>
            <Select
              value={expense.category || "_"}
              onValueChange={(v) =>
                onUpdateCategory(expense.id, v === "_" ? "" : v)
              }
            >
              <SelectTrigger className={selectTriggerClass}>
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
            <Label className="text-sm text-muted-foreground">
              {t("common.owner")}
            </Label>
            <Select
              value={expense.owner || "_none"}
              onValueChange={(v) =>
                onUpdateOwner(expense.id, v === "_none" ? "" : v)
              }
            >
              <SelectTrigger className={selectTriggerClass}>
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
            className={fieldClass}
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
