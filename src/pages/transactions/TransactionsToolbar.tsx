import { Button } from "@/components/ui/button";
import { Plus, SlidersHorizontal, RefreshCw } from "lucide-react";
import type { TransactionsToolbarProps } from "@/types/transactions";

export type { TransactionsToolbarProps };

export function TransactionsToolbar({
  onOpenFilters,
  onAddTransaction,
  hasActiveFilters,
  showSync,
  syncStatus,
  onSync,
  t,
}: TransactionsToolbarProps) {
  const filtersLabel = hasActiveFilters
    ? `${t("common.filtersAndActions")} (${t("common.active")})`
    : t("common.filtersAndActions");
  const syncLabel =
    syncStatus === "syncing"
      ? t("transactions.syncing")
      : t("transactions.syncToSheets");

  return (
    <div className="flex items-center justify-between md:justify-end gap-2 shrink-0">
      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          onClick={onOpenFilters}
          className="gap-2 h-11"
          aria-label={filtersLabel}
        >
          <SlidersHorizontal className="size-4" />
          <span>{t("common.filtersAndActions")}</span>
          {hasActiveFilters && (
            <span className="ml-1 rounded-full bg-primary/10 px-1.5 py-0.5 text-xs font-medium sm:ml-0">
              {t("common.active")}
            </span>
          )}
        </Button>
        <Button
          onClick={onAddTransaction}
          className="gap-1.5 h-11"
          aria-label="Add Expense"
        >
          <Plus className="size-4" />
          <span>Add Expense</span>
        </Button>
      </div>
      {showSync && (
        <Button
          variant="outline"
          onClick={onSync}
          disabled={syncStatus === "syncing"}
          className="gap-1.5 h-11"
          aria-label={syncLabel}
        >
          <RefreshCw
            className={`size-4 ${
              syncStatus === "syncing" ? "animate-spin" : ""
            }`}
          />
          <span>{syncLabel}</span>
        </Button>
      )}
    </div>
  );
}
