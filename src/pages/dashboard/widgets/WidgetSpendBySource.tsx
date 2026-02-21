import { useTranslation } from "react-i18next";
import { formatCurrency } from "@/lib/format";
import { EXPENSE_SOURCE_LOCALE_KEYS } from "@/lib/sourceLabels";
import { DsDataRow, DsEmptyState } from "@/components/ds";
import type { Expense } from "@/types/core";
import type { WidgetSize } from "@/types/widget";

interface SpendBySourceRow {
  source: Expense["source"];
  value: number;
}

interface WidgetSpendBySourceProps {
  spendBySourceRows: SpendBySourceRow[];
  size?: WidgetSize;
}

export function WidgetSpendBySource({ spendBySourceRows, size = "md" }: WidgetSpendBySourceProps) {
  const { t } = useTranslation();
  const effectiveSize: WidgetSize = (["sm", "md", "lg"] as const).includes(size) ? size : "md";
  const displayRows = effectiveSize === "sm" ? spendBySourceRows.slice(0, 3) : spendBySourceRows;
  const truncatedCount = spendBySourceRows.length - displayRows.length;
  const total = spendBySourceRows.reduce((sum, r) => sum + r.value, 0);

  return (
    <div>
      <h3 className="px-4 py-3 text-base font-semibold">{t("dashboard.sectionSpendByCardSource")}</h3>
      {spendBySourceRows.length === 0 ? (
        <DsEmptyState title={t("dashboard.sectionNoSpendByCardSource")} className="py-4" />
      ) : (
        <>
          {displayRows.map((row) => (
            <DsDataRow
              key={row.source}
              title={t(`addTransaction.${EXPENSE_SOURCE_LOCALE_KEYS[row.source]}`)}
              subtitle={effectiveSize === "lg" && total > 0
                ? `${Math.round((row.value / total) * 100)}%`
                : undefined}
              trailing={<p className="font-semibold">{formatCurrency(row.value)}</p>}
              dense
            />
          ))}
          {effectiveSize === "sm" && truncatedCount > 0 && (
            <p className="px-4 py-2 text-xs text-muted-foreground">
              {t("dashboard.moreItemsCount", { count: truncatedCount })}
            </p>
          )}
        </>
      )}
    </div>
  );
}
