import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { DsEmptyState } from "@/components/ds";
import type { DashboardInsight } from "@/types/dashboard";
import type { WidgetSize } from "@/types/widget";

interface WidgetSmartInsightsProps {
  insights: DashboardInsight[];
  onDismiss: (id: string) => void;
  size?: WidgetSize;
}

export function WidgetSmartInsights({
  insights,
  onDismiss,
  size = "md",
}: WidgetSmartInsightsProps) {
  const { t } = useTranslation();
  const displayInsights = size === "sm" ? insights.slice(0, 2) : insights;

  return (
    <div className="space-y-2">
      <h3 className="px-4 py-3 text-base font-semibold">{t("dashboard.sectionSmartInsightsAlerts")}</h3>
      {insights.length === 0 ? (
        <DsEmptyState title={t("dashboard.sectionNoAlerts")} className="py-4" />
      ) : (
        displayInsights.map((insight) => (
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
        ))
      )}
    </div>
  );
}
