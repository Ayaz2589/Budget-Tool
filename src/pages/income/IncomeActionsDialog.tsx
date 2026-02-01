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
import type { DebtOwner, Income } from "@/lib/types";

export type IncomeActionsDialogProps = {
  income: Income | null;
  onClose: () => void;
  onUpdateCategory: (id: string, category: string) => void;
  onUpdateOwner: (id: string, owner: DebtOwner) => void;
  onEdit: (income: Income) => void;
  onDelete: (id: string) => void;
  incomeCategories: string[];
  t: (key: string) => string;
};

export function IncomeActionsDialog({
  income,
  onClose,
  onUpdateCategory,
  onUpdateOwner,
  onEdit,
  onDelete,
  incomeCategories,
  t,
}: IncomeActionsDialogProps) {
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

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
    <Dialog open={income !== null} onOpenChange={(open) => !open && onClose()}>
      <DialogContent
        showCloseButton={true}
        className="fixed bottom-0 left-0 right-0 top-auto z-50 w-full max-w-full max-h-[85vh] translate-x-0 translate-y-0 rounded-t-2xl border-t p-0 gap-0 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:slide-out-to-bottom data-[state=open]:slide-in-from-bottom"
      >
        <DialogHeader className="p-4 pb-2">
          <DialogTitle className="text-left truncate pr-8">
            {income.description || t("income.defaultDescription")}
          </DialogTitle>
        </DialogHeader>
        <div className="overflow-y-auto overscroll-contain px-4 pb-8 flex flex-col gap-4">
          <div className="text-sm text-muted-foreground space-y-1">
            <p>{income.date}</p>
            <p className="font-medium text-foreground">
              {formatCurrency(income.amount)}
            </p>
          </div>
          <div className="space-y-2">
            <Label>{t("common.category")}</Label>
            <Select
              value={income.category || "_"}
              onValueChange={(v) => onUpdateCategory(income.id, v === "_" ? "" : v)}
            >
              <SelectTrigger className="w-full">
                <SelectValue>
                  <CategoryOption
                    name={income.category || t("common.uncategorized")}
                    type="income"
                  />
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="_">
                  <CategoryOption name={t("common.uncategorized")} type="income" />
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
            <Label>{t("common.owner")}</Label>
            <Select
              value={income.owner ?? "Ayaz"}
              onValueChange={(v) => onUpdateOwner(income.id, v as DebtOwner)}
            >
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Ayaz">Ayaz</SelectItem>
                <SelectItem value="Tasnuva">Tasnuva</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex flex-col gap-2">
            <Button variant="outline" className="w-full" onClick={handleEdit}>
              {t("common.edit")}
            </Button>
            <Button
              variant="destructive"
              className="w-full"
              onClick={handleDeleteClick}
            >
              <Trash2 className="size-4" />
              {t("common.delete")}
            </Button>
          </div>
        </div>
      </DialogContent>
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
    </Dialog>
  );
}
