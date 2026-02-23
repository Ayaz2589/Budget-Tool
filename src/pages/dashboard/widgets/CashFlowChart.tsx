import { useTranslation } from "react-i18next";
import {
  Bar,
  BarChart,
  CartesianGrid,
  XAxis,
  YAxis,
} from "recharts";
import { formatCurrency } from "@/lib/format";
import { cn } from "@/lib/utils";
import { DsChartCard, DsEmptyState, DsHelpTooltip } from "@/components/ds";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import type { WidgetSize } from "@/lib/widgets/widget";

const INCOME_OWNER_COLORS = [
  "var(--viz-series-1)",
  "var(--viz-series-2)",
  "var(--viz-series-3)",
  "var(--viz-series-4)",
  "var(--viz-series-5)",
  "#EC4899",
];

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

interface CashFlowDisplayRow {
  monthKey: string;
  monthLabel: string;
  monthAxisLabel: string;
  incomeTotal: number;
  expensesTotal: number;
  debtPaymentsTotal: number;
  incomeByOwner: Record<string, number>;
}

interface CashFlowChartProps {
  cashFlowDisplayRows: CashFlowDisplayRow[];
  incomeOwnerKeys: string[];
  includeDebtPayments: boolean;
  size?: WidgetSize;
}

export function CashFlowChart({
  cashFlowDisplayRows,
  incomeOwnerKeys,
  includeDebtPayments,
  size,
}: CashFlowChartProps) {
  const { t } = useTranslation();
  const effectiveSize: WidgetSize = size ?? "md";

  const chartTitle = effectiveSize === "lg" ? (
    <span className="inline-flex items-center gap-1.5">
      {t("dashboard.chartIncomeVsExpenses")}
      <DsHelpTooltip
        content={t("dashboard.help.chartIncomeVsExpenses")}
        ariaLabel={t("common.help")}
      />
    </span>
  ) : t("dashboard.chartIncomeVsExpenses");

  if (cashFlowDisplayRows.length === 0) {
    return (
      <DsChartCard title={chartTitle} className="min-w-0" size={effectiveSize}>
        <DsEmptyState title={t("dashboard.chartNoDataRange")} className="py-4" />
      </DsChartCard>
    );
  }

  // sm: summary metric
  if (effectiveSize === "sm") {
    const totalIncome = cashFlowDisplayRows.reduce((sum, row) => sum + row.incomeTotal, 0);
    const totalExpenses = cashFlowDisplayRows.reduce(
      (sum, row) => sum + row.expensesTotal + (includeDebtPayments ? row.debtPaymentsTotal : 0),
      0,
    );
    const delta = totalIncome - totalExpenses;
    return (
      <DsChartCard title={chartTitle} className="min-w-0" size={effectiveSize}>
        <div className="space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground">{t("dashboard.chartIncome")}</span>
            <span className="text-sm font-semibold text-emerald-500">{formatCurrency(totalIncome)}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground">{t("dashboard.chartExpenses")}</span>
            <span className="text-sm font-semibold text-destructive">{formatCurrency(totalExpenses)}</span>
          </div>
          <div className="border-t border-border/60 pt-1 flex items-center justify-between">
            <span className="text-xs font-medium text-muted-foreground">{t("dashboard.netCashflow")}</span>
            <span className={cn("text-sm font-bold", delta >= 0 ? "text-emerald-500" : "text-destructive")}>
              {formatCurrency(delta)}
            </span>
          </div>
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

  // lg (~588×664px): full chart with per-owner stacked bars, legend, axis labels
  if (effectiveSize === "lg") {
    return (
      <DsChartCard title={chartTitle} className="min-w-0" size={effectiveSize}>
        <ChartContainer
          config={{
            expenses: { label: t("dashboard.chartExpenses"), color: "var(--viz-expense)" },
            ...(includeDebtPayments
              ? { debtPayments: { label: t("dashboard.chartDebtPayments"), color: "var(--viz-debt)" } }
              : {}),
          }}
          heightMobile={220}
          heightDesktop={380}
        >
          <BarChart data={cashFlowDisplayRows}>
            <CartesianGrid vertical={false} />
            <XAxis dataKey="monthAxisLabel" interval={0} tickMargin={8} minTickGap={0} />
            <YAxis />
            <ChartTooltip content={tooltipContent} />
            {incomeOwnerKeys.map((owner, index) => (
              <Bar
                key={owner}
                dataKey={`incomeByOwner.${owner}`}
                name={t("dashboard.chartIncomeOwner", { owner })}
                fill={INCOME_OWNER_COLORS[index % INCOME_OWNER_COLORS.length]}
                stackId="income"
                radius={index === incomeOwnerKeys.length - 1 ? [4, 4, 0, 0] : 0}
              />
            ))}
            <Bar dataKey="expensesTotal" name={t("dashboard.chartExpenses")} fill="var(--viz-expense)" stackId="outflow" />
            {includeDebtPayments ? (
              <Bar dataKey="debtPaymentsTotal" name={t("dashboard.chartDebtPayments")} fill="var(--viz-debt)" stackId="outflow" />
            ) : null}
          </BarChart>
        </ChartContainer>
      </DsChartCard>
    );
  }

  // md (~290×216px): compact chart, no legend, minimal axis labels
  return (
    <DsChartCard title={chartTitle} className="min-w-0" size={effectiveSize}>
      <ChartContainer
        config={{
          income: { label: t("dashboard.chartIncome"), color: INCOME_OWNER_COLORS[0] },
          expenses: { label: t("dashboard.chartExpenses"), color: "var(--viz-expense)" },
          ...(includeDebtPayments
            ? { debtPayments: { label: t("dashboard.chartDebtPayments"), color: "var(--viz-debt)" } }
            : {}),
        }}
        heightMobile={200}
        heightDesktop={280}
      >
        <BarChart
          data={cashFlowDisplayRows}
          margin={{ top: 4, right: 24, left: -4, bottom: 2 }}
        >
          <CartesianGrid vertical={false} />
          <XAxis
            dataKey="monthAxisLabel"
            tick={{ fontSize: 11 }}
            tickMargin={8}
            minTickGap={18}
            interval="preserveStartEnd"
            padding={{ left: 0, right: 8 }}
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
          <ChartTooltip content={tooltipContent} />
          <Bar dataKey="incomeTotal" name={t("dashboard.chartIncome")} fill="var(--viz-income)" radius={[4, 4, 0, 0]} />
          <Bar
            dataKey="expensesTotal"
            name={t("dashboard.chartExpenses")}
            fill="var(--viz-expense)"
            radius={[4, 4, 0, 0]}
            stackId="outflow"
          />
          {includeDebtPayments ? (
            <Bar
              dataKey="debtPaymentsTotal"
              name={t("dashboard.chartDebtPayments")}
              fill="var(--viz-debt)"
              radius={[4, 4, 0, 0]}
              stackId="outflow"
            />
          ) : null}
        </BarChart>
      </ChartContainer>
    </DsChartCard>
  );
}
