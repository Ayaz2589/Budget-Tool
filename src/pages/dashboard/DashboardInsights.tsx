import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { DsEmptyState } from "@/components/ds";
import type { DashboardInsight } from "@/types/dashboard";

interface DashboardInsightsProps {
  insights: DashboardInsight[];
  onDismiss: (id: string) => void;
}

export function DashboardInsights({
  insights,
  onDismiss,
}: DashboardInsightsProps) {
  const { t } = useTranslation();

  return (
    <Accordion type="multiple" defaultValue={["insights"]}>
    <AccordionItem
      value="insights"
      data-tour="dashboard-insights"
      className="rounded-2xl border border-border/60 bg-card px-4"
    >
      <AccordionTrigger className="cursor-pointer py-4 text-base font-semibold hover:no-underline">
        {t("dashboard.sectionSmartInsightsAlerts")}
      </AccordionTrigger>
      <AccordionContent className="pb-3 pt-0">
        {insights.length === 0 ? (
          <div className="border-t border-[var(--border-subtle)] pt-3">
            <DsEmptyState title={t("dashboard.sectionNoAlerts")} className="py-4" />
          </div>
        ) : (
          <div className="space-y-2 border-t border-[var(--border-subtle)] pt-3">
            {insights.map((insight) => (
              <div
                key={insight.id}
                className="flex items-start justify-between gap-3 border border-border/60 rounded-md px-3 py-2"
              >
                <p className="text-sm">{t(insight.messageKey, insight.messageValues)}</p>
                <Button
                  variant="ghost"
                  size="sm"
                  density="compact"
                  className="h-8 px-2 text-xs"
                  onClick={() => onDismiss(insight.id)}
                >
                  {t("dashboard.dismiss")}
                </Button>
              </div>
            ))}
          </div>
        )}
      </AccordionContent>
    </AccordionItem>
    </Accordion>
  );
}
