import { formatCurrency } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { MortgagePaymentsListProps } from "@/types/mortgage";

export type { MortgagePaymentsListProps };

export function MortgagePaymentsList({
  payments,
  onPaymentTap,
}: MortgagePaymentsListProps) {
  return (
    <div className="divide-y border rounded-md">
      {payments.map((e, index) => (
        <button
          key={e.id}
          type="button"
          className={cn(
            "flex flex-col gap-0.5 w-full text-left px-4 py-3 min-h-[52px] rounded-none",
            "hover:bg-muted/50 active:bg-muted focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
            index % 2 === 1 ? "bg-muted/30" : undefined
          )}
          onClick={() => onPaymentTap(e)}
          aria-label={`${e.date}, ${formatCurrency(e.amount)}`}
        >
          <div className="flex items-baseline justify-between gap-2">
            <span className="text-sm font-medium text-foreground">
              {e.date}
            </span>
            <span className="shrink-0 text-sm font-semibold">
              {formatCurrency(e.amount)}
            </span>
          </div>
          <div className="text-xs text-muted-foreground">
            {e.category ?? "Mortgage"} · {e.owner || "No Owner"}
          </div>
        </button>
      ))}
    </div>
  );
}
