import { formatCurrency, formatDate } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { MortgagePaymentsListProps } from "@/types/mortgage";

export type { MortgagePaymentsListProps };

export function MortgagePaymentsList({
  payments,
  onPaymentTap,
}: MortgagePaymentsListProps) {
  return (
    <div className="space-y-0">
      {payments.map((e, index) => (
        <div key={e.id} className="border-t border-border">
          <div
            className={cn(
              "px-4 py-5 flex items-start gap-2",
              index % 2 === 1 ? "bg-muted/30" : "bg-background"
            )}
          >
            <button
              type="button"
              className="flex-1 min-w-0 min-h-14 text-left"
              onClick={() => onPaymentTap(e)}
              aria-label={`${formatDate(e.date)}, ${formatCurrency(e.amount)}`}
            >
              <div className="flex items-baseline justify-between gap-2">
                <span className="text-base font-medium text-foreground">
                  {formatDate(e.date)}
                </span>
                <span className="shrink-0 text-base font-semibold">
                  {formatCurrency(e.amount)}
                </span>
              </div>
              <div className="text-xs text-muted-foreground mt-0.5">
                {e.category ?? "Mortgage"} · {e.owner || "No Owner"}
              </div>
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
