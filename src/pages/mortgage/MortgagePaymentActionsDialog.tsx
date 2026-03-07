import {
  Sheet,
  SheetContent,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Trash2 } from "lucide-react";
import { CategoryOption } from "@/lib/format/categoryColors";
import { formatCurrency, formatDate } from "@/lib/format";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { MortgagePaymentActionsDialogProps } from "@/types/mortgage";
import { DsSheetActions, DsSheetHeader } from "@/components/ds";

export type { MortgagePaymentActionsDialogProps };

export function MortgagePaymentActionsDialog({
  payment,
  onClose,
  onRemove,
  onUpdateOwner,
  ownerOptions = [],
  t,
}: MortgagePaymentActionsDialogProps) {
  if (payment === null) return null;
  const selectTriggerClass = "h-11 w-full data-[size=default]:h-11";

  const handleRemove = () => {
    onRemove(payment);
    onClose();
  };

  return (
    <Sheet open={payment !== null} onOpenChange={(open) => !open && onClose()}>
      <SheetContent
        side="right"
        desktopVariant="modal"
        showCloseButton={true}
        className="flex flex-col p-0 gap-0 overflow-hidden"
      >
        <DsSheetHeader title={`${formatDate(payment.date)} · ${formatCurrency(payment.amount)}`} />
        <div className="flex-1 overflow-y-auto overscroll-contain px-4 pt-4 pb-6">
          <div className="grid gap-5">
            <div className="rounded-xl border border-border/60 bg-muted/20 p-4 space-y-3">
              <div className="flex items-center justify-between text-xs text-muted-foreground uppercase tracking-wide">
                <span>{t("common.category")}</span>
                <span>
                  <CategoryOption
                    name={payment.category ?? "Mortgage"}
                    type="expense"
                  />
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground uppercase tracking-wide">
                  {t("common.amount")}
                </span>
                <span className="text-lg font-semibold text-foreground">
                  {formatCurrency(payment.amount)}
                </span>
              </div>
            </div>
            <div className="space-y-2">
              <Label className="text-sm text-muted-foreground">
                {t("common.owner")}
              </Label>
              <Select
                value={payment.owner || "_none"}
                onValueChange={(v) =>
                  onUpdateOwner(payment.id, v === "_none" ? "" : v)
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
        <DsSheetActions className="flex justify-end gap-3">
          <Button
            variant="destructive"
            onClick={handleRemove}
          >
            <Trash2 className="size-4" />
            {t("common.remove")}
          </Button>
        </DsSheetActions>
      </SheetContent>
    </Sheet>
  );
}
