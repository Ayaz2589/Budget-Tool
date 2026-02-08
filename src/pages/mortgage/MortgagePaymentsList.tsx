import { formatCurrency, formatDate } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { MortgagePaymentsListProps } from "@/types/mortgage";
import { DsDataRow } from "@/components/ds";

export type { MortgagePaymentsListProps };

export function MortgagePaymentsList({
  payments,
  onPaymentTap,
}: MortgagePaymentsListProps) {
  return (
    <div className="space-y-0">
      {payments.map((e, index) => (
        <div key={e.id} className="border-t border-border">
          <DsDataRow
            dense
            className={cn(
              index % 2 === 1 ? "bg-muted/30" : "bg-background"
            )}
            onClick={() => onPaymentTap(e)}
            ariaLabel={`${formatDate(e.date)}, ${formatCurrency(e.amount)}`}
            title={formatDate(e.date)}
            subtitle={`${e.category ?? "Mortgage"} · ${e.owner || "No Owner"}`}
            trailing={
              <span className="shrink-0 text-base font-semibold">
                {formatCurrency(e.amount)}
              </span>
            }
          />
        </div>
      ))}
    </div>
  );
}
