import { useState } from "react";
import { formatCurrency, formatDate } from "@/lib/format";
import { getMonthLabel } from "@/lib/totals";
import { cn } from "@/lib/utils";
import type { ExpensesByMonthListProps } from "@/types/transactions";
import type { ExpenseSource } from "@/types/core";
import { DsDataRow } from "@/components/ds";

export type { ExpensesByMonthListProps };

export function ExpensesByMonthList({
  byMonth,
  defaultOpenMonth,
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
                {monthExpenses.map((row, index) => (
                  <div
                    key={`${row.kind}-${row.id}`}
                    className={cn(
                      index % 2 === 1 ? "bg-muted/30" : "bg-background"
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
                          <span className="inline-flex items-center justify-center rounded-md bg-muted text-[10px] px-2 py-0.5 text-muted-foreground">
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
          </div>
        );
      })}
    </div>
  );
}
