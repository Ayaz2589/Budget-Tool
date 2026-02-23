import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { DsEmptyState } from "@/components/ds";
import type { DashboardInsight } from "@/types/dashboard";
import type { WidgetSize } from "@/lib/widgets/widget";

interface SmartInsightsProps {
  insights: DashboardInsight[];
  onDismiss: (id: string) => void;
  size?: WidgetSize;
}

export function SmartInsights({
  insights,
  onDismiss,
  size = "sm",
}: SmartInsightsProps) {
  const { t } = useTranslation();

  if (insights.length === 0) {
    return (
      <div>
        <h3 className="text-xs font-medium text-muted-foreground">{t("dashboard.sectionSmartInsightsAlerts")}</h3>
        <DsEmptyState title={t("dashboard.sectionNoAlerts")} className="py-2" />
      </div>
    );
  }

  // sm (~141×104px) / wide (~290×104px): single top insight as a one-liner
  if (size === "sm") {
    const top = insights[0];
    return (
      <div>
        <h3 className="text-xs font-medium text-muted-foreground">{t("dashboard.sectionSmartInsightsAlerts")}</h3>
        <p className="mt-1 text-sm leading-snug line-clamp-2">
          {t(top.messageKey, top.messageValues)}
        </p>
      </div>
    );
  }

  // md (~290×216px): multiple insights in a scrollable list
  return (
    <div className="space-y-2">
      <h3 className="px-4 py-3 text-base font-semibold">{t("dashboard.sectionSmartInsightsAlerts")}</h3>
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
  );
}
