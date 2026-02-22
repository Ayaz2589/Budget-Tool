import { useTranslation } from "react-i18next";
import {
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { DebtSnapshot } from "./widgets/DebtSnapshot";
import { SpendBySource } from "./widgets/SpendBySource";
import { OwnerTransfers } from "./widgets/OwnerTransfers";
import { RecentActivity } from "./widgets/RecentActivity";
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
          <div className="border-t border-[var(--border-subtle)] pt-3">
            <DebtSnapshot debtRows={debtRows} />
          </div>
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
          <div className="border-t border-[var(--border-subtle)] pt-3">
            <SpendBySource spendBySourceRows={spendBySourceRows} />
          </div>
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
          <div className="border-t border-[var(--border-subtle)] pt-3">
            <OwnerTransfers
              ownerTransfersMtd={ownerTransfersMtd}
              ownerTransfersMtdTotal={ownerTransfersMtdTotal}
            />
          </div>
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
          <div className="border-t border-[var(--border-subtle)] pt-3">
            <RecentActivity recentActivity={recentActivity} />
          </div>
        </AccordionContent>
      </AccordionItem>
    </>
  );
}
