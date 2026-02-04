import { formatCurrency } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { IncomeListProps } from "@/types/income";

export type { IncomeListProps };

export function IncomeList({ sortedIncome, onIncomeTap }: IncomeListProps) {
  return (
    <div className="space-y-0">
      {sortedIncome.map((i, index) => {
        return (
          <div key={i.id} className="border-t border-border">
            <div
              className={cn(
                "px-4 py-3 flex items-start gap-2",
                index % 2 === 1 ? "bg-muted/30" : "bg-background"
              )}
            >
              <button
                type="button"
                className="flex-1 min-w-0 text-left"
                onClick={() => onIncomeTap(i)}
                aria-label={`${i.description || "Income"}, ${formatCurrency(
                  i.amount
                )}, ${i.date}`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="text-base font-medium text-foreground truncate">
                      {i.description || "—"}
                    </div>
                    <div className="text-xs text-muted-foreground mt-0.5">
                      {i.date} · {i.category || "Uncategorized"}
                    </div>
                  </div>
                  <div className="text-base font-semibold shrink-0">
                    {formatCurrency(i.amount)}
                  </div>
                </div>
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
}
