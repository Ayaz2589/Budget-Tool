import { getDebtBalance } from "@/lib/debtUtils";
import { formatCurrency, formatDate } from "@/lib/format";
import { cn } from "@/lib/utils";
import { useTranslation } from "react-i18next";
import type { DebtListMobileProps } from "@/types/debt";
import { DsDataRow } from "@/components/ds";

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
            <DsDataRow
              dense
              onClick={() => onDebtTap(debt)}
              className={cn(
                index % 2 === 1 ? "bg-muted/30" : "bg-background"
              )}
              ariaLabel={`${debt.name}, ${formatCurrency(balance)}, ${
                debt.owner || t("common.noOwner")
              }`}
              title={debt.name}
              subtitle={`${debt.owner || t("common.noOwner")}${debt.startDate ? ` · ${formatDate(debt.startDate)}` : ""}`}
              trailing={
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
              }
            />
          </div>
        );
      })}
    </div>
  );
}
