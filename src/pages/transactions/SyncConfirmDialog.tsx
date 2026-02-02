import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import type { SyncConfirmDialogProps } from "@/types/transactions";

export type { SyncConfirmDialogProps };

export function SyncConfirmDialog({
  open,
  onOpenChange,
  onConfirm,
  t,
}: SyncConfirmDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t("transactions.syncConfirmTitle")}</DialogTitle>
          <DialogDescription>
            {t("transactions.syncConfirmDesc")}
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            {t("common.cancel")}
          </Button>
          <Button
            onClick={() => {
              onOpenChange(false);
              onConfirm();
            }}
          >
            {t("transactions.syncToGoogleSheets")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
