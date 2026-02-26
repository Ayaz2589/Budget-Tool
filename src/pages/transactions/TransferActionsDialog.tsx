import { Button } from "@/components/ui/button";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { Label } from "@/components/ui/label";
import { formatCurrency, formatDate } from "@/lib/format";
import type { TransferActionsDialogProps } from "@/types/transactions";
import { Pencil, Trash2 } from "lucide-react";
import { DsSheetActions, DsSheetHeader } from "@/components/ds";

export function TransferActionsDialog({
  transfer,
  onClose,
  onEdit,
  onDelete,
  t,
}: TransferActionsDialogProps) {
  if (transfer === null) return null;

  return (
    <Sheet open={transfer !== null} onOpenChange={(open) => !open && onClose()}>
      <SheetContent
        side="right"
        desktopVariant="modal"
        showCloseButton={true}
        className="flex flex-col p-0 gap-0 overflow-hidden"
      >
        <DsSheetHeader title={t("transactions.typeTransfer")} />
        <div className="flex-1 overflow-y-auto overscroll-contain px-4 pt-4 pb-6">
          <div className="grid gap-5">
            <div className="rounded-xl border border-border/60 bg-muted/20 p-4 space-y-3">
              <div className="flex items-center justify-between text-xs text-muted-foreground uppercase tracking-wide">
                <span>{t("common.date")}</span>
                <span>{formatDate(transfer.date)}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground uppercase tracking-wide">
                  {t("common.amount")}
                </span>
                <span className="text-lg font-semibold text-foreground">
                  {formatCurrency(transfer.amount)}
                </span>
              </div>
            </div>
            <div className="space-y-2">
              <Label className="text-sm text-muted-foreground">{t("transactions.transferFrom")}</Label>
              <p className="text-sm font-medium text-foreground">{transfer.fromOwner}</p>
            </div>
            <div className="space-y-2">
              <Label className="text-sm text-muted-foreground">{t("transactions.transferTo")}</Label>
              <p className="text-sm font-medium text-foreground">{transfer.toOwner}</p>
            </div>
            {transfer.note ? (
              <div className="space-y-2">
                <Label className="text-sm text-muted-foreground">{t("transactions.transferNote")}</Label>
                <p className="text-sm font-medium text-foreground">{transfer.note}</p>
              </div>
            ) : null}
          </div>
        </div>
        <DsSheetActions>
          <div className="grid grid-cols-2 gap-2">
            <Button
              variant="outline"
              density="compact"
              className="w-full"
              onClick={() => onEdit(transfer)}
            >
              <Pencil className="size-4" />
              {t("common.edit")}
            </Button>
            <Button
              variant="destructive"
              density="compact"
              className="w-full"
              onClick={() => onDelete(transfer)}
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
