import { useTranslation } from "react-i18next";
import { formatCurrency } from "@/lib/format";
import { EXPENSE_SOURCE_LOCALE_KEYS } from "@/lib/sourceLabels";
import { DsDataRow, DsEmptyState } from "@/components/ds";
import type { Expense } from "@/types/core";
import type { WidgetSize } from "@/lib/widgets/widget";

interface SpendBySourceRow {
  source: Expense["source"];
  value: number;
}

interface SpendBySourceProps {
  spendBySourceRows: SpendBySourceRow[];
  size?: WidgetSize;
}

export function SpendBySource({ spendBySourceRows, size = "md" }: SpendBySourceProps) {
  const { t } = useTranslation();
  const total = spendBySourceRows.reduce((sum, r) => sum + r.value, 0);

  // sm (~141×104px): total spend + source count badge
  if (size === "sm") {
    return (
      <div>
        <h3 className="text-xs font-medium text-muted-foreground">{t("dashboard.sectionSpendByCardSource")}</h3>
        <p className="mt-1 text-lg font-semibold">{formatCurrency(total)}</p>
        <p className="text-xs text-muted-foreground">
          {t("dashboard.sourceCount", { count: spendBySourceRows.length })}
        </p>
      </div>
    );
  }

  const limit = size === "lg" ? spendBySourceRows.length : 4;
  const displayRows = spendBySourceRows.slice(0, limit);

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
              subtitle={size === "lg" && total > 0
                ? `${Math.round((row.value / total) * 100)}%`
                : undefined}
              trailing={<p className="font-semibold">{formatCurrency(row.value)}</p>}
              dense
            />
          ))}
          {size === "md" && spendBySourceRows.length > 4 && (
            <p className="px-4 py-2 text-xs text-muted-foreground">
              {t("dashboard.moreItemsCount", { count: spendBySourceRows.length - 4 })}
            </p>
          )}
        </>
      )}
    </div>
  );
}
