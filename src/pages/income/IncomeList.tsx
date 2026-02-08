import { useState } from "react";
import { formatCurrency, formatDate } from "@/lib/format";
import { getMonthLabel } from "@/lib/totals";
import { cn } from "@/lib/utils";
import type { IncomeListProps } from "@/types/income";
import { DsDataRow } from "@/components/ds";

export type { IncomeListProps };

export function IncomeList({
  byMonth,
  defaultOpenMonth,
  onIncomeTap,
}: IncomeListProps) {
  const [openMonth, setOpenMonth] = useState<string>(defaultOpenMonth);

  return (
    <div className="space-y-4">
      {byMonth.map(([monthKey, monthIncome]) => {
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
                {monthIncome.map((i, index) => (
                  <div
                    key={i.id}
                    className={cn(
                      index % 2 === 1 ? "bg-muted/30" : "bg-background"
                    )}
                  >
                    <DsDataRow
                      dense
                      onClick={() => onIncomeTap(i)}
                      ariaLabel={`${i.description || "Income"}, ${formatCurrency(
                        i.amount
                      )}, ${formatDate(i.date)}`}
                      title={i.description || "—"}
                      subtitle={`${formatDate(i.date)} · ${i.category || "Uncategorized"}`}
                      trailing={
                        <div className="text-base font-semibold shrink-0">
                          {formatCurrency(i.amount)}
                        </div>
                      }
                    />
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
