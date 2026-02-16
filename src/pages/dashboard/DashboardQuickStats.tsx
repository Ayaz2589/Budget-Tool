import { useTranslation } from "react-i18next";
import { formatCurrency } from "@/lib/format";
import type { DashboardQuickStats as QuickStatsData } from "@/types/dashboard";

interface DashboardQuickStatsProps {
  stats: QuickStatsData;
}

export function DashboardQuickStats({ stats }: DashboardQuickStatsProps) {
  const { t } = useTranslation();

  return (
    <div className="grid grid-cols-3 gap-1.5 md:gap-3">
      <div className="rounded-2xl border border-border bg-card px-3 py-2.5 md:px-4 md:py-3">
        <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground/90 truncate">
          {t("dashboard.fixedObligations")}
        </p>
        <p className="mt-0.5 text-lg font-semibold leading-tight tracking-tight md:text-xl">
          {formatCurrency(stats.fixedObligations)}
        </p>
        <p className="mt-0.5 text-xs text-muted-foreground truncate">
          {t("dashboard.fixedObligationsHint")}
        </p>
      </div>

      <div className="rounded-2xl border border-border bg-card px-3 py-2.5 md:px-4 md:py-3">
        <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground/90 truncate">
          {t("dashboard.largestExpense")}
        </p>
        {stats.largestExpense ? (
          <>
            <p className="mt-0.5 text-lg font-semibold leading-tight tracking-tight md:text-xl">
              {formatCurrency(stats.largestExpense.amount)}
            </p>
            <p className="mt-0.5 text-xs text-muted-foreground truncate">
              {stats.largestExpense.description}
            </p>
          </>
        ) : (
          <p className="mt-0.5 text-sm text-muted-foreground">
            {t("dashboard.noExpensesForMonth")}
          </p>
        )}
      </div>

      <div className="rounded-2xl border border-border bg-card px-3 py-2.5 md:px-4 md:py-3">
        <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground/90 truncate">
          {t("dashboard.transactionCount")}
        </p>
        <p className="mt-0.5 text-lg font-semibold leading-tight tracking-tight md:text-xl">
          {stats.transactionCount}
        </p>
        <p className="mt-0.5 text-xs text-muted-foreground truncate">
          {t("dashboard.transactionCountHint")}
        </p>
      </div>
    </div>
  );
}
