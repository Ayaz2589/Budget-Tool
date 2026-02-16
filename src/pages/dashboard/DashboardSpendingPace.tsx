import { useTranslation } from "react-i18next";
import { formatCurrency } from "@/lib/format";
import { DsChartCard } from "@/components/ds";
import type { DashboardSpendingPace as SpendingPaceData } from "@/types/dashboard";

interface DashboardSpendingPaceProps {
  pace: SpendingPaceData;
}

export function DashboardSpendingPace({ pace }: DashboardSpendingPaceProps) {
  const { t } = useTranslation();

  const progressPct = Math.round((pace.dayOfMonth / pace.daysInMonth) * 100);

  return (
    <DsChartCard title={t("dashboard.spendingPaceTitle")} className="min-w-0">
      <div className="rounded-2xl border border-border bg-card px-4 py-3 md:px-5 md:py-4 space-y-2">
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground/90">
            {t("dashboard.dailyAverage")}
          </p>
          <p className="mt-0.5 text-2xl font-semibold leading-tight tracking-tight">
            {formatCurrency(pace.dailyAverage)}
          </p>
        </div>

        <div className="space-y-1">
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>
              {t("dashboard.spendingPaceDay", {
                day: pace.dayOfMonth,
                total: pace.daysInMonth,
              })}
            </span>
            <span>{progressPct}%</span>
          </div>
          <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
            <div
              className="h-full rounded-full bg-foreground/60 transition-all"
              style={{ width: `${progressPct}%` }}
            />
          </div>
        </div>

        <div className="space-y-0.5 text-sm text-muted-foreground">
          <p>
            {t("dashboard.projectedTotal")}:{" "}
            <span className="font-medium text-foreground">
              {formatCurrency(pace.projectedTotal)}
            </span>
          </p>
          {pace.paceVsLastMonth !== null ? (
            <p
              className={
                pace.paceVsLastMonth > 0
                  ? "text-destructive"
                  : "text-emerald-500"
              }
            >
              {pace.paceVsLastMonth > 0
                ? t("dashboard.paceOverLastMonth", {
                    amount: formatCurrency(Math.abs(pace.paceVsLastMonth)),
                  })
                : t("dashboard.paceUnderLastMonth", {
                    amount: formatCurrency(Math.abs(pace.paceVsLastMonth)),
                  })}
            </p>
          ) : null}
        </div>
      </div>
    </DsChartCard>
  );
}
