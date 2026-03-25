import { useState } from "react";
import { formatCurrency, formatDate } from "@/lib/format";
import { sumAmountsBy } from "@/lib/math";
import { getMonthLabel } from "@/lib/domain/totals";
import { cn } from "@/lib/utils";
import { ChevronDown, Copy } from "lucide-react";
import type { IncomeListProps } from "@/types/income";
import { DsDataRow } from "@/components/ds";

export type { IncomeListProps };

export function IncomeList({
  byMonth,
  defaultOpenMonth,
  onIncomeTap,
  onCopy,
}: IncomeListProps) {
  const [openMonth, setOpenMonth] = useState<string>(defaultOpenMonth);

  return (
    <div className="space-y-3 px-3 pb-2">
      {byMonth.map(([monthKey, monthIncome]) => {
        const isOpen = openMonth === monthKey;
        const monthTotal = sumAmountsBy(monthIncome, (row) => row.amount);
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
                        <div className="flex items-center gap-2 shrink-0">
                          {onCopy && (
                            <span
                              role="button"
                              tabIndex={0}
                              aria-label="Copy"
                              className="inline-flex items-center justify-center size-7 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors cursor-pointer"
                              onClick={(e) => {
                                e.stopPropagation();
                                onCopy(i);
                              }}
                              onKeyDown={(e) => {
                                if (e.key === "Enter" || e.key === " ") {
                                  e.preventDefault();
                                  e.stopPropagation();
                                  onCopy(i);
                                }
                              }}
                            >
                              <Copy className="size-3.5" />
                            </span>
                          )}
                          <div className="text-base font-semibold">
                            {formatCurrency(i.amount)}
                          </div>
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
