import { useState } from "react";
import { formatCurrency } from "@/lib/format";
import { getMonthLabel } from "@/lib/totals";
import { cn } from "@/lib/utils";
import type { ExpensesByMonthListProps } from "@/types/transactions";
import type { ExpenseSource } from "@/types/core";

export type { ExpensesByMonthListProps };

export function ExpensesByMonthList({
  byMonth,
  defaultOpenMonth,
  onExpenseTap,
}: ExpensesByMonthListProps) {
  const [openMonth, setOpenMonth] = useState<string>(defaultOpenMonth);

  const getSourceBadge = (source: ExpenseSource) => {
    switch (source) {
      case "amex":
        return "AMEX";
      case "amex-gold":
        return "AMEX";
      case "apple":
        return "APPLE";
      case "manual":
        return "MANUAL";
      case "td":
        return "TD";
      case "chase":
        return "CHASE";
      default:
        return String(source).toUpperCase();
    }
  };

  return (
    <div className="space-y-4">
      {byMonth.map(([monthKey, monthExpenses]) => {
        const isOpen = openMonth === monthKey;
        return (
          <div key={monthKey} className="border-t border-border">
            <button
              type="button"
              onClick={() => setOpenMonth(isOpen ? "" : monthKey)}
              className="sticky top-0 z-10 w-full px-4 py-3 flex items-center justify-between text-left text-sm font-medium bg-background/90 backdrop-blur border-b border-border/60"
              aria-expanded={isOpen}
            >
              <span>{getMonthLabel(monthKey)}</span>
              <span
                className={cn(
                  "transition-transform text-muted-foreground",
                  isOpen ? "rotate-180" : "rotate-0"
                )}
              >
                ▼
              </span>
            </button>
            {isOpen && (
              <div className="divide-y">
                {monthExpenses.map((e, index) => (
                  <div
                    key={e.id}
                    className={cn(
                      "px-4 py-3 flex items-start gap-2",
                      index % 2 === 1 ? "bg-muted/30" : "bg-background"
                    )}
                  >
                    <button
                      type="button"
                      className="flex-1 min-w-0 text-left"
                      onClick={() => onExpenseTap(e)}
                      aria-label={`${e.description}, ${formatCurrency(
                        e.amount
                      )}, ${e.date}`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <div className="text-base font-medium text-foreground truncate">
                            {e.description || "—"}
                          </div>
                          <div className="text-xs text-muted-foreground mt-0.5">
                            {e.date} · {e.category || "Uncategorized"}
                          </div>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <span className="inline-flex items-center justify-center rounded-md bg-muted text-[10px] px-2 py-0.5 text-muted-foreground">
                            {getSourceBadge(e.source)}
                          </span>
                          <div className="text-base font-semibold">
                            {formatCurrency(e.amount)}
                          </div>
                        </div>
                      </div>
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
