import { getDebtBalance } from "@/lib/domain/debtUtils";
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
    <div className="space-y-3 px-3 pb-2">
      {debts.map((debt) => {
        const payments = paymentsByDebt.get(debt.id) ?? [];
        const balance = getDebtBalance(debt, payments);
        return (
          <section
            key={debt.id}
            className="rounded-2xl border border-border bg-card shadow-sm overflow-hidden"
          >
            <DsDataRow
              dense
              onClick={() => onDebtTap(debt)}
              className={cn("!border-t-0")}
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
          </section>
        );
      })}
    </div>
  );
}
