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
import { Trash2 } from "lucide-react";
import { CategoryOption } from "@/lib/format/categoryColors";
import { formatCurrency, formatDate } from "@/lib/format";
import type { IncomeActionsDialogProps } from "@/types/income";
import { DsSheetActions, DsSheetHeader } from "@/components/ds";

export type { IncomeActionsDialogProps };

export function IncomeActionsDialog({
  income,
  onClose,
  onUpdateCategory,
  onUpdateOwner,
  onEdit,
  onDelete,
  incomeCategories,
  ownerOptions = [],
  t,
}: IncomeActionsDialogProps) {
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const selectTriggerClass = "h-11 w-full data-[size=default]:h-11";

  if (income === null) return null;

  const handleEdit = () => {
    onEdit(income);
    onClose();
  };

  const handleDeleteClick = () => {
    setShowDeleteConfirm(true);
  };

  const handleDeleteConfirm = () => {
    onDelete(income.id);
    setShowDeleteConfirm(false);
    onClose();
  };

  return (
    <>
      <Sheet open={income !== null} onOpenChange={(open) => !open && onClose()}>
        <SheetContent
          side="right"
          desktopVariant="modal"
          showCloseButton={true}
          className="flex flex-col p-0 gap-0 overflow-hidden"
        >
          <DsSheetHeader title={income.description || t("income.defaultDescription")} />
          <div className="flex-1 overflow-y-auto overscroll-contain px-4 pt-4 pb-6">
            <div className="grid gap-5">
              <div className="rounded-xl border border-border/60 bg-muted/20 p-4 space-y-3">
                <div className="flex items-center justify-between text-xs text-muted-foreground uppercase tracking-wide">
                  <span>{t("common.date")}</span>
                  <span>{formatDate(income.date)}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-muted-foreground uppercase tracking-wide">
                    {t("common.amount")}
                  </span>
                  <span className="text-lg font-semibold text-foreground">
                    {formatCurrency(income.amount)}
                  </span>
                </div>
              </div>
              <div className="space-y-2">
                <Label className="text-sm text-muted-foreground">
                  {t("common.category")}
                </Label>
                <Select
                  value={income.category || "_"}
                  onValueChange={(v) =>
                    onUpdateCategory(income.id, v === "_" ? "" : v)
                  }
                >
                  <SelectTrigger className={selectTriggerClass}>
                    <SelectValue>
                      <CategoryOption
                        name={income.category || t("common.uncategorized")}
                        type="income"
                      />
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="_">
                      <CategoryOption
                        name={t("common.uncategorized")}
                        type="income"
                      />
                    </SelectItem>
                    {incomeCategories.map((c) => (
                      <SelectItem key={c} value={c}>
                        <CategoryOption name={c} type="income" />
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
                  value={income.owner || "_none"}
                  onValueChange={(v) =>
                    onUpdateOwner(income.id, v === "_none" ? "" : v)
                  }
                >
                  <SelectTrigger className={selectTriggerClass}>
                    <SelectValue />
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
          <DsSheetActions className="flex justify-end gap-3">
            <Button
              variant="ghost"
              onClick={handleEdit}
            >
              {t("common.edit")}
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeleteClick}
            >
              <Trash2 className="size-4" />
              {t("common.delete")}
            </Button>
          </DsSheetActions>
        </SheetContent>
      </Sheet>

      <Dialog
        open={showDeleteConfirm}
        onOpenChange={(open) => !open && setShowDeleteConfirm(false)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("income.deleteIncomeTitle")}</DialogTitle>
            <DialogDescription>
              {t("income.deleteIncomeDesc")}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setShowDeleteConfirm(false)}
            >
              {t("common.cancel")}
            </Button>
            <Button
              type="button"
              variant="destructive"
              onClick={handleDeleteConfirm}
            >
              <Trash2 className="size-4" />
              {t("common.delete")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
