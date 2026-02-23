import { useTranslation } from "react-i18next";
import { TrendingUp, TrendingDown } from "lucide-react";
import { AreaChart, Area } from "recharts";
import { ResponsiveContainer } from "recharts";
import { formatCurrency } from "@/lib/format";
import { DsHelpTooltip, DsMetricCard } from "@/components/ds";
import type { WidgetSize } from "@/lib/widgets/widget";

interface SparklineRow {
  monthKey: string;
  netCashFlow: number;
}

interface NetCashFlowProps {
  netCashFlow: number;
  sparklineRows?: SparklineRow[];
  size?: WidgetSize;
}

export function NetCashFlow({ netCashFlow, sparklineRows, size = "sm" }: NetCashFlowProps) {
  const { t } = useTranslation();
  const tone = netCashFlow >= 0 ? "positive" : "negative";

  // sm: single metric + label only
  if (size === "sm") {
    return (
      <DsMetricCard
        title={t("dashboard.kpiNetCashFlowMtd")}
        value={formatCurrency(netCashFlow)}
        tone={tone}
      />
    );
  }

  // md: metric + trend icon + tooltip + sparkline
  const Icon = netCashFlow >= 0 ? TrendingUp : TrendingDown;
  const sparkColor = netCashFlow >= 0 ? "var(--viz-series-3)" : "var(--destructive)";
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
      sparklineBottom={size === "lg"}
      sparkline={
        sparklineRows && sparklineRows.length > 1 ? (
          <ResponsiveContainer width={size === "lg" ? "100%" : "75%"} height={20}>
            <AreaChart data={sparklineRows}>
              <defs>
                <linearGradient id="ncfSpark" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={sparkColor} stopOpacity={0.3} />
                  <stop offset="100%" stopColor={sparkColor} stopOpacity={0.03} />
                </linearGradient>
              </defs>
              <Area type="monotone" dataKey="netCashFlow" stroke={sparkColor} fill="url(#ncfSpark)" strokeWidth={1.5} dot={false} isAnimationActive={false} />
            </AreaChart>
          </ResponsiveContainer>
        ) : undefined
      }
    />
  );
}
