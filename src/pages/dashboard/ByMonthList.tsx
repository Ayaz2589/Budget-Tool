import { formatCurrency, formatPercent } from "@/lib/format";
import type { MonthTotals } from "@/lib/totals";
import { cn } from "@/lib/utils";

export type ByMonthListProps = {
  months: MonthTotals[];
  currentMonthKey: string;
  t: (key: string) => string;
};

export function ByMonthList({ months, currentMonthKey, t }: ByMonthListProps) {
  return (
    <div className="divide-y border rounded-md overflow-hidden">
      {months.map((m, index) => {
        const isCurrent = m.monthKey === currentMonthKey;
        return (
          <div
            key={m.monthKey}
            className={cn(
              "px-4 py-3 min-h-[52px] space-y-1",
              isCurrent && "bg-primary/10 font-medium",
              index % 2 === 1 && !isCurrent && "bg-muted/30",
            )}
          >
            <div className="flex items-baseline justify-between gap-2">
              <span className="text-sm font-medium">{m.monthLabel}</span>
              <span className="text-sm font-semibold tabular-nums">
                {formatCurrency(m.totalSaved)}
              </span>
            </div>
            <div className="flex flex-wrap gap-x-4 gap-y-0.5 text-xs text-muted-foreground tabular-nums">
              <span>
                {t("common.totalEarned")}: {formatCurrency(m.totalEarned)}
              </span>
              <span>
                {t("common.totalSpent")}: {formatCurrency(m.totalSpent)}
              </span>
              <span>
                {t("common.spentWoMortgage")}:{" "}
                {formatCurrency(m.totalSpentWithoutMortgage)}
              </span>
              <span>
                {t("common.savingsRate")}:{" "}
                {formatPercent(m.personalSavingsRate)}
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
}
