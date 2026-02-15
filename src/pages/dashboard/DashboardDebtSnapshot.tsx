import { useTranslation } from "react-i18next";
import { formatCurrency, formatDate } from "@/lib/format";
import { clamp } from "@/lib/math";
import { EXPENSE_SOURCE_LOCALE_KEYS } from "@/lib/sourceLabels";
import {
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { DsDataRow, DsEmptyState } from "@/components/ds";
import type { DashboardDebtRow, DashboardOwnerTransferItem } from "@/types/dashboard";
import type { Expense } from "@/types/core";

interface SpendBySourceRow {
  source: Expense["source"];
  value: number;
}

interface DashboardDebtSnapshotProps {
  debtRows: DashboardDebtRow[];
  spendBySourceRows: SpendBySourceRow[];
  ownerTransfersMtd: DashboardOwnerTransferItem[];
  ownerTransfersMtdTotal: number;
  recentActivity: Expense[];
}

/**
 * Renders AccordionItem elements for debt, spend-by-source, transfers, and
 * recent activity. Must be placed inside an `<Accordion>` parent.
 */
export function DashboardDebtSnapshot({
  debtRows,
  spendBySourceRows,
  ownerTransfersMtd,
  ownerTransfersMtdTotal,
  recentActivity,
}: DashboardDebtSnapshotProps) {
  const { t } = useTranslation();

  return (
    <>
      <AccordionItem
        value="debt"
        data-tour="dashboard-debt-snapshot"
        className="rounded-2xl border border-border/60 bg-card px-4"
      >
        <AccordionTrigger className="cursor-pointer py-4 text-base font-semibold hover:no-underline">
          {t("dashboard.sectionDebtSnapshot")}
        </AccordionTrigger>
        <AccordionContent className="pb-3 pt-0">
          {debtRows.length === 0 ? (
            <div className="border-t border-[var(--border-subtle)] pt-3">
              <DsEmptyState title={t("dashboard.sectionNoActiveDebts")} className="py-4" />
            </div>
          ) : (
            <div className="border-t border-[var(--border-subtle)]">
              {debtRows.map((row) => (
                <DsDataRow
                  key={row.id}
                  title={row.name}
                  subtitle={row.owner || t("common.noOwner")}
                  trailing={<p className="font-semibold">{formatCurrency(row.remaining)}</p>}
                  meta={
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
                  }
                />
              ))}
            </div>
          )}
        </AccordionContent>
      </AccordionItem>

      <AccordionItem
        value="spend-source"
        data-tour="dashboard-spend-by-source"
        className="rounded-2xl border border-border/60 bg-card px-4"
      >
        <AccordionTrigger className="cursor-pointer py-4 text-base font-semibold hover:no-underline">
          {t("dashboard.sectionSpendByCardSource")}
        </AccordionTrigger>
        <AccordionContent className="pb-3 pt-0">
          {spendBySourceRows.length === 0 ? (
            <div className="border-t border-[var(--border-subtle)] pt-3">
              <DsEmptyState title={t("dashboard.sectionNoSpendByCardSource")} className="py-4" />
            </div>
          ) : (
            <div className="border-t border-[var(--border-subtle)]">
              {spendBySourceRows.map((row) => (
                <DsDataRow
                  key={row.source}
                  title={t(`addTransaction.${EXPENSE_SOURCE_LOCALE_KEYS[row.source]}`)}
                  trailing={<p className="font-semibold">{formatCurrency(row.value)}</p>}
                  dense
                />
              ))}
            </div>
          )}
        </AccordionContent>
      </AccordionItem>

      <AccordionItem
        value="transfers"
        data-tour="dashboard-owner-transfers"
        className="rounded-2xl border border-border/60 bg-card px-4"
      >
        <AccordionTrigger className="cursor-pointer py-4 text-base font-semibold hover:no-underline">
          {t("dashboard.ownerTransfersMtd")}
        </AccordionTrigger>
        <AccordionContent className="pb-3 pt-0">
          {ownerTransfersMtd.length === 0 ? (
            <div className="border-t border-[var(--border-subtle)] pt-3">
              <DsEmptyState title={t("dashboard.noOwnerTransfersMtd")} className="py-4" />
            </div>
          ) : (
            <div className="border-t border-[var(--border-subtle)]">
              <div className="px-0 py-2">
                <p className="text-xl font-semibold">{formatCurrency(ownerTransfersMtdTotal)}</p>
              </div>
              {ownerTransfersMtd.map((row) => (
                <DsDataRow
                  key={row.id}
                  title={`${row.fromOwner} \u2192 ${row.toOwner}`}
                  subtitle={`${formatDate(row.date)}${row.note ? ` \u00B7 ${row.note}` : ""}`}
                  trailing={<p className="font-semibold">{formatCurrency(row.amount)}</p>}
                  dense
                />
              ))}
            </div>
          )}
        </AccordionContent>
      </AccordionItem>

      <AccordionItem
        value="recent"
        data-tour="dashboard-recent-activity"
        className="rounded-2xl border border-border/60 bg-card px-4"
      >
        <AccordionTrigger className="cursor-pointer py-4 text-base font-semibold hover:no-underline">
          {t("dashboard.sectionRecentActivity")}
        </AccordionTrigger>
        <AccordionContent className="pb-3 pt-0">
          {recentActivity.length === 0 ? (
            <div className="border-t border-[var(--border-subtle)] pt-3">
              <DsEmptyState title={t("dashboard.sectionNoRecentTransactions")} className="py-4" />
            </div>
          ) : (
            <div className="border-t border-[var(--border-subtle)]">
              {recentActivity.slice(0, 3).map((item) => (
                <DsDataRow
                  key={item.id}
                  title={item.description || "\u2014"}
                  subtitle={(item.category || t("common.uncategorized")) + " \u00B7 " + (item.owner || t("common.noOwner"))}
                  trailing={<p className="font-semibold">{formatCurrency(item.amount)}</p>}
                  dense
                />
              ))}
            </div>
          )}
        </AccordionContent>
      </AccordionItem>
    </>
  );
}
