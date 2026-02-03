import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Trash2 } from "lucide-react";
import { CategoryOption } from "@/lib/categoryColors";
import { formatCurrency } from "@/lib/format";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { MortgagePaymentActionsDialogProps } from "@/types/mortgage";

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

  const handleRemove = () => {
    onRemove(payment);
    onClose();
  };

  return (
    <Dialog open={payment !== null} onOpenChange={(open) => !open && onClose()}>
      <DialogContent
        showCloseButton={true}
        className="fixed bottom-0 left-0 right-0 top-auto z-50 w-full max-w-full max-h-[85vh] translate-x-0 translate-y-0 rounded-t-2xl border-t p-0 gap-0 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:slide-out-to-bottom data-[state=open]:slide-in-from-bottom"
      >
        <DialogHeader className="p-4 pb-2">
          <DialogTitle className="text-left truncate pr-8">
            {payment.date} · {formatCurrency(payment.amount)}
          </DialogTitle>
        </DialogHeader>
        <div className="overflow-y-auto overscroll-contain px-4 pb-8 flex flex-col gap-4">
          <div className="text-sm text-muted-foreground space-y-1">
            <p className="font-medium text-foreground">
              <CategoryOption
                name={payment.category ?? "Mortgage"}
                type="expense"
              />
            </p>
          </div>
          <div className="space-y-2">
            <Label>{t("common.owner")}</Label>
            <Select
              value={payment.owner || "_none"}
              onValueChange={(v) =>
                onUpdateOwner(payment.id, v === "_none" ? "" : v)
              }
            >
              <SelectTrigger className="w-full">
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
            className="w-full"
            onClick={handleRemove}
          >
            <Trash2 className="size-4" />
            {t("common.remove")}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
