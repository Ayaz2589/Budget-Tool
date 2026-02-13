import { useState } from "react";
import { formatCurrency, formatDate } from "@/lib/format";
import { sumAmountsBy } from "@/lib/math";
import { getMonthLabel } from "@/lib/totals";
import { cn } from "@/lib/utils";
import { ChevronDown } from "lucide-react";
import type { ExpensesByMonthListProps } from "@/types/transactions";
import type { ExpenseSource } from "@/types/core";
import { DsDataRow } from "@/components/ds";

export type { ExpensesByMonthListProps };

export function ExpensesByMonthList({
  byMonth,
  defaultOpenMonth,
  includeOwnerTransfersInTotals = false,
  onRowTap,
  t,
}: ExpensesByMonthListProps) {
  const [openMonth, setOpenMonth] = useState<string>(defaultOpenMonth);

  const getSourceBadge = (source: ExpenseSource) => {
    switch (source) {
      case "amex":
        return "AMEX";
      case "amex-gold":
        return "AMEX";
      case "apple":
        return "MC";
      case "visa":
        return "VISA";
      case "sapphire":
        return "SAPPHIRE";
      case "bank-of-america":
        return "BOA";
      case "wells-fargo":
        return "WF";
      case "chase":
        return "CHASE";
      case "manual":
        return "MANUAL";
      case "td":
        return "TD";
      default:
        return String(source).toUpperCase();
    }
  };

  return (
    <div className="space-y-3 px-3 pb-2">
      {byMonth.map(([monthKey, monthExpenses]) => {
        const isOpen = openMonth === monthKey;
        const monthTotal = sumAmountsBy(monthExpenses, (row) => {
          if (!includeOwnerTransfersInTotals && row.kind === "owner-transfer") {
            return 0;
          }
          return row.amount;
        });
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
                  {monthExpenses.length === 1
                    ? t("transactions.transaction_one", { count: 1 })
                    : t("transactions.transaction_other", { count: monthExpenses.length })}
                </p>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <div className="text-right">
                  <p className="text-[11px] uppercase tracking-wide text-muted-foreground">
                    {includeOwnerTransfersInTotals
                      ? t("transactions.visibleRowsTotal")
                      : t("transactions.visibleExpenseTotal")}
                  </p>
                  <p className="text-sm font-semibold tabular-nums">
                    {formatCurrency(monthTotal)}
                  </p>
                </div>
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
                {monthExpenses.map((row, index) => (
                  <div
                    key={`${row.kind}-${row.id}`}
                    className={cn(
                      index % 2 === 1 ? "bg-muted/20" : "bg-card"
                    )}
                  >
                    <DsDataRow
                      dense
                      onClick={() => onRowTap(row)}
                      ariaLabel={`${row.description}, ${formatCurrency(
                        row.amount
                      )}, ${formatDate(row.date)}`}
                      title={
                        row.kind === "owner-transfer"
                          ? row.description
                          : row.description || "—"
                      }
                      subtitle={
                        row.kind === "owner-transfer"
                          ? `${formatDate(row.date)} · ${row.transferNote || t("transactions.typeTransfer")}`
                          : `${formatDate(row.date)} · ${row.category || t("common.uncategorized")}`
                      }
                      trailing={
                        <div className="flex items-center gap-2 shrink-0">
                          <span className="inline-flex items-center justify-center rounded-md bg-[var(--surface-2)] text-[10px] px-2 py-0.5 text-muted-foreground">
                            {getSourceBadge(row.source)}
                          </span>
                          <div className="text-base font-semibold">
                            {formatCurrency(row.amount)}
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
