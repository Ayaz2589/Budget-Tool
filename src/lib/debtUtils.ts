import type { Debt, DebtPayment } from "@/lib/types";
import { computeDebtBalance, sumAmountsBy } from "@/lib/math";

/** Current balance for a debt (initial minus payments). */
export function getDebtBalance(debt: Debt, payments: DebtPayment[]): number {
  const totalPaid = sumAmountsBy(
    payments.filter((payment) => payment.debtId === debt.id),
    (payment) => payment.amount,
  );
  return computeDebtBalance(debt.initialAmount, totalPaid);
}
