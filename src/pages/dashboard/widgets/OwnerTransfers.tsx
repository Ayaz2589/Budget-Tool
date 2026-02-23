import { useTranslation } from "react-i18next";
import { formatCurrency, formatDate } from "@/lib/format";
import { DsDataRow, DsEmptyState } from "@/components/ds";
import type { DashboardOwnerTransferItem } from "@/types/dashboard";
import type { WidgetSize } from "@/lib/widgets/widget";

interface OwnerTransfersProps {
  ownerTransfersMtd: DashboardOwnerTransferItem[];
  ownerTransfersMtdTotal: number;
  size?: WidgetSize;
}

export function OwnerTransfers({
  ownerTransfersMtd,
  ownerTransfersMtdTotal,
  size = "md",
}: OwnerTransfersProps) {
  const { t } = useTranslation();

  // sm (~141×104px): total transfers + badge
  if (size === "sm") {
    return (
      <div>
        <h3 className="text-xs font-medium text-muted-foreground">{t("dashboard.ownerTransfersMtd")}</h3>
        <p className="mt-1 text-lg font-semibold">{formatCurrency(ownerTransfersMtdTotal)}</p>
        <p className="text-xs text-muted-foreground">
          {t("dashboard.transferCount", { count: ownerTransfersMtd.length })}
        </p>
      </div>
    );
  }

  const limit = size === "lg" ? ownerTransfersMtd.length : 4;
  const displayRows = ownerTransfersMtd.slice(0, limit);

  return (
    <div>
      <h3 className="px-4 py-3 text-base font-semibold">{t("dashboard.ownerTransfersMtd")}</h3>
      {ownerTransfersMtd.length === 0 ? (
        <DsEmptyState title={t("dashboard.noOwnerTransfersMtd")} className="py-4" />
      ) : (
        <>
          <div className="px-0 py-2">
            <p className="text-xl font-semibold">{formatCurrency(ownerTransfersMtdTotal)}</p>
          </div>
          {displayRows.map((row) => (
            <DsDataRow
              key={row.id}
              title={`${row.fromOwner} \u2192 ${row.toOwner}`}
              subtitle={`${formatDate(row.date)}${row.note ? ` \u00B7 ${row.note}` : ""}`}
              trailing={<p className="font-semibold">{formatCurrency(row.amount)}</p>}
              dense
            />
          ))}
          {size === "md" && ownerTransfersMtd.length > 4 && (
            <p className="px-4 py-2 text-xs text-muted-foreground">
              {t("dashboard.moreItemsCount", { count: ownerTransfersMtd.length - 4 })}
            </p>
          )}
        </>
      )}
    </div>
  );
}
