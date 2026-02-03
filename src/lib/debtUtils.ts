import type { Debt, DebtPayment } from "@/lib/types";

/** Current balance for a debt (initial minus payments). */
export function getDebtBalance(debt: Debt, payments: DebtPayment[]): number {
  const totalPaid = payments
    .filter((p) => p.debtId === debt.id)
    .reduce((sum, p) => sum + p.amount, 0);
  return Math.max(0, debt.initialAmount - totalPaid);
}
