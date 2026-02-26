import { formatCurrency } from "@/lib/format";

export function formatSpentDeltaLabel(pct: number | null): string {
  if (pct === null) return "—";
  const direction = pct >= 0 ? "+" : "";
  return `${direction}${(pct * 100).toFixed(1)}%`;
}

export function formatDebtPaidSubtitle(
  value: number,
  translate: (key: string, values?: Record<string, string | number>) => string,
): string {
  return translate("dashboard.debtPaidThisMonth", { amount: formatCurrency(value) });
}
