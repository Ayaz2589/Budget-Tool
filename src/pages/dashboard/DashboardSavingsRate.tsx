import { useTranslation } from "react-i18next";
import { formatCurrency, formatPercent } from "@/lib/format";
import { clamp } from "@/lib/math";
import { DsChartCard } from "@/components/ds";
import type { DashboardSavingsRate as SavingsRateData } from "@/types/dashboard";

interface DashboardSavingsRateProps {
  savingsRate: SavingsRateData;
}

export function DashboardSavingsRate({
  savingsRate,
}: DashboardSavingsRateProps) {
  const { t } = useTranslation();

  const spentPct = clamp(
    savingsRate.totalIncome > 0
      ? savingsRate.totalSpent / savingsRate.totalIncome
      : 0,
    0,
    1,
  );
  const barWidthPct = Math.round(spentPct * 100);

  const isPositive = savingsRate.savingsRate >= 0;

  return (
    <DsChartCard title={t("dashboard.savingsRateTitle")} className="min-w-0">
      <div className="rounded-2xl border border-border bg-card px-4 py-3 md:px-5 md:py-4 space-y-2">
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground/90">
            {t("dashboard.savingsRate")}
          </p>
          <p
            className={`mt-0.5 text-2xl font-semibold leading-tight tracking-tight ${
              isPositive ? "text-emerald-500" : "text-destructive"
            }`}
          >
            {formatPercent(savingsRate.savingsRate)}
          </p>
        </div>

        <div className="space-y-1">
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>{t("dashboard.incomeConsumed")}</span>
            <span>{barWidthPct}%</span>
          </div>
          <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
            <div
              className={`h-full rounded-full transition-all ${
                barWidthPct >= 100
                  ? "bg-destructive"
                  : barWidthPct >= 80
                    ? "bg-amber-500"
                    : "bg-emerald-500"
              }`}
              style={{ width: `${barWidthPct}%` }}
            />
          </div>
        </div>

        <p className="text-sm text-muted-foreground">
          {isPositive
            ? t("dashboard.savingsRateSaved", {
                saved: formatCurrency(savingsRate.amountSaved),
                income: formatCurrency(savingsRate.totalIncome),
              })
            : t("dashboard.savingsRateOverspent", {
                over: formatCurrency(Math.abs(savingsRate.amountSaved)),
                income: formatCurrency(savingsRate.totalIncome),
              })}
        </p>
      </div>
    </DsChartCard>
  );
}
