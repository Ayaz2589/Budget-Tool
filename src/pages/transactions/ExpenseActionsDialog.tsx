import {
  Sheet,
  SheetContent,
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
import { Pencil, Trash2 } from "lucide-react";
import { CategoryOption } from "@/lib/categoryColors";
import { formatCurrency, formatDate } from "@/lib/format";
import type { ExpenseActionsDialogProps } from "@/types/transactions";
import { DsSheetActions, DsSheetHeader } from "@/components/ds";

export type { ExpenseActionsDialogProps };

export function ExpenseActionsDialog({
  expense,
  onClose,
  onEdit,
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

  const actionButtonClass = "h-11 w-full";
  const selectTriggerClass = "h-11 w-full data-[size=default]:h-11";
  const sheetSide = "right";

  return (
    <Sheet open={expense !== null} onOpenChange={(open) => !open && onClose()}>
      <SheetContent
        side={sheetSide}
        showCloseButton={true}
        className="h-full w-[85vw] max-w-sm border-l p-0 gap-0 rounded-l-2xl overflow-hidden flex flex-col"
      >
        <DsSheetHeader title={expense.description || t("addTransaction.transaction")} />
        <div className="flex-1 overflow-y-auto overscroll-contain px-4 pb-6">
          <div className="grid gap-5">
            <div className="rounded-xl border border-border/60 bg-muted/20 p-4 space-y-3">
              <div className="flex items-center justify-between text-xs text-muted-foreground uppercase tracking-wide">
                <span>{t("common.date")}</span>
                <span>{formatDate(expense.date)}</span>
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
          </div>
        </div>
        <DsSheetActions>
          <div className="grid grid-cols-2 gap-2">
            <Button
              variant="outline"
              density="compact"
              className={actionButtonClass}
              onClick={() => onEdit(expense)}
            >
              <Pencil className="size-4" />
              {t("common.edit")}
            </Button>
            <Button
              variant="destructive"
              density="compact"
              className={actionButtonClass}
              onClick={handleDelete}
            >
              <Trash2 className="size-4" />
              {t("common.delete")}
            </Button>
          </div>
        </DsSheetActions>
      </SheetContent>
    </Sheet>
  );
}
