import { useTranslation } from "react-i18next";
import { formatCurrency, formatDate } from "@/lib/format";
import { DsDataRow, DsEmptyState } from "@/components/ds";
import type { DashboardOwnerTransferItem } from "@/types/dashboard";
import type { WidgetSize } from "@/types/widget";

interface WidgetOwnerTransfersProps {
  ownerTransfersMtd: DashboardOwnerTransferItem[];
  ownerTransfersMtdTotal: number;
  size?: WidgetSize;
}

export function WidgetOwnerTransfers({
  ownerTransfersMtd,
  ownerTransfersMtdTotal,
  size = "md",
}: WidgetOwnerTransfersProps) {
  const { t } = useTranslation();
  const displayRows = size === "sm" ? ownerTransfersMtd.slice(0, 2) : ownerTransfersMtd;

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
              subtitle={size !== "sm" ? `${formatDate(row.date)}${row.note ? ` \u00B7 ${row.note}` : ""}` : undefined}
              trailing={<p className="font-semibold">{formatCurrency(row.amount)}</p>}
              dense
            />
          ))}
        </>
      )}
    </div>
  );
}
