import { useState } from "react";
import { useTranslation } from "react-i18next";
import { ChevronDown, ChevronUp } from "lucide-react";
import { formatCurrency, formatDate } from "@/lib/format";
import { percentOfTotal } from "@/lib/math";
import { UserCircle } from "lucide-react";
import { DsDataRow, DsEmptyState } from "@/components/ds";
import type { DashboardOwnerNetRow } from "@/types/dashboard";
import type { buildOwnerExpenseItems } from "@/pages/dashboard/dashboardSelectors";
import type { WidgetSize } from "@/lib/widgets/widget";

interface OwnerExpenseByOwnerProps {
  visibleOwnerNetRows: DashboardOwnerNetRow[];
  ownerExpenseItemsByOwner: Map<string, ReturnType<typeof buildOwnerExpenseItems>>;
  totalSpentForSelectedRange: number;
  percentFormatter: Intl.NumberFormat;
  size?: WidgetSize;
}

export function OwnerExpenseByOwner({
  visibleOwnerNetRows,
  ownerExpenseItemsByOwner,
  totalSpentForSelectedRange,
  percentFormatter,
  size = "lg",
}: OwnerExpenseByOwnerProps) {
  const { t } = useTranslation();
  const [expandedOwnerKey, setExpandedOwnerKey] = useState<string | null>(null);

  // sm: summary (owner count + total)
  if (size === "sm") {
    const total = visibleOwnerNetRows.reduce((sum, r) => sum + r.gross, 0);
    return (
      <div>
        <h3 className="text-xs font-medium text-muted-foreground">
          {t("dashboard.sectionExpenseByOwner")}
        </h3>
        <p className="mt-1 text-lg font-semibold">{formatCurrency(total)}</p>
        <p className="text-xs text-muted-foreground">
          {visibleOwnerNetRows.length} {visibleOwnerNetRows.length === 1 ? "owner" : "owners"}
        </p>
      </div>
    );
  }

  // md: compact list without expandable details
  if (size === "md") {
    return (
      <div>
        <h3 className="px-4 py-3 text-xs font-medium uppercase tracking-wider text-muted-foreground/80">
          {t("dashboard.sectionExpenseByOwner")}
        </h3>
        {visibleOwnerNetRows.length === 0 ? (
          <DsEmptyState icon={<UserCircle className="size-5" />} title={t("dashboard.sectionNoOwnerExpenses")} className="py-4" />
        ) : (
          visibleOwnerNetRows.map((row) => {
            const ownerShareOfTotal = percentOfTotal(row.gross, totalSpentForSelectedRange);
            return (
              <DsDataRow
                key={row.owner}
                title={row.owner}
                subtitle={t("dashboard.ofTotalSpent", {
                  percent: percentFormatter.format(ownerShareOfTotal),
                })}
                trailing={
                  <div className="text-right">
                    <p className="font-semibold">{formatCurrency(row.net)}</p>
                    <p className="text-xs text-muted-foreground">
                      {t("dashboard.grossShort")}: {formatCurrency(row.gross)}
                    </p>
                  </div>
                }
                ariaLabel={row.owner}
                dense
              />
            );
          })
        )}
      </div>
    );
  }

  // lg: full expandable list (original behavior)
  return (
    <section data-tour="dashboard-expense-by-owner" className="space-y-2">
      <h2 className="py-2 inline-flex items-center gap-1.5 text-base font-semibold">
        {t("dashboard.sectionExpenseByOwner")}
      </h2>
      {visibleOwnerNetRows.length === 0 ? (
        <DsEmptyState icon={<UserCircle className="size-5" />} title={t("dashboard.sectionNoOwnerExpenses")} className="py-4" />
      ) : (
        <div className="rounded-2xl border border-border/60 bg-card">
          <div className="grid grid-cols-2 gap-2 border-b border-[var(--border-subtle)] px-3 py-2 text-[11px] uppercase tracking-wide text-muted-foreground">
            <p>{t("dashboard.grossExpenseByOwner")}</p>
            <p className="text-right">{t("dashboard.netAfterTransfers")}</p>
          </div>
          <div>
            {visibleOwnerNetRows.map((row) => {
              const ownerShareOfTotal = percentOfTotal(
                row.gross,
                totalSpentForSelectedRange,
              );
              const isExpanded = expandedOwnerKey === row.owner;
              const ownerItems = ownerExpenseItemsByOwner.get(row.owner) ?? [];
              const transferImpact = row.received - row.sent;
              const netToneClass =
                row.net >= 0 ? "text-foreground" : "text-destructive";
              const transferToneClass =
                transferImpact >= 0 ? "text-emerald-500" : "text-amber-500";
              const transferImpactDisplay =
                transferImpact > 0
                  ? `+${formatCurrency(transferImpact)}`
                  : formatCurrency(transferImpact);
              return (
                <DsDataRow
                  key={row.owner}
                  title={row.owner}
                  subtitle={t("dashboard.ofTotalSpent", {
                    percent: percentFormatter.format(ownerShareOfTotal),
                  })}
                  trailing={
                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <p className="text-[10px] uppercase tracking-wide text-muted-foreground">
                          {t("dashboard.netAfterTransfers")}
                        </p>
                        <p className={`text-2xl font-bold leading-none ${netToneClass}`}>
                          {formatCurrency(row.net)}
                        </p>
                        <p className="mt-1 text-xs text-muted-foreground">
                          {t("dashboard.grossShort")}:{" "}
                          <span className="font-semibold text-foreground">
                            {formatCurrency(row.gross)}
                          </span>
                        </p>
                        <p className={`text-xs font-semibold ${transferToneClass}`}>
                          {t("dashboard.transferImpact")}: {transferImpactDisplay}
                        </p>
                      </div>
                      {isExpanded ? (
                        <ChevronUp className="size-4 text-muted-foreground" />
                      ) : (
                        <ChevronDown className="size-4 text-muted-foreground" />
                      )}
                    </div>
                  }
                  onClick={() =>
                    setExpandedOwnerKey(expandedOwnerKey === row.owner ? null : row.owner)
                  }
                  ariaLabel={row.owner}
                  meta={
                    isExpanded ? (
                      <div className="space-y-2">
                        <div className="grid grid-cols-2 gap-2 text-xs text-muted-foreground">
                          <p>
                            {t("dashboard.grossExpenseByOwner")}: {formatCurrency(row.gross)}
                          </p>
                          <p className="text-right text-sm font-semibold">
                            {t("dashboard.netAfterTransfers")}:{" "}
                            <span className={netToneClass}>{formatCurrency(row.net)}</span>
                          </p>
                          <p>{t("dashboard.transfersSent")}: {formatCurrency(row.sent)}</p>
                          <p className="text-right">
                            {t("dashboard.transfersReceived")}: {formatCurrency(row.received)}
                          </p>
                          <p className="col-span-2 text-right">
                            {t("dashboard.transferImpact")}:{" "}
                            <span className={transferToneClass}>
                              {transferImpactDisplay}
                            </span>
                          </p>
                        </div>
                        {ownerItems.length === 0 ? (
                          <p className="text-xs text-muted-foreground">
                            {t("dashboard.sectionNoOwnerExpenseItems")}
                          </p>
                        ) : (
                          <div className="space-y-1">
                            {ownerItems.map((item) => (
                              <div
                                key={`${row.owner}-${item.id}`}
                                className="flex items-start justify-between gap-2 rounded-md bg-muted/30 px-2 py-1.5 text-xs"
                              >
                                <div className="min-w-0">
                                  <p className="truncate font-medium text-foreground">
                                    {item.description || "\u2014"}
                                  </p>
                                  <p className="truncate text-muted-foreground">
                                    {formatDate(item.date)} {"\u00B7"}{" "}
                                    {item.category || t("common.uncategorized")} {"\u00B7"}{" "}
                                    {t("addTransaction.paidBy")}:{" "}
                                    {item.paidByOwner || t("common.noOwner")}
                                  </p>
                                </div>
                                <div className="shrink-0 text-right">
                                  <p className="font-medium text-foreground">
                                    {formatCurrency(item.allocatedAmount)}
                                  </p>
                                  <p className="text-[11px] text-muted-foreground">
                                    {formatCurrency(item.totalAmount)}
                                  </p>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    ) : undefined
                  }
                  className={isExpanded ? "bg-muted/20 cursor-pointer" : "cursor-pointer"}
                  dense
                />
              );
            })}
          </div>
        </div>
      )}
    </section>
  );
}
