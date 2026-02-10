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
    <div className="space-y-3 px-3 pb-2">
      {payments.map((e, index) => (
        <section
          key={e.id}
          className={cn(
            "rounded-2xl border border-border shadow-sm overflow-hidden",
            index % 2 === 1 ? "bg-muted/20" : "bg-card",
          )}
        >
          <DsDataRow
            dense
            className={cn("!border-t-0")}
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
        </section>
      ))}
    </div>
  );
}
