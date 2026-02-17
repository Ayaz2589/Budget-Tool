import { useTranslation } from "react-i18next";
import {
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { WidgetSmartInsights } from "./widgets/WidgetSmartInsights";
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
    <AccordionItem
      value="insights"
      data-tour="dashboard-insights"
      className="rounded-2xl border border-border/60 bg-card px-4"
    >
      <AccordionTrigger className="cursor-pointer py-4 text-base font-semibold hover:no-underline">
        {t("dashboard.sectionSmartInsightsAlerts")}
      </AccordionTrigger>
      <AccordionContent className="pb-3 pt-0">
        <div className="border-t border-[var(--border-subtle)] pt-3">
          <WidgetSmartInsights insights={insights} onDismiss={onDismiss} />
        </div>
      </AccordionContent>
    </AccordionItem>
  );
}
