import { formatCurrency } from "@/lib/format";
import type { Income } from "@/lib/types";
import { cn } from "@/lib/utils";

function formatRecurring(i: Income): string {
  if (i.recurringAmount == null || i.recurringAmount <= 0) return "";
  if (i.recurringFrequency === "biweekly" && i.recurringStartDate) {
    return `Biweekly from ${i.recurringStartDate}`;
  }
  if (
    i.recurringFrequency === "monthly" &&
    i.recurringDayOfMonth != null &&
    i.recurringDayOfMonth >= 1 &&
    i.recurringDayOfMonth <= 31
  ) {
    return `Monthly on ${i.recurringDayOfMonth}`;
  }
  return "";
}

export type IncomeListProps = {
  sortedIncome: Income[];
  onIncomeTap: (income: Income) => void;
};

export function IncomeList({ sortedIncome, onIncomeTap }: IncomeListProps) {
  return (
    <div className="divide-y border-t">
      {sortedIncome.map((i, index) => {
        const recurring = formatRecurring(i);
        return (
          <button
            key={i.id}
            type="button"
            className={cn(
              "flex flex-col gap-0.5 w-full text-left px-4 py-3 min-h-[52px] rounded-none",
              "hover:bg-muted/50 active:bg-muted focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
              index % 2 === 1 ? "bg-muted/30" : undefined,
            )}
            onClick={() => onIncomeTap(i)}
            aria-label={`${i.description || "Income"}, ${formatCurrency(i.amount)}, ${i.date}`}
          >
            <div className="flex items-baseline justify-between gap-2">
              <span className="truncate text-sm font-medium text-foreground">
                {i.description || "—"}
              </span>
              <span className="shrink-0 text-sm font-medium">
                {formatCurrency(i.amount)}
              </span>
            </div>
            <div className="flex items-center gap-2 mt-0.5 text-xs text-muted-foreground flex-wrap">
              <span>{i.date}</span>
              <span>·</span>
              <span>{i.category || "Uncategorized"}</span>
              <span>·</span>
              <span>{i.owner ?? "Ayaz"}</span>
              {recurring && (
                <>
                  <span>·</span>
                  <span className="truncate">{recurring}</span>
                </>
              )}
            </div>
          </button>
        );
      })}
    </div>
  );
}
