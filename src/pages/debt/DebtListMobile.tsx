import { Button } from "@/components/ui/button";
import { getDebtBalance } from "@/lib/debtUtils";
import { formatCurrency } from "@/lib/format";
import { cn } from "@/lib/utils";
import { Trash2 } from "lucide-react";
import { useTranslation } from "react-i18next";
import type { DebtListMobileProps } from "@/types/debt";

export type { DebtListMobileProps };

export function DebtListMobile({
  debts,
  paymentsByDebt,
  onAddPayment,
  onDelete,
}: DebtListMobileProps) {
  const { t } = useTranslation();
  return (
    <div className="space-y-3 px-4 pb-2">
      {debts.map((debt, index) => {
        const payments = paymentsByDebt.get(debt.id) ?? [];
        const balance = getDebtBalance(debt, payments);
        return (
          <div
            key={debt.id}
            className="rounded-xl border border-border/60 overflow-hidden"
          >
            <div
              className={cn(
                "px-4 py-3 flex items-start gap-2",
                index % 2 === 1 ? "bg-muted/20" : "bg-background"
              )}
            >
              <div className="flex-1 min-w-0 text-left">
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
              </div>
            </div>
            <div className="px-4 pb-3">
              <div className="mb-2 flex items-center gap-2">
                <Button
                  type="button"
                  onClick={() => onAddPayment(debt.id)}
                  disabled={balance <= 0}
                  className="h-11 flex-1"
                  aria-label={`${t("debt.makePayment")} ${debt.name}`}
                >
                  {t("debt.makePayment")}
                </Button>
                <Button
                  type="button"
                  variant="destructive"
                  onClick={() => onDelete(debt.id)}
                  className="h-11 flex-1"
                  aria-label={`${t("debt.deleteDebt")} ${debt.name}`}
                >
                  <Trash2 className="size-4" />
                  {t("debt.deleteDebt")}
                </Button>
              </div>
              <div className="text-xs text-muted-foreground mb-2">
                {t("debt.paymentHistory")}
              </div>
              {payments.length === 0 ? (
                <div className="text-xs text-muted-foreground">
                  {t("debt.noPaymentsYet")}
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
