import { getDebtBalance } from "@/lib/debtUtils";
import { formatCurrency } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { DebtListMobileProps } from "@/types/debt";

export type { DebtListMobileProps };

export function DebtListMobile({
  debts,
  paymentsByDebt,
  onDebtTap,
}: DebtListMobileProps) {
  return (
    <div className="space-y-0">
      {debts.map((debt, index) => {
        const payments = paymentsByDebt.get(debt.id) ?? [];
        const balance = getDebtBalance(debt, payments);
        return (
          <div key={debt.id} className="border-t border-border">
            <div
              className={cn(
                "px-4 py-3 flex items-start gap-2",
                index % 2 === 1 ? "bg-muted/30" : "bg-background"
              )}
            >
              <button
                type="button"
                className="flex-1 min-w-0 text-left"
                onClick={() => onDebtTap(debt)}
                aria-label={`${debt.name}, balance ${formatCurrency(balance)}`}
              >
                <div className="flex items-baseline justify-between gap-2">
                  <span className="truncate text-base font-medium text-foreground">
                    {debt.name}
                  </span>
                  <span className="shrink-0 text-base font-semibold">
                    {formatCurrency(balance)}
                  </span>
                </div>
                <div className="flex items-center gap-2 mt-0.5 text-xs text-muted-foreground">
                  <span>
                    {debt.owner || "No Owner"}
                    {debt.startDate ? ` · ${debt.startDate}` : ""}
                  </span>
                </div>
              </button>
            </div>
            <div className="px-4 pb-3">
              <div className="text-xs text-muted-foreground mb-2">
                Payment history
              </div>
              {payments.length === 0 ? (
                <div className="text-xs text-muted-foreground">
                  No payments yet.
                </div>
              ) : (
                <div className="space-y-2">
                  {payments.map((p) => (
                    <div
                      key={p.id}
                      className="flex items-center justify-between text-xs"
                    >
                      <div className="text-muted-foreground">
                        {p.date}
                        {p.note ? ` · ${p.note}` : ""}
                      </div>
                      <div className="font-medium">
                        {formatCurrency(p.amount)}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
