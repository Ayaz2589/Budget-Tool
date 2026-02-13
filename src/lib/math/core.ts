export const DEFAULT_AMOUNT_TOLERANCE = 0.01;

export function roundTo(value: number, decimals = 2): number {
  if (!Number.isFinite(value)) return 0;
  const scale = 10 ** decimals;
  return Math.round((value + Number.EPSILON) * scale) / scale;
}

export function sumAmountsBy<T>(
  items: readonly T[],
  getAmount: (item: T) => number,
): number {
  return items.reduce((sum, item) => {
    const amount = getAmount(item);
    return Number.isFinite(amount) ? sum + amount : sum;
  }, 0);
}

export function safeDivide(
  numerator: number,
  denominator: number,
  fallback = 0,
): number {
  if (!Number.isFinite(numerator) || !Number.isFinite(denominator) || denominator === 0) {
    return fallback;
  }
  return numerator / denominator;
}

export function computeMonthOverMonthPct(
  currentValue: number,
  previousValue: number,
): number | null {
  if (!Number.isFinite(previousValue) || previousValue <= 0) return null;
  return (currentValue - previousValue) / previousValue;
}

export function computeNetCashFlow(
  incomeTotal: number,
  expenseTotal: number,
  debtPaymentsTotal = 0,
): number {
  return incomeTotal - expenseTotal - debtPaymentsTotal;
}

export function computeDebtBalance(initialAmount: number, totalPaid: number): number {
  return Math.max(0, initialAmount - totalPaid);
}

export function computeDebtProgress(initialAmount: number, remainingAmount: number): number {
  if (!Number.isFinite(initialAmount) || initialAmount <= 0) return 0;
  const paid = Math.max(0, initialAmount - remainingAmount);
  return paid / initialAmount;
}

export function computeOwnerNetFromTransfers(
  grossAmount: number,
  transferReceived: number,
  transferSent: number,
): number {
  return grossAmount - transferReceived + transferSent;
}

export function percentOfTotal(part: number, total: number): number {
  return safeDivide(part, total, 0);
}

export function clamp(value: number, min: number, max: number): number {
  if (!Number.isFinite(value)) return min;
  return Math.min(max, Math.max(min, value));
}

export function amountsWithinTolerance(
  left: number,
  right: number,
  tolerance = DEFAULT_AMOUNT_TOLERANCE,
): boolean {
  return Math.abs(left - right) < tolerance;
}
