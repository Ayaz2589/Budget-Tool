import { useTranslation } from "react-i18next";
import {
  AreaChart,
  Area,
  CartesianGrid,
  ReferenceLine,
  XAxis,
  YAxis,
} from "recharts";
import { formatCurrency } from "@/lib/format";
import { DsChartCard, DsEmptyState, DsHelpTooltip } from "@/components/ds";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import type { DashboardRange } from "@/types/dashboard";
import type { WidgetSize } from "@/types/widget";

function asNumber(value: unknown): number {
  if (typeof value === "number") return value;
  if (typeof value === "string") {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : 0;
  }
  return 0;
}

function monthLabelFromTooltipPayload(payload: unknown): string {
  if (!Array.isArray(payload) || payload.length === 0) return "";
  const first = payload[0] as { payload?: { monthLabel?: string } };
  return first?.payload?.monthLabel ?? "";
}

interface NetCashFlowRow {
  monthKey: string;
  monthLabel: string;
  monthAxisLabel: string;
  netCashFlow: number;
}

interface NetTrendChartProps {
  netCashFlowRows: NetCashFlowRow[];
  range: DashboardRange;
  size?: WidgetSize;
}

export function NetTrendChart({
  netCashFlowRows,
  range,
  size,
}: NetTrendChartProps) {
  const { t } = useTranslation();
  const effectiveSize: WidgetSize = size ?? "md";

  const chartTitle = effectiveSize === "lg" || effectiveSize === "wide-lg" ? (
    <span className="inline-flex items-center gap-1.5">
      {t("dashboard.chartNetCashFlowTrend")}
      <DsHelpTooltip
        content={t("dashboard.help.chartNetCashFlow")}
        ariaLabel={t("common.help")}
      />
    </span>
  ) : t("dashboard.chartNetCashFlowTrend");

  if (netCashFlowRows.length === 0) {
    return (
      <DsChartCard title={chartTitle} className="min-w-0" size={effectiveSize}>
        <DsEmptyState title={t("dashboard.chartNoNetCashFlowData")} className="py-4" />
      </DsChartCard>
    );
  }

  // sm: always show summary metric (latest net cash flow)
  if (effectiveSize === "sm") {
    const latestNet = netCashFlowRows[netCashFlowRows.length - 1]?.netCashFlow ?? 0;
    return (
      <DsChartCard title={chartTitle} className="min-w-0" size={effectiveSize}>
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground/90">
            {t("dashboard.chartCurrentMonthNetCashFlow")}
          </p>
          <p
            className={
              latestNet >= 0
                ? "mt-1 text-2xl font-semibold leading-tight text-emerald-500"
                : "mt-1 text-2xl font-semibold leading-tight text-destructive"
            }
          >
            {formatCurrency(latestNet)}
          </p>
        </div>
      </DsChartCard>
    );
  }

  // md/lg: range="current" shows single metric
  if (range === "current") {
    return (
      <DsChartCard title={chartTitle} className="min-w-0" size={effectiveSize}>
        <div className="rounded-2xl border border-border bg-card px-4 py-4 md:px-5 md:py-5">
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground/90">
            {t("dashboard.chartCurrentMonthNetCashFlow")}
          </p>
          <p
            className={
              (netCashFlowRows[0]?.netCashFlow ?? 0) >= 0
                ? "mt-2 text-3xl font-semibold leading-tight text-emerald-500"
                : "mt-2 text-3xl font-semibold leading-tight text-destructive"
            }
          >
            {formatCurrency(netCashFlowRows[0]?.netCashFlow ?? 0)}
          </p>
          <p className="mt-2 text-sm text-muted-foreground">
            {t("dashboard.chartTrendSwitchHint")}
          </p>
        </div>
      </DsChartCard>
    );
  }

  const tooltipContent = (
    <ChartTooltipContent
      className="min-w-[16rem] bg-card border-border px-4 py-3 text-sm shadow-md"
      labelClassName="text-sm font-semibold"
      labelFormatter={(_, payload) => monthLabelFromTooltipPayload(payload)}
      valueFormatter={(value) => formatCurrency(asNumber(value))}
    />
  );

  const chartConfig = {
    netCashFlow: { label: t("dashboard.chartNetCashFlow"), color: "var(--viz-series-3)" },
  };

  // wide-lg (~588×220px): compact chart with axis labels
  if (effectiveSize === "wide-lg") {
    return (
      <DsChartCard title={chartTitle} className="min-w-0" size={effectiveSize}>
        <ChartContainer config={chartConfig} heightMobile={140} heightDesktop={160}>
          <AreaChart data={netCashFlowRows}>
            <defs>
              <linearGradient id="netCashFlowAreaWlg" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="var(--viz-series-3)" stopOpacity={0.35} />
                <stop offset="75%" stopColor="var(--viz-series-3)" stopOpacity={0.14} />
                <stop offset="100%" stopColor="var(--viz-series-3)" stopOpacity={0.03} />
              </linearGradient>
            </defs>
            <CartesianGrid vertical={false} />
            <XAxis dataKey="monthAxisLabel" tick={{ fontSize: 11 }} tickMargin={8} minTickGap={18} interval="preserveStartEnd" />
            <YAxis tick={{ fontSize: 11 }} width={34} tickFormatter={(value) => {
              const abs = Math.abs(Number(value));
              if (abs >= 1000) return `${Math.round(Number(value) / 1000)}k`;
              return String(Math.round(Number(value)));
            }} />
            <ReferenceLine y={0} stroke="rgba(255,255,255,0.25)" />
            <ChartTooltip content={tooltipContent} />
            <Area
              type="monotone"
              dataKey="netCashFlow"
              name={t("dashboard.chartNetCashFlow")}
              stroke="var(--viz-series-3)"
              fill="url(#netCashFlowAreaWlg)"
              strokeWidth={2}
              dot={false}
              activeDot={{ r: 4 }}
              isAnimationActive={false}
            />
          </AreaChart>
        </ChartContainer>
      </DsChartCard>
    );
  }

  // md (~290×216px): compact chart, no legend
  return (
    <DsChartCard title={chartTitle} className="min-w-0" size={effectiveSize}>
      <ChartContainer config={chartConfig} heightMobile={110} heightDesktop={110}>
        <AreaChart
          data={netCashFlowRows}
          margin={{ top: 4, right: 24, left: -6, bottom: 2 }}
        >
          <defs>
            <linearGradient id="netCashFlowAreaMd" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="var(--viz-series-3)" stopOpacity={0.3} />
              <stop offset="75%" stopColor="var(--viz-series-3)" stopOpacity={0.12} />
              <stop offset="100%" stopColor="var(--viz-series-3)" stopOpacity={0.02} />
            </linearGradient>
          </defs>
          <CartesianGrid vertical={false} />
          <XAxis
            dataKey="monthAxisLabel"
            tick={{ fontSize: 11 }}
            tickMargin={8}
            minTickGap={18}
            interval="preserveStartEnd"
            padding={{ left: 0, right: 10 }}
          />
          <YAxis
            tick={{ fontSize: 11 }}
            width={34}
            tickFormatter={(value) => {
              const abs = Math.abs(Number(value));
              if (abs >= 1000) return `${Math.round(Number(value) / 1000)}k`;
              return String(Math.round(Number(value)));
            }}
          />
          <ReferenceLine y={0} stroke="rgba(255,255,255,0.25)" />
          <ChartTooltip content={tooltipContent} />
          <Area
            type="monotone"
            dataKey="netCashFlow"
            name={t("dashboard.chartNetCashFlow")}
            stroke="var(--viz-series-3)"
            fill="url(#netCashFlowAreaMd)"
            strokeWidth={2}
            dot={false}
            activeDot={{ r: 4 }}
            isAnimationActive={false}
          />
        </AreaChart>
      </ChartContainer>
    </DsChartCard>
  );
}
