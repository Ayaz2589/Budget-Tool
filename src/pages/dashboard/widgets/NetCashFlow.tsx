import { useTranslation } from "react-i18next";
import { TrendingUp, TrendingDown } from "lucide-react";
import { formatCurrency } from "@/lib/format";
import { DsHelpTooltip, DsMetricCard } from "@/components/ds";
import type { WidgetSize } from "@/types/widget";

interface NetCashFlowProps {
  netCashFlow: number;
  size?: WidgetSize;
}

export function NetCashFlow({ netCashFlow, size = "sm" }: NetCashFlowProps) {
  const { t } = useTranslation();
  const tone = netCashFlow >= 0 ? "positive" : "negative";

  // sm (~141×104px): single metric + label only
  if (size === "sm" || size === "wide") {
    return (
      <DsMetricCard
        title={t("dashboard.kpiNetCashFlowMtd")}
        value={formatCurrency(netCashFlow)}
        tone={tone}
      />
    );
  }

  // md (~290×216px): metric + trend icon + tooltip
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
