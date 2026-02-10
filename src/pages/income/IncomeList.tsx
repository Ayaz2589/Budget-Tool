import { useState } from "react";
import { formatCurrency, formatDate } from "@/lib/format";
import { getMonthLabel } from "@/lib/totals";
import { cn } from "@/lib/utils";
import { ChevronDown } from "lucide-react";
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
    <div className="space-y-3 px-3 pb-2">
      {byMonth.map(([monthKey, monthIncome]) => {
        const isOpen = openMonth === monthKey;
        const monthTotal = monthIncome.reduce((sum, row) => sum + row.amount, 0);
        return (
          <section
            key={monthKey}
            className="rounded-2xl border border-border bg-card shadow-sm overflow-hidden"
          >
            <button
              type="button"
              onClick={() => setOpenMonth(isOpen ? "" : monthKey)}
              className="w-full px-4 py-3.5 flex items-center justify-between gap-3 text-left hover:bg-muted/30 transition-colors cursor-pointer"
              aria-expanded={isOpen}
            >
              <div className="min-w-0">
                <p className="text-sm font-semibold leading-none">{getMonthLabel(monthKey)}</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  {monthIncome.length === 1
                    ? "1 transaction"
                    : `${monthIncome.length} transactions`}
                </p>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <span className="text-sm font-semibold tabular-nums">
                  {formatCurrency(monthTotal)}
                </span>
                <ChevronDown
                  className={cn(
                    "size-4 text-muted-foreground transition-transform",
                    isOpen ? "rotate-180" : "rotate-0"
                  )}
                />
              </div>
            </button>
            {isOpen && (
              <div className="divide-y divide-border/70 border-t border-border/70">
                {monthIncome.map((i, index) => (
                  <div
                    key={i.id}
                    className={cn(
                      index % 2 === 1 ? "bg-muted/20" : "bg-card"
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
          </section>
        );
      })}
    </div>
  );
}
