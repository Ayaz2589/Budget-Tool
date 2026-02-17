import { useTranslation } from "react-i18next";
import { formatCurrency } from "@/lib/format";
import { DsDataRow, DsEmptyState } from "@/components/ds";
import type { Expense } from "@/types/core";
import type { WidgetSize } from "@/types/widget";

interface WidgetRecentActivityProps {
  recentActivity: Expense[];
  size?: WidgetSize;
}

export function WidgetRecentActivity({ recentActivity, size = "md" }: WidgetRecentActivityProps) {
  const { t } = useTranslation();
  const limit = size === "sm" ? 2 : size === "lg" ? 5 : 3;

  return (
    <div>
      <h3 className="px-4 py-3 text-base font-semibold">{t("dashboard.sectionRecentActivity")}</h3>
      {recentActivity.length === 0 ? (
        <DsEmptyState title={t("dashboard.sectionNoRecentTransactions")} className="py-4" />
      ) : (
        recentActivity.slice(0, limit).map((item) => (
          <DsDataRow
            key={item.id}
            title={item.description || "\u2014"}
            subtitle={(item.category || t("common.uncategorized")) + " \u00B7 " + (item.owner || t("common.noOwner"))}
            trailing={<p className="font-semibold">{formatCurrency(item.amount)}</p>}
            dense
          />
        ))
      )}
    </div>
  );
}
