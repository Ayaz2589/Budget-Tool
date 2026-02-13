import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useTranslation } from "react-i18next";
import { getDebtBalance } from "@/lib/debtUtils";
import { formatCurrency, formatDate } from "@/lib/format";
import { cn } from "@/lib/utils";
import { DsHelpTooltip } from "@/components/ds";
import type { DebtListProps } from "@/types/debt";

export type { DebtListProps };

export function DebtList({
  debts,
  paymentsByDebt,
  onDebtTap,
}: DebtListProps) {
  const { t } = useTranslation();
  if (debts.length === 0) {
    return (
      <p className="text-muted-foreground text-sm py-6 text-center">
        {t("debt.noDebtsYet")}
      </p>
    );
  }

  return (
    <Table density="comfortable">
      <TableHeader>
        <TableRow>
          <TableHead>{t("common.description")}</TableHead>
          <TableHead>{t("common.owner")}</TableHead>
          <TableHead>{t("common.amount")}</TableHead>
          <TableHead>
            <span className="inline-flex items-center gap-1">
              {t("debt.balance")}
              <DsHelpTooltip
                content={t("debt.help.balanceColumn")}
                ariaLabel={t("common.help")}
                asChildSpan
              />
            </span>
          </TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {debts.map((debt, index) => {
          const payments = paymentsByDebt.get(debt.id) ?? [];
          const balance = getDebtBalance(debt, payments);
          return (
            <TableRow
              key={debt.id}
              role="button"
              tabIndex={0}
              onClick={() => onDebtTap(debt)}
              onKeyDown={(event) => {
                if (event.key === "Enter" || event.key === " ") {
                  event.preventDefault();
                  onDebtTap(debt);
                }
              }}
              className={cn(
                "cursor-pointer",
                index % 2 === 1 ? "bg-muted/30" : undefined
              )}
            >
              <TableCell className="font-medium">{debt.name}</TableCell>
              <TableCell className="text-muted-foreground">
                <div className="flex items-center gap-1 whitespace-nowrap">
                  <span>{debt.owner || t("common.noOwner")}</span>
                  {debt.startDate ? (
                    <span className="text-muted-foreground">
                      · {formatDate(debt.startDate)}
                    </span>
                  ) : null}
                </div>
              </TableCell>
              <TableCell>
                <div className="flex flex-col leading-tight">
                  <span>{formatCurrency(debt.initialAmount)}</span>
                  <span className="text-xs text-muted-foreground mt-0.5">
                    {payments.length === 1
                      ? t("transactions.transaction_one", { count: 1 })
                      : t("transactions.transaction_other", {
                          count: payments.length,
                        })}
                  </span>
                </div>
              </TableCell>
              <TableCell className="font-semibold">
                {formatCurrency(balance)}
              </TableCell>
            </TableRow>
          );
        })}
      </TableBody>
    </Table>
  );
}
