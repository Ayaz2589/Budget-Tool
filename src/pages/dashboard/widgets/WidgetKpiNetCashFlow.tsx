import { useTranslation } from "react-i18next";
import { TrendingUp, TrendingDown } from "lucide-react";
import { formatCurrency } from "@/lib/format";
import { DsHelpTooltip, DsMetricCard } from "@/components/ds";
import type { WidgetSize } from "@/types/widget";

interface WidgetKpiNetCashFlowProps {
  netCashFlow: number;
  size?: WidgetSize;
}

export function WidgetKpiNetCashFlow({ netCashFlow, size = "md" }: WidgetKpiNetCashFlowProps) {
  const { t } = useTranslation();
  const effectiveSize: WidgetSize = (["sm", "md", "lg"] as const).includes(size) ? size : "md";
  const tone = netCashFlow >= 0 ? "positive" : "negative";

  if (effectiveSize === "lg") {
    const Icon = netCashFlow >= 0 ? TrendingUp : TrendingDown;
    return (
      <DsMetricCard
        title={
          <span className="inline-flex items-center gap-1.5">
            {t("dashboard.kpiNetCashFlowMtd")}
            <DsHelpTooltip
              content={t("dashboard.help.kpiNetCashFlow")}
              ariaLabel={t("common.help")}
            />
          </span>
        }
        value={
          <span className="inline-flex items-center gap-2">
            {formatCurrency(netCashFlow)}
            <Icon className="size-5" />
          </span>
        }
        tone={tone}
      />
    );
  }

  // sm and md: title text only, value
  return (
    <DsMetricCard
      title={t("dashboard.kpiNetCashFlowMtd")}
      value={formatCurrency(netCashFlow)}
      tone={tone}
    />
  );
}
