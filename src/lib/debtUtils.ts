import type { Debt, DebtPayment } from "@/lib/types";

const MS_PER_DAY = 24 * 60 * 60 * 1000;
const BIWEEKLY_DAYS = 14;

/** Number of recurring deductions that have "occurred" up to asOfDate (default: now). */
export function countRecurringDeductions(
  debt: Debt,
  asOfDate?: Date,
): number {
  const now = asOfDate ?? new Date();
  const amount = debt.recurringAmount ?? 0;
  if (amount <= 0) return 0;

  const frequency = debt.recurringFrequency ?? "monthly";

  if (frequency === "biweekly") {
    const startDateStr = debt.recurringStartDate ?? debt.startDate;
    if (!startDateStr) return 0;
    const start = new Date(startDateStr);
    if (start.getTime() > now.getTime()) return 0;
    const elapsedDays = Math.floor(
      (now.getTime() - start.getTime()) / MS_PER_DAY,
    );
    return Math.max(0, Math.floor(elapsedDays / BIWEEKLY_DAYS) + 1);
  }

  // monthly
  const day = debt.recurringDayOfMonth ?? 1;
  if (day < 1 || day > 31) return 0;
  const startMonth = debt.startDate?.slice(0, 7) ?? null;
  if (!startMonth) return 0;
  const [startY, startM] = startMonth.split("-").map(Number);
  let y = startY;
  let m = startM;
  const endY = now.getFullYear();
  const endM = now.getMonth() + 1; // 1-based month
  let count = 0;
  while (y < endY || (y === endY && m < endM)) {
    count += 1;
    m += 1;
    if (m > 12) {
      m = 1;
      y += 1;
    }
  }
  if (y === endY && m === endM && now.getDate() >= day) count += 1;
  return count;
}

/** Current balance for a debt (initial minus payments minus recurring deductions). */
export function getDebtBalance(debt: Debt, payments: DebtPayment[]): number {
  const totalPaid = payments
    .filter((p) => p.debtId === debt.id)
    .reduce((sum, p) => sum + p.amount, 0);
  const recurringDeductions =
    (debt.recurringAmount ?? 0) * countRecurringDeductions(debt);
  return Math.max(0, debt.initialAmount - totalPaid - recurringDeductions);
}
