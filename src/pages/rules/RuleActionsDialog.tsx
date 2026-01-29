import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { CategoryOption } from "@/lib/categoryColors";
import type { CategoryRule } from "@/lib/categoryRules";

export type RuleActionsDialogProps = {
  rule: CategoryRule | null;
  onClose: () => void;
  onRemove: (ruleId: string) => void;
  t: (key: string) => string;
};

export function RuleActionsDialog({
  rule,
  onClose,
  onRemove,
  t,
}: RuleActionsDialogProps) {
  if (rule === null) return null;

  const handleRemove = () => {
    onRemove(rule.id);
    onClose();
  };

  return (
    <Dialog open={rule !== null} onOpenChange={(open) => !open && onClose()}>
      <DialogContent
        showCloseButton={true}
        className="fixed bottom-0 left-0 right-0 top-auto z-50 w-full max-w-full max-h-[85vh] translate-x-0 translate-y-0 rounded-t-2xl border-t p-0 gap-0 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:slide-out-to-bottom data-[state=open]:slide-in-from-bottom"
      >
        <DialogHeader className="p-4 pb-2">
          <DialogTitle className="text-left font-mono text-sm truncate pr-8">
            {rule.pattern}
          </DialogTitle>
        </DialogHeader>
        <div className="overflow-y-auto overscroll-contain px-4 pb-8 flex flex-col gap-4">
          <div className="text-sm text-muted-foreground space-y-1">
            <p className="font-medium text-foreground">
              <CategoryOption name={rule.category} type="expense" />
            </p>
          </div>
          <Button
            variant="destructive"
            className="w-full"
            onClick={handleRemove}
          >
            {t("common.remove")}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
