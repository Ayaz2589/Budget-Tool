import { useTranslation } from "react-i18next";
import { formatCurrency } from "@/lib/format";
import { clamp } from "@/lib/math";
import { DsDataRow, DsEmptyState } from "@/components/ds";
import type { DashboardDebtRow } from "@/types/dashboard";
import type { WidgetSize } from "@/types/widget";

interface WidgetDebtSnapshotProps {
  debtRows: DashboardDebtRow[];
  size?: WidgetSize;
}

export function WidgetDebtSnapshot({ debtRows, size = "md" }: WidgetDebtSnapshotProps) {
  const { t } = useTranslation();
  const displayRows = size === "sm" ? debtRows.slice(0, 2) : debtRows;

  return (
    <div>
      <h3 className="px-4 py-3 text-base font-semibold">{t("dashboard.sectionDebtSnapshot")}</h3>
      {debtRows.length === 0 ? (
        <DsEmptyState title={t("dashboard.sectionNoActiveDebts")} className="py-4" />
      ) : (
        displayRows.map((row) => (
          <DsDataRow
            key={row.id}
            title={row.name}
            subtitle={size !== "sm" ? (row.owner || t("common.noOwner")) : undefined}
            trailing={<p className="font-semibold">{formatCurrency(row.remaining)}</p>}
            meta={
              size !== "sm" ? (
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
            dense={size === "sm"}
          />
        ))
      )}
    </div>
  );
}
