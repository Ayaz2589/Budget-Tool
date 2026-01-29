import { getDebtBalance } from "@/lib/debtUtils";
import { formatCurrency } from "@/lib/format";
import type { Debt, DebtPayment } from "@/lib/types";
import { cn } from "@/lib/utils";

export type DebtListMobileProps = {
  debts: Debt[];
  paymentsByDebt: Map<string, DebtPayment[]>;
  onDebtTap: (debt: Debt) => void;
};

export function DebtListMobile({
  debts,
  paymentsByDebt,
  onDebtTap,
}: DebtListMobileProps) {
  return (
    <div className="divide-y border-t">
      {debts.map((debt, index) => {
        const payments = paymentsByDebt.get(debt.id) ?? [];
        const balance = getDebtBalance(debt, payments);
        return (
          <button
            key={debt.id}
            type="button"
            className={cn(
              "flex flex-col gap-0.5 w-full text-left px-4 py-3 min-h-[52px] rounded-none",
              "hover:bg-muted/50 active:bg-muted focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
              index % 2 === 1 ? "bg-muted/30" : undefined,
            )}
            onClick={() => onDebtTap(debt)}
            aria-label={`${debt.name}, balance ${formatCurrency(balance)}`}
          >
            <div className="flex items-baseline justify-between gap-2">
              <span className="truncate text-sm font-medium text-foreground">
                {debt.name}
              </span>
              <span className="shrink-0 text-sm font-semibold">
                {formatCurrency(balance)}
              </span>
            </div>
            <div className="flex items-center gap-2 mt-0.5 text-xs text-muted-foreground">
              <span>
                {debt.owner === "Tasnuva" ? "Tasnuva" : "Ayaz"}
                {debt.startDate ? ` · ${debt.startDate}` : ""}
              </span>
            </div>
          </button>
        );
      })}
    </div>
  );
}
