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
import { CategoryOption } from "@/lib/format/categoryColors";
import { formatCurrency, formatDate } from "@/lib/format";
import type { ExpenseActionsDialogProps } from "@/types/transactions";
import { EXPENSE_SOURCE_BADGE_LABELS } from "@/lib/format/sourceLabels";
import type { ExpenseSource } from "@/types";
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
  const splitModeLabel =
    expense.allocationMode === "equal"
      ? t("addTransaction.splitEqual")
      : expense.allocationMode === "custom"
        ? t("addTransaction.splitCustom")
        : t("addTransaction.splitSingle");

  const selectTriggerClass = "h-10 w-full data-[size=default]:h-10";
  const sourceBadge = EXPENSE_SOURCE_BADGE_LABELS[expense.source as ExpenseSource];
  const hasOwners = ownerOptions.length > 0;

  return (
    <Sheet open={expense !== null} onOpenChange={(open) => !open && onClose()}>
      <SheetContent
        side="right"
        desktopVariant="modal"
        showCloseButton={true}
        className="flex flex-col p-0 gap-0 overflow-hidden"
      >
        <DsSheetHeader title={expense.description || t("addTransaction.transaction")} />
        <div className="flex-1 overflow-y-auto overscroll-contain px-5 pt-5 pb-6 space-y-5">
          {/* Hero: amount + date + source */}
          <div className="rounded-xl border border-border/60 bg-[var(--surface-0)] p-5">
            <div className="flex items-baseline justify-between gap-3">
              <span className="text-2xl font-bold tracking-tight text-foreground">
                {formatCurrency(expense.amount)}
              </span>
              <span className="text-sm text-muted-foreground tabular-nums">
                {formatDate(expense.date)}
              </span>
            </div>
            {sourceBadge && (
              <span className="mt-2.5 inline-flex items-center rounded-md bg-muted px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
                {sourceBadge}
              </span>
            )}
          </div>

          {/* Ownership section — only shown when owners exist */}
          {hasOwners && (
            <section className="space-y-3">
              <SectionDivider label="Ownership" />
              <div className="space-y-2.5">
                <InfoRow
                  label={t("addTransaction.paidBy")}
                  value={expense.paidByOwner || expense.owner || t("common.noOwner")}
                />
                <InfoRow
                  label={t("addTransaction.splitMode")}
                  value={splitModeLabel}
                />
                {expense.allocationMode !== "single" && expense.allocation && expense.allocation.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 pt-0.5">
                    {expense.allocation.map((a) => (
                      <span
                        key={a.owner}
                        className="inline-flex items-center rounded-full bg-muted/60 border border-border/40 px-2.5 py-0.5 text-xs text-foreground"
                      >
                        {a.owner}
                        {a.percent != null && (
                          <span className="ml-1 text-muted-foreground">{a.percent}%</span>
                        )}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </section>
          )}

          {/* Details section — editable fields */}
          <section className="space-y-3">
            <SectionDivider label="Details" />
            <div className="space-y-3">
              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">
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
              {hasOwners && (
                <div className="space-y-1.5">
                  <Label className="text-xs text-muted-foreground">
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
              )}
            </div>
          </section>
        </div>
        <DsSheetActions className="flex justify-end gap-3">
          <Button
            variant="ghost"
            onClick={() => onEdit(expense)}
          >
            <Pencil className="size-4" />
            {t("common.edit")}
          </Button>
          <Button
            variant="destructive"
            onClick={handleDelete}
          >
            <Trash2 className="size-4" />
            {t("common.delete")}
          </Button>
        </DsSheetActions>
      </SheetContent>
    </Sheet>
  );
}

function SectionDivider({ label }: { label: string }) {
  return (
    <div className="flex items-center gap-3 pt-1">
      <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/70 shrink-0">
        {label}
      </span>
      <div className="h-px flex-1 bg-[var(--border-subtle)]" />
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-xs text-muted-foreground">{label}</span>
      <span className="text-sm font-medium text-foreground">{value}</span>
    </div>
  );
}
