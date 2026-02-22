import { useTranslation } from "react-i18next";
import { formatCurrency, formatDate } from "@/lib/format";
import { DsDataRow, DsEmptyState } from "@/components/ds";
import type { Expense } from "@/types/core";
import type { WidgetSize } from "@/types/widget";

interface RecentActivityProps {
  recentActivity: Expense[];
  size?: WidgetSize;
}

export function RecentActivity({ recentActivity, size = "md" }: RecentActivityProps) {
  const { t } = useTranslation();

  // sm (~141×104px): count of recent items + badge
  if (size === "sm") {
    const total = recentActivity.reduce((sum, e) => sum + e.amount, 0);
    return (
      <div>
        <h3 className="text-xs font-medium text-muted-foreground">{t("dashboard.sectionRecentActivity")}</h3>
        <p className="mt-1 text-lg font-semibold">{formatCurrency(total)}</p>
        <p className="text-xs text-muted-foreground">
          {t("dashboard.recentItemsCount", { count: recentActivity.length })}
        </p>
      </div>
    );
  }

  const limit = size === "lg" ? recentActivity.length : 4;
  const displayItems = recentActivity.slice(0, limit);

  return (
    <div>
      <h3 className="px-4 py-3 text-base font-semibold">{t("dashboard.sectionRecentActivity")}</h3>
      {recentActivity.length === 0 ? (
        <DsEmptyState title={t("dashboard.sectionNoRecentTransactions")} className="py-4" />
      ) : (
        <>
          {displayItems.map((item) => (
            <DsDataRow
              key={item.id}
              title={item.description || "\u2014"}
              subtitle={
                size === "lg"
                  ? `${formatDate(item.date)} \u00B7 ${item.category || t("common.uncategorized")} \u00B7 ${item.owner || t("common.noOwner")}`
                  : `${item.category || t("common.uncategorized")} \u00B7 ${item.owner || t("common.noOwner")}`
              }
              trailing={<p className="font-semibold">{formatCurrency(item.amount)}</p>}
              dense
            />
          ))}
          {size === "md" && recentActivity.length > 4 && (
            <p className="px-4 py-2 text-xs text-muted-foreground">
              {t("dashboard.moreItemsCount", { count: recentActivity.length - 4 })}
            </p>
          )}
        </>
      )}
    </div>
  );
}
