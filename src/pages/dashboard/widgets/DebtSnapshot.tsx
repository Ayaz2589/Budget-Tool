import { useTranslation } from "react-i18next";
import { formatCurrency } from "@/lib/format";
import { clamp } from "@/lib/math";
import { Landmark } from "lucide-react";
import { DsDataRow, DsEmptyState } from "@/components/ds";
import type { DashboardDebtRow } from "@/types/dashboard";
import type { WidgetSize } from "@/lib/widgets/widget";

interface DebtSnapshotProps {
  debtRows: DashboardDebtRow[];
  size?: WidgetSize;
}

export function DebtSnapshot({ debtRows, size = "md" }: DebtSnapshotProps) {
  const { t } = useTranslation();

  // sm (~141×104px): count of active debts + total badge
  if (size === "sm") {
    const total = debtRows.reduce((sum, r) => sum + r.remaining, 0);
    return (
      <div>
        <h3 className="text-xs font-medium text-muted-foreground">{t("dashboard.sectionDebtSnapshot")}</h3>
        <p className="mt-1 text-lg font-semibold">{formatCurrency(total)}</p>
        <p className="text-xs text-muted-foreground">
          {t("dashboard.activeDebtsCount", { count: debtRows.length })}
        </p>
      </div>
    );
  }

  const limit = size === "lg" ? debtRows.length : 4;
  const displayRows = debtRows.slice(0, limit);

  return (
    <div>
      <h3 className="py-2 text-xs font-medium uppercase tracking-wider text-muted-foreground/80">{t("dashboard.sectionDebtSnapshot")}</h3>
      {debtRows.length === 0 ? (
        <DsEmptyState icon={<Landmark className="size-5" />} title={t("dashboard.sectionNoActiveDebts")} className="py-4" />
      ) : (
        <>
          {displayRows.map((row) => (
            <DsDataRow
              key={row.id}
              title={row.name}
              subtitle={size === "lg" ? (row.owner || t("common.noOwner")) : undefined}
              trailing={<p className="font-semibold">{formatCurrency(row.remaining)}</p>}
              meta={
                size === "lg" ? (
                  <>
                    <div className="mt-2 h-2 rounded bg-muted">
                      <div
                        className="h-2 rounded bg-primary"
                        style={{ width: `${clamp(row.progress * 100, 0, 100)}%` }}
                      />
                    </div>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {formatCurrency(row.paid)} / {formatCurrency(row.initialAmount)}
                    </p>
                  </>
                ) : undefined
              }
              dense={size === "md"}
            />
          ))}
          {size === "md" && debtRows.length > 4 && (
            <p className="px-4 py-2 text-xs text-muted-foreground">
              {t("dashboard.moreItemsCount", { count: debtRows.length - 4 })}
            </p>
          )}
        </>
      )}
    </div>
  );
}
