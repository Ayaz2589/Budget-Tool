import { Button } from "@/components/ui/button";
import { Plus, SlidersHorizontal, RefreshCw } from "lucide-react";

export type TransactionsToolbarProps = {
  onOpenFilters: () => void;
  onAddTransaction: () => void;
  hasActiveFilters: boolean;
  showSync: boolean;
  syncStatus: "idle" | "syncing" | "success" | "error";
  onSync: () => void;
  t: (key: string) => string;
};

export function TransactionsToolbar({
  onOpenFilters,
  onAddTransaction,
  hasActiveFilters,
  showSync,
  syncStatus,
  onSync,
  t,
}: TransactionsToolbarProps) {
  return (
    <div className="flex items-center justify-between gap-2 shrink-0">
      <div className="flex items-center gap-2">
        <Button variant="outline" onClick={onOpenFilters} className="gap-2">
          <SlidersHorizontal className="size-4" />
          {t("common.filtersAndActions")}
          {hasActiveFilters && (
            <span className="ml-1 rounded-full bg-primary/10 px-1.5 py-0.5 text-xs font-medium">
              {t("common.active")}
            </span>
          )}
        </Button>
        <Button size="sm" onClick={onAddTransaction} className="gap-1.5">
          <Plus className="size-4" />
          {t("common.add")}
        </Button>
      </div>
      {showSync && (
        <Button
          size="sm"
          variant="outline"
          onClick={onSync}
          disabled={syncStatus === "syncing"}
          className="gap-1.5"
        >
          <RefreshCw
            className={`size-4 ${syncStatus === "syncing" ? "animate-spin" : ""}`}
          />
          {syncStatus === "syncing"
            ? t("transactions.syncing")
            : t("transactions.syncToSheets")}
        </Button>
      )}
    </div>
  );
}
