import { getDebtBalance } from "@/lib/debtUtils";
import { formatCurrency, formatDate } from "@/lib/format";
import { cn } from "@/lib/utils";
import { useTranslation } from "react-i18next";
import type { DebtListMobileProps } from "@/types/debt";

export type { DebtListMobileProps };

export function DebtListMobile({
  debts,
  paymentsByDebt,
  onDebtTap,
}: DebtListMobileProps) {
  const { t } = useTranslation();
  return (
    <div className="space-y-0">
      {debts.map((debt, index) => {
        const payments = paymentsByDebt.get(debt.id) ?? [];
        const balance = getDebtBalance(debt, payments);
        return (
          <div key={debt.id} className="border-t border-border">
            <button
              type="button"
              onClick={() => onDebtTap(debt)}
              className={cn(
                "w-full px-4 py-5 flex items-start gap-2 text-left",
                index % 2 === 1 ? "bg-muted/30" : "bg-background"
              )}
              aria-label={`${debt.name}, ${formatCurrency(balance)}, ${
                debt.owner || t("common.noOwner")
              }`}
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <div className="truncate text-base font-medium text-foreground">
                      {debt.name}
                    </div>
                    <div className="truncate text-xs text-muted-foreground">
                      {debt.owner || t("common.noOwner")}
                      {debt.startDate ? ` · ${formatDate(debt.startDate)}` : ""}
                    </div>
                  </div>
                  <div className="shrink-0 text-right">
                    <div className="text-base font-semibold">
                      {formatCurrency(balance)}
                    </div>
                    <div className="text-xs text-muted-foreground mt-0.5">
                      {payments.length === 1
                        ? t("transactions.transaction_one", { count: 1 })
                        : t("transactions.transaction_other", {
                            count: payments.length,
                      })}
                    </div>
                  </div>
                </div>
              </div>
            </button>
          </div>
        );
      })}
    </div>
  );
}
