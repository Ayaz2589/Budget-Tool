import { useTranslation } from "react-i18next";
import { formatCurrency } from "@/lib/format";
import { DsHelpTooltip, DsMetricCard } from "@/components/ds";
import type { WidgetSize } from "@/types/widget";

interface WidgetKpiNetCashFlowProps {
  netCashFlow: number;
  size?: WidgetSize;
}

export function WidgetKpiNetCashFlow({ netCashFlow, size = "md" }: WidgetKpiNetCashFlowProps) {
  const { t } = useTranslation();

  if (size === "sm") {
    return (
      <DsMetricCard
        title={t("dashboard.kpiNetCashFlowMtd")}
        value={formatCurrency(netCashFlow)}
        tone={netCashFlow >= 0 ? "positive" : "negative"}
      />
    );
  }

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
      value={formatCurrency(netCashFlow)}
      tone={netCashFlow >= 0 ? "positive" : "negative"}
    />
  );
}
